import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { prisma } from '../config/database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id: string; // Keep for backward compatibility
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided',
      });
      return;
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Account is deactivated',
      });
      return;
    }

    // Add user to request object
    req.user = {
      ...decoded,
      id: decoded.userId, // For backward compatibility
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      error: 'Authentication failed',
      message: errorMessage,
    });
  }
};

/**
 * Optional authentication middleware - adds user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Try to verify the token
    try {
      const decoded = verifyAccessToken(token);

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isVerified: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          ...decoded,
          id: decoded.userId,
        };
      }
    } catch (tokenError) {
      // Invalid token, but we don't fail - just continue without user
      console.warn('Invalid token in optional auth:', tokenError);
    }

    next();
  } catch (error) {
    // Log the error but don't fail the request
    console.error('Error in optional auth middleware:', error);
    next();
  }
};

/**
 * Require verified user middleware
 */
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'No authenticated user',
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource',
    });
    return;
  }

  next();
};

/**
 * Role-based authorization middleware factory
 */
export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    // For now, we'll implement basic role checking
    // This can be extended when we add roles to the user model
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          // Add role field when implementing role system
        },
      });

      if (!user) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'User not found',
        });
        return;
      }

      // TODO: Implement actual role checking when role system is added
      // For now, all authenticated users are considered 'user' role
      const userRole = 'user';
      
      if (!roles.includes(userRole)) {
        res.status(403).json({
          error: 'Access forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Authorization check failed',
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();

    const userRequests = requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset window
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds`,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      });
      return;
    }

    // Increment count
    userRequests.count++;
    next();
  };
}; 