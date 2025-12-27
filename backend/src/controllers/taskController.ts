import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Task status types
const TASK_STATUSES = ['available', 'assigned', 'completed'] as const;

// Numbered (counter) group types - no per-item tasks (new groups)
// Backward compatible: if a group already has Task rows, we keep treating it as sectioned.
const NUMBERED_TYPES = ['tefriciye', 'yasin', 'fetih', '1000_ihlas', 'custom_sayi'] as const;

// Validation schemas
const assignTaskSchema = z.union([
  z.object({
    taskId: z.string().min(1, 'Task ID is required'),
  }),
  z.object({
    amount: z.number().min(1, 'Amount must be at least 1'),
  }),
]);

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

    // Check group type for numbered assignments
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, type: true, targetCount: true },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
      });
      return;
    }

    // For numbered groups, return numbered task assignments as task-like objects.
    // Backward compat: if tasks already exist, keep returning tasks.
    if (NUMBERED_TYPES.includes(group.type as any)) {
      const existingTaskCount = await prisma.task.count({ where: { groupId } });
      if (existingTaskCount > 0) {
        // fall through to legacy task listing
      } else {
      const assignments = await prisma.numberedTaskAssignment.findMany({
        where: { groupId },
        include: {
          user: { select: { id: true, username: true } },
        },
        orderBy: [{ assignedAt: 'asc' }],
      });

      const data = assignments.map((a, idx) => ({
        id: a.id,
        groupId: a.groupId,
        taskIndex: idx + 1,
        assignedTo: a.userId,
        assignedToUsername: a.userUsername,
        status: a.isCompleted ? 'completed' : 'assigned',
        amount: a.assignedCount,
        assignedAt: a.assignedAt,
        completedAt: a.isCompleted ? a.completedAt : null,
        assignee: a.user,
      }));

      res.status(200).json({
        message: 'Group tasks retrieved successfully',
        data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length,
        },
      });
      return;
      }
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

    // For numbered groups we expect { amount }, for sectioned groups { taskId }
    const body: any = validation.data;

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

    // Check group type
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, type: true, targetCount: true, isActive: true },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
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

    if (NUMBERED_TYPES.includes(group.type as any)) {
      const existingTaskCount = await prisma.task.count({ where: { groupId } });
      if (existingTaskCount > 0) {
        // Legacy sectioned group: expect taskId
      } else {
      const amount = body.amount as number | undefined;
      if (!amount || amount < 1) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Amount is required for numbered groups',
        });
        return;
      }

      // Remaining = targetCount - total committed assignedCount
      const totals = await prisma.numberedTaskAssignment.aggregate({
        where: { groupId },
        _sum: { assignedCount: true },
      });
      const committed = totals._sum.assignedCount ?? 0;
      const remaining = group.targetCount - committed;

      if (amount > remaining) {
        res.status(400).json({
          error: 'Not enough remaining',
          message: `Remaining count is ${remaining}`,
        });
        return;
      }

      // Her görev alımı ayrı bir kayıt olarak oluşturulur
      const assignment = await prisma.numberedTaskAssignment.create({
        data: {
          groupId,
          userId: req.user.userId,
          userUsername: req.user.username,
          assignedCount: amount,
          completedCount: 0,
          isCompleted: false,
        },
      });

      res.status(200).json({
        message: 'Numbered task assigned successfully',
        data: assignment,
      });
      return;
      }
    }

    const taskId = body.taskId as string | undefined;
    if (!taskId) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Task ID is required',
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
        assignedToUsername: req.user.username,
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

    const { taskId } = validation.data as any;

    // Check group type first
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, type: true, targetCount: true },
    });

    if (!group) {
      res.status(404).json({
        error: 'Group not found',
        message: 'The requested group does not exist',
      });
      return;
    }

    if (NUMBERED_TYPES.includes(group.type as any)) {
      const existingTaskCount = await prisma.task.count({ where: { groupId } });
      if (existingTaskCount > 0) {
        // Legacy sectioned group: treat as normal task completion
      } else {
      // taskId is NumberedTaskAssignment.id
      const assignment = await prisma.numberedTaskAssignment.findUnique({
        where: { id: taskId },
      });

      if (!assignment || assignment.groupId !== groupId) {
        res.status(404).json({
          error: 'Assignment not found',
          message: 'The requested assignment does not exist',
        });
        return;
      }

      if (assignment.userId !== req.user.userId) {
        res.status(403).json({
          error: 'Access denied',
          message: 'You can only complete your own assignments',
        });
        return;
      }

      if (assignment.isCompleted) {
        res.status(400).json({
          error: 'Already completed',
          message: 'This assignment has already been completed',
        });
        return;
      }

      const updatedAssignment = await prisma.numberedTaskAssignment.update({
        where: { id: assignment.id },
        data: {
          completedCount: assignment.assignedCount,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Tüm tamamlanan görevlerin toplamını hesapla
      const totals = await prisma.numberedTaskAssignment.aggregate({
        where: { 
          groupId,
          isCompleted: true,
        },
        _sum: { assignedCount: true },
      });
      const completed = totals._sum.assignedCount ?? 0;

      await prisma.group.update({
        where: { id: groupId },
        data: { currentProgress: completed },
      });

      res.status(200).json({
        message: 'Numbered assignment completed successfully',
        data: updatedAssignment,
      });
      return;
      }
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
    // Cevşen için amount toplamını hesapla, diğerleri için görev sayısını
    const completedTasks = await prisma.task.findMany({
      where: {
        groupId,
        status: 'completed',
      },
      select: {
        amount: true,
      },
    });

    // Eğer görevlerde amount varsa (cevşen gibi), toplamı al
    // Yoksa (hatim gibi), görev sayısını al
    const hasAmount = completedTasks.some(t => t.amount != null && t.amount > 0);
    const completedProgress = hasAmount 
      ? completedTasks.reduce((sum, t) => sum + (t.amount ?? 0), 0)
      : completedTasks.length;

    await prisma.group.update({
      where: { id: groupId },
      data: {
        currentProgress: completedProgress,
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