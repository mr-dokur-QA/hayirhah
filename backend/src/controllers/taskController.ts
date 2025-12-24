import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Task status types
const TASK_STATUSES = ['available', 'assigned', 'completed'] as const;

// Validation schemas
const assignTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

const completeTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  amount: z.number().min(1).optional(),
});

/**
 * Get group tasks
 */
export const getGroupTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;
    const { status, assignedTo, page = '1', limit = '50' } = req.query;

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

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = { groupId };
    if (status && TASK_STATUSES.includes(status as any)) {
      whereClause.status = status;
    }
    if (assignedTo === 'me') {
      whereClause.assignedTo = req.user.userId;
    } else if (assignedTo === 'unassigned') {
      whereClause.assignedTo = null;
    } else if (assignedTo && assignedTo !== 'all') {
      whereClause.assignedTo = assignedTo;
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
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
        skip,
        take: limitNum,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      message: 'Group tasks retrieved successfully',
      data: tasks,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('Get group tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get group tasks',
    });
  }
};

/**
 * Assign task to current user
 */
export const assignTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;
    const validation = assignTaskSchema.safeParse(req.body);

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

    const { taskId } = validation.data;

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

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        group: true,
      },
    });

    if (!task) {
      res.status(404).json({
        error: 'Task not found',
        message: 'The requested task does not exist',
      });
      return;
    }

    if (task.groupId !== groupId) {
      res.status(400).json({
        error: 'Invalid task',
        message: 'Task does not belong to this group',
      });
      return;
    }

    if (task.status !== 'available') {
      res.status(400).json({
        error: 'Task not available',
        message: 'This task is already assigned or completed',
      });
      return;
    }

    // Check if group is active
    if (!task.group.isActive) {
      res.status(400).json({
        error: 'Group inactive',
        message: 'This group is no longer active',
      });
      return;
    }

    // Assign task to user
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedTo: req.user.userId,
        status: 'assigned',
        assignedAt: new Date(),
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Task assigned successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to assign task',
    });
  }
};

/**
 * Complete assigned task
 */
export const completeTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;
    const validation = completeTaskSchema.safeParse(req.body);

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

    const { taskId } = validation.data;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        group: true,
      },
    });

    if (!task) {
      res.status(404).json({
        error: 'Task not found',
        message: 'The requested task does not exist',
      });
      return;
    }

    if (task.groupId !== groupId) {
      res.status(400).json({
        error: 'Invalid task',
        message: 'Task does not belong to this group',
      });
      return;
    }

    if (task.assignedTo !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only complete tasks assigned to you',
      });
      return;
    }

    if (task.status === 'completed') {
      res.status(400).json({
        error: 'Task already completed',
        message: 'This task has already been completed',
      });
      return;
    }

    // Complete the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Update group progress
    const completedCount = await prisma.task.count({
      where: {
        groupId,
        status: 'completed',
      },
    });

    await prisma.group.update({
      where: { id: groupId },
      data: {
        currentProgress: completedCount,
      },
    });

    res.status(200).json({
      message: 'Task completed successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to complete task',
    });
  }
};

/**
 * Unassign task (return to available)
 */
export const unassignTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId, taskId } = req.params;

    if (!groupId || !taskId) {
      res.status(400).json({
        error: 'Missing parameters',
        message: 'Group ID and Task ID are required',
      });
      return;
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      res.status(404).json({
        error: 'Task not found',
        message: 'The requested task does not exist',
      });
      return;
    }

    if (task.groupId !== groupId) {
      res.status(400).json({
        error: 'Invalid task',
        message: 'Task does not belong to this group',
      });
      return;
    }

    // Check permissions: user can unassign their own tasks, or group admin/creator can unassign any task
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

    const canUnassign = task.assignedTo === req.user.userId || 
                       membership.role === 'creator' || 
                       membership.role === 'admin';

    if (!canUnassign) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only unassign your own tasks or if you are a group admin',
      });
      return;
    }

    if (task.status === 'completed') {
      res.status(400).json({
        error: 'Cannot unassign',
        message: 'Cannot unassign a completed task',
      });
      return;
    }

    // Unassign the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedTo: null,
        status: 'available',
        assignedAt: null,
      },
    });

    res.status(200).json({
      message: 'Task unassigned successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to unassign task',
    });
  }
};

/**
 * Get task statistics for a group
 */
export const getTaskStatistics = async (req: Request, res: Response): Promise<void> => {
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
      select: {
        id: true,
        title: true,
        type: true,
        targetCount: true,
        currentProgress: true,
      },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
      });
      return;
    }

    // Get task statistics
    const [
      totalTasks,
      completedTasks,
      assignedTasks,
      availableTasks,
      memberProgress,
    ] = await Promise.all([
      prisma.task.count({
        where: { groupId },
      }),
      prisma.task.count({
        where: { groupId, status: 'completed' },
      }),
      prisma.task.count({
        where: { groupId, status: 'assigned' },
      }),
      prisma.task.count({
        where: { groupId, status: 'available' },
      }),
      prisma.task.groupBy({
        by: ['assignedTo'],
        where: {
          groupId,
          status: 'completed',
          assignedTo: { not: null },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get member details for progress
    const memberIds = memberProgress.map(mp => mp.assignedTo).filter(Boolean);
    const members = await prisma.user.findMany({
      where: {
        id: { in: memberIds as string[] },
      },
      select: {
        id: true,
        username: true,
      },
    });

    const memberProgressWithNames = memberProgress.map(mp => {
      const member = members.find(m => m.id === mp.assignedTo);
      return {
        userId: mp.assignedTo,
        username: member?.username || 'Unknown',
        completedTasks: mp._count.id,
      };
    }).sort((a, b) => b.completedTasks - a.completedTasks);

    const statistics = {
      group: {
        id: group.id,
        title: group.title,
        type: group.type,
        targetCount: group.targetCount,
        currentProgress: group.currentProgress,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        assigned: assignedTasks,
        available: availableTasks,
        completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      memberProgress: memberProgressWithNames,
      userStats: {
        completedTasks: memberProgressWithNames.find(mp => mp.userId === req.user?.userId)?.completedTasks || 0,
        assignedTasks: await prisma.task.count({
          where: {
            groupId,
            assignedTo: req.user.userId,
            status: 'assigned',
          },
        }),
      },
    };

    res.status(200).json({
      message: 'Task statistics retrieved successfully',
      data: statistics,
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get task statistics',
    });
  }
};

/**
 * Get available tasks (tasks that can be assigned)
 */
export const getAvailableTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { groupId } = req.params;
    const { limit = '10' } = req.query;

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

    const limitNum = parseInt(limit as string);

    const availableTasks = await prisma.task.findMany({
      where: {
        groupId,
        status: 'available',
      },
      orderBy: {
        taskIndex: 'asc',
      },
      take: limitNum,
    });

    res.status(200).json({
      message: 'Available tasks retrieved successfully',
      data: availableTasks,
      count: availableTasks.length,
    });
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get available tasks',
    });
  }
};

/**
 * Get user's assigned tasks across all groups
 */
export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { status = 'assigned', page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      assignedTo: req.user.userId,
    };

    if (status && TASK_STATUSES.includes(status as any)) {
      whereClause.status = status;
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          group: {
            select: {
              id: true,
              title: true,
              type: true,
              isActive: true,
            },
          },
        },
        orderBy: [
          { assignedAt: 'desc' },
          { taskIndex: 'asc' },
        ],
        skip,
        take: limitNum,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      message: 'User tasks retrieved successfully',
      data: tasks,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user tasks',
    });
  }
}; 