import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/authController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Rate limiting for authentication endpoints (relaxed for testing)
const authRateLimit = rateLimit(50, 5 * 60 * 1000); // 50 requests per 5 minutes
const generalRateLimit = rateLimit(100, 5 * 60 * 1000); // 100 requests per 5 minutes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', generalRateLimit, refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Public
 */
router.post('/logout', generalRateLimit, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, generalRateLimit, updateProfile);

/**
 * @route   GET /api/auth/test
 * @desc    Test authentication endpoint
 * @access  Public
 */
router.get('/test', (_req, res) => {
  res.json({ 
    message: 'Auth routes working',
    timestamp: new Date().toISOString(),
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      refresh: 'POST /api/auth/refresh',
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile (requires auth)',
      updateProfile: 'PUT /api/auth/profile (requires auth)',
    }
  });
});

export default router; 