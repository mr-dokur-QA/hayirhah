import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import crypto from 'crypto';

// Group types
const GROUP_TYPES = ['hatim', 'yasin', 'fetih', 'tefriciye', 'cevsen', 'custom_parca', 'custom_sayi', '1000_ihlas'] as const;

// Task types: 'sectioned' = each item is a separate task (hatim, cevsen), 'numbered' = just a counter (tefriciye, 1000_ihlas)
const SECTIONED_TYPES = ['hatim', 'yasin', 'fetih', 'cevsen', 'custom_parca'] as const;
const NUMBERED_TYPES = ['tefriciye', '1000_ihlas', 'custom_sayi'] as const;

// Validation schemas
const createGroupSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(GROUP_TYPES),
  targetCount: z.number()
    .min(1, 'Target count must be at least 1')
    .max(10000, 'Target count too high')
    .refine((val) => {
      // For numbered types, allow higher counts
      return true;
    }),
  isPrivate: z.boolean().optional().default(false),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

const updateGroupSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  isPrivate: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().length(10, 'Invalid invite code'),
});

// Helper function to generate unique invite code
const generateInviteCode = async (): Promise<string> => {
  let inviteCode: string;
  let isUnique = false;
  
  while (!isUnique) {
    inviteCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    
    const existingGroup = await prisma.group.findUnique({
      where: { inviteCode },
    });
    
    if (!existingGroup) {
      isUnique = true;
      return inviteCode;
    }
  }
  
  throw new Error('Failed to generate unique invite code');
};

// Helper function to create tasks for a group
// Only creates tasks for sectioned types (hatim, cevsen, etc.)
// Numbered types (tefriciye, 1000_ihlas) don't create tasks - they use counters
const createGroupTasks = async (groupId: string, type: string, targetCount: number): Promise<void> => {
  // Only create tasks for sectioned types
  if (!SECTIONED_TYPES.includes(type as any)) {
    // Numbered types: Don't create tasks, progress tracked via counter
    return;
  }

  const tasks = [];
  
  // For sectioned types, create one task per section
  for (let i = 1; i <= targetCount; i++) {
    tasks.push({
      groupId,
      taskIndex: i,
      status: 'available',
    });
  }
  
  // Batch insert for performance
  if (tasks.length > 0) {
    await prisma.task.createMany({
      data: tasks,
    });
  }
};

/**
 * Create a new group
 */
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const validation = createGroupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { title, description, type, targetCount, isPrivate, deadline } = validation.data;

    // Generate unique invite code
    const inviteCode = await generateInviteCode();

    // Create group
    const createData: any = {
      title,
      type,
      targetCount,
      isPrivate: isPrivate || false,
      deadline: deadline ? new Date(deadline) : null,
      inviteCode,
      creatorId: req.user.userId,
    };
    
    if (description !== undefined) {
      createData.description = description;
    }

    const group = await prisma.group.create({
      data: createData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    // Add creator as admin member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.user.userId,
        role: 'creator',
      },
    });

    // Create tasks for the group
    await createGroupTasks(group.id, type, targetCount);

    res.status(201).json({
      message: 'Group created successfully',
      data: group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create group',
    });
  }
};

/**
 * Get user's groups
 */
export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { page = '1', limit = '10', status = 'active' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      members: {
        some: {
          userId: req.user.userId,
        },
      },
    };

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const [groups, totalCount] = await Promise.all([
      prisma.group.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.group.count({
        where: whereClause,
      }),
    ]);

    // Calculate progress for each group
    const groupsWithProgress = await Promise.all(
      groups.map(async (group) => {
        const completedTasks = await prisma.task.count({
          where: {
            groupId: group.id,
            status: 'completed',
          },
        });

        return {
          ...group,
          completedTasks,
          progressPercentage: group.targetCount > 0 ? (completedTasks / group.targetCount) * 100 : 0,
        };
      })
    );

    res.status(200).json({
      message: 'User groups retrieved successfully',
      data: groupsWithProgress,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user groups',
    });
  }
};

/**
 * Get group details
 */
export const getGroupDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'Group ID is required',
      });
      return;
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            taskIndex: 'asc',
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
      });
      return;
    }

    // Calculate statistics
    const completedTasks = group.tasks.filter(task => task.status === 'completed').length;
    const assignedTasks = group.tasks.filter(task => task.status === 'assigned').length;
    const availableTasks = group.tasks.filter(task => task.status === 'available').length;

    const groupStats = {
      totalTasks: group.tasks.length,
      completedTasks,
      assignedTasks,
      availableTasks,
      progressPercentage: group.targetCount > 0 ? (completedTasks / group.targetCount) * 100 : 0,
      totalMembers: group.members.length,
    };

    res.status(200).json({
      message: 'Group details retrieved successfully',
      data: {
        ...group,
        statistics: groupStats,
        userRole: membership.role,
      },
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get group details',
    });
  }
};

/**
 * Update group
 */
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;
    const validation = updateGroupSchema.safeParse(req.body);

    if (!groupId) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'Group ID is required',
      });
      return;
    }

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    // Check if user is creator or admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership || (membership.role !== 'creator' && membership.role !== 'admin')) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only group creators and admins can update group settings',
      });
      return;
    }

    const updateData = validation.data;
    
    // Filter out undefined values for Prisma
    const filteredUpdateData: any = {};
    if (updateData.title !== undefined) {
      filteredUpdateData.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      filteredUpdateData.description = updateData.description;
    }
    if (updateData.isPrivate !== undefined) {
      filteredUpdateData.isPrivate = updateData.isPrivate;
    }
    if (updateData.isActive !== undefined) {
      filteredUpdateData.isActive = updateData.isActive;
    }
    if (updateData.deadline !== undefined) {
      filteredUpdateData.deadline = new Date(updateData.deadline);
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: filteredUpdateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Group updated successfully',
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update group',
    });
  }
};

/**
 * Join group by invite code
 */
export const joinGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const validation = joinGroupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { inviteCode } = validation.data;

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'Invalid invite code',
      });
      return;
    }

    if (!group.isActive) {
      res.status(400).json({
        error: 'Group inactive',
        message: 'This group is no longer active',
      });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user.userId,
        },
      },
    });

    if (existingMembership) {
      res.status(400).json({
        error: 'Already a member',
        message: 'You are already a member of this group',
      });
      return;
    }

    // Add user to group
    const membership = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.user.userId,
        role: 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Successfully joined group',
      data: {
        group,
        membership,
      },
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to join group',
    });
  }
};

/**
 * Leave group
 */
export const leaveGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'Group ID is required',
      });
      return;
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(404).json({
        error: 'Not a member',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Check if user is the creator
    if (membership.role === 'creator') {
      res.status(400).json({
        error: 'Cannot leave',
        message: 'Group creators cannot leave their groups. Transfer ownership or delete the group instead.',
      });
      return;
    }

    // Unassign any tasks assigned to the user
    await prisma.task.updateMany({
      where: {
        groupId,
        assignedTo: req.user.userId,
        status: 'assigned',
      },
      data: {
        assignedTo: null,
        status: 'available',
        assignedAt: null,
      },
    });

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.userId,
        },
      },
    });

    res.status(200).json({
      message: 'Successfully left group',
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to leave group',
    });
  }
};

/**
 * Remove member from group
 */
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId, userId } = req.params;

    if (!groupId || !userId) {
      res.status(400).json({
        error: 'Missing parameters',
        message: 'Group ID and User ID are required',
      });
      return;
    }

    // Check if current user is creator or admin
    const currentUserMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.userId,
        },
      },
    });

    if (!currentUserMembership || (currentUserMembership.role !== 'creator' && currentUserMembership.role !== 'admin')) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only group creators and admins can remove members',
      });
      return;
    }

    // Check if target user is a member
    const targetMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!targetMembership) {
      res.status(404).json({
        error: 'Member not found',
        message: 'User is not a member of this group',
      });
      return;
    }

    // Prevent removing the creator
    if (targetMembership.role === 'creator') {
      res.status(400).json({
        error: 'Cannot remove creator',
        message: 'Group creators cannot be removed',
      });
      return;
    }

    // Unassign any tasks assigned to the user
    await prisma.task.updateMany({
      where: {
        groupId,
        assignedTo: userId,
        status: 'assigned',
      },
      data: {
        assignedTo: null,
        status: 'available',
        assignedAt: null,
      },
    });

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    res.status(200).json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to remove member',
    });
  }
};

/**
 * Delete group
 */
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'Group ID is required',
      });
      return;
    }

    // Check if user is the creator
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
      });
      return;
    }

    if (group.creatorId !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only group creators can delete groups',
      });
      return;
    }

    // Delete group (cascade will handle tasks and members)
    await prisma.group.delete({
      where: { id: groupId },
    });

    res.status(200).json({
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete group',
    });
  }
}; 