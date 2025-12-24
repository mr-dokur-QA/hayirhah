import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const updateProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').optional(),
  profilePhotoUrl: z.string().url('Invalid URL format').optional(),
});

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { email, username, password } = validation.data;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      res.status(409).json({
        error: 'User already exists',
        message: `A user with this ${field} already exists`,
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        isVerified: false, // Email verification required
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash || '');
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user',
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { refreshToken: token } = validation.data;

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isVerified: true,
            isActive: true,
          },
        },
      },
    });

    if (!storedToken) {
      res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token not found or expired',
      });
      return;
    }

    if (!storedToken.user.isActive) {
      res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated',
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(storedToken.user);

    // Remove old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof Error && error.message.includes('expired')) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Refresh token has expired',
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token',
    });
  }
};

/**
 * Logout user (invalidate refresh token)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { refreshToken: token } = validation.data;

    // Remove refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token },
    });

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout',
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        profilePhotoUrl: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user profile',
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    // Validate input
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const updateData = validation.data;

    // Check if username is taken (if updating username)
    if (updateData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          id: { not: req.user.userId },
        },
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Username taken',
          message: 'This username is already taken',
        });
        return;
      }
    }

    // Filter out undefined values for Prisma
    const filteredUpdateData: Record<string, string> = {};
    if (updateData.username !== undefined) {
      filteredUpdateData.username = updateData.username;
    }
    if (updateData.profilePhotoUrl !== undefined) {
      filteredUpdateData.profilePhotoUrl = updateData.profilePhotoUrl;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: filteredUpdateData,
      select: {
        id: true,
        email: true,
        username: true,
        profilePhotoUrl: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
}; 