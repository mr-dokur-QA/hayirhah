import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  deleteGroup,
} from '../controllers/groupController';
import {
  getGroupTasks,
  assignTask,
  completeTask,
  unassignTask,
  getTaskStatistics,
  getAvailableTasks,
  getUserTasks,
} from '../controllers/taskController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Rate limiting for group/task management endpoints
const groupRateLimit = rateLimit(30, 15 * 60 * 1000); // 30 requests per 15 minutes
const taskRateLimit = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
const statsRateLimit = rateLimit(20, 15 * 60 * 1000); // 20 requests per 15 minutes

/**
 * @route   GET /api/groups/test
 * @desc    Test group and task endpoints
 * @access  Public
 */
router.get('/test', (_req, res) => {
  res.json({ 
    message: 'Group and task routes working',
    timestamp: new Date().toISOString(),
    endpoints: {
      // Group Management
      createGroup: 'POST /api/groups (requires auth)',
      getUserGroups: 'GET /api/groups (requires auth)',
      getGroupDetails: 'GET /api/groups/:groupId (requires auth)',
      updateGroup: 'PUT /api/groups/:groupId (requires auth - admin/creator only)',
      joinGroup: 'POST /api/groups/join (requires auth)',
      leaveGroup: 'POST /api/groups/:groupId/leave (requires auth)',
      removeMember: 'DELETE /api/groups/:groupId/members/:userId (requires auth - admin/creator only)',
      deleteGroup: 'DELETE /api/groups/:groupId (requires auth - creator only)',
      
      // Task Management
      getGroupTasks: 'GET /api/groups/:groupId/tasks (requires auth)',
      assignTask: 'POST /api/groups/:groupId/tasks/assign (requires auth)',
      completeTask: 'POST /api/groups/:groupId/tasks/complete (requires auth)',
      unassignTask: 'DELETE /api/groups/:groupId/tasks/:taskId/assign (requires auth)',
      getTaskStatistics: 'GET /api/groups/:groupId/tasks/stats (requires auth)',
      getAvailableTasks: 'GET /api/groups/:groupId/tasks/available (requires auth)',
      getUserTasks: 'GET /api/groups/my-tasks (requires auth)',
    },
    groupTypes: ['hatim', 'yasin', 'fetih', 'tefriciye', 'custom_parca', 'custom_sayi'],
    taskStatuses: ['available', 'assigned', 'completed'],
    memberRoles: ['creator', 'admin', 'member'],
  });
});

// =============================================================================
// GROUP MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post('/', authenticate, groupRateLimit, createGroup);

/**
 * @route   GET /api/groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', authenticate, groupRateLimit, getUserGroups);

/**
 * @route   GET /api/groups/my-tasks
 * @desc    Get user's assigned tasks across all groups
 * @access  Private
 */
router.get('/my-tasks', authenticate, taskRateLimit, getUserTasks);

/**
 * @route   GET /api/groups/:groupId
 * @desc    Get group details
 * @access  Private
 */
router.get('/:groupId', authenticate, groupRateLimit, getGroupDetails);

/**
 * @route   PUT /api/groups/:groupId
 * @desc    Update group (creator/admin only)
 * @access  Private
 */
router.put('/:groupId', authenticate, groupRateLimit, updateGroup);

/**
 * @route   POST /api/groups/join
 * @desc    Join group by invite code
 * @access  Private
 */
router.post('/join', authenticate, groupRateLimit, joinGroup);

/**
 * @route   POST /api/groups/:groupId/leave
 * @desc    Leave group
 * @access  Private
 */
router.post('/:groupId/leave', authenticate, groupRateLimit, leaveGroup);

/**
 * @route   DELETE /api/groups/:groupId/members/:userId
 * @desc    Remove member from group (creator/admin only)
 * @access  Private
 */
router.delete('/:groupId/members/:userId', authenticate, groupRateLimit, removeMember);

/**
 * @route   DELETE /api/groups/:groupId
 * @desc    Delete group (creator only)
 * @access  Private
 */
router.delete('/:groupId', authenticate, groupRateLimit, deleteGroup);

// =============================================================================
// TASK MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /api/groups/:groupId/tasks
 * @desc    Get group tasks
 * @access  Private
 */
router.get('/:groupId/tasks', authenticate, taskRateLimit, getGroupTasks);

/**
 * @route   GET /api/groups/:groupId/tasks/available
 * @desc    Get available tasks that can be assigned
 * @access  Private
 */
router.get('/:groupId/tasks/available', authenticate, taskRateLimit, getAvailableTasks);

/**
 * @route   GET /api/groups/:groupId/tasks/stats
 * @desc    Get task statistics for a group
 * @access  Private
 */
router.get('/:groupId/tasks/stats', authenticate, statsRateLimit, getTaskStatistics);

/**
 * @route   POST /api/groups/:groupId/tasks/assign
 * @desc    Assign task to current user
 * @access  Private
 */
router.post('/:groupId/tasks/assign', authenticate, taskRateLimit, assignTask);

/**
 * @route   POST /api/groups/:groupId/tasks/complete
 * @desc    Complete assigned task
 * @access  Private
 */
router.post('/:groupId/tasks/complete', authenticate, taskRateLimit, completeTask);

/**
 * @route   DELETE /api/groups/:groupId/tasks/:taskId/assign
 * @desc    Unassign task (return to available)
 * @access  Private
 */
router.delete('/:groupId/tasks/:taskId/assign', authenticate, taskRateLimit, unassignTask);

export default router; 