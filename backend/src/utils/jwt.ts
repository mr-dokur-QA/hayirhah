import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Environment variables with defaults for development
const JWT_SECRET = process.env.JWT_SECRET || 'hayirhah-dev-secret-key-min-32-chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hayirhah-dev-refresh-secret-key-min-32-chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  isVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'hayirhah-api',
    audience: 'hayirhah-app',
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const payload = {
    userId,
    tokenId: crypto.randomUUID(),
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    issuer: 'hayirhah-api',
    audience: 'hayirhah-app',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (user: {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
}): TokenPair => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    isVerified: user.isVerified,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'hayirhah-api',
      audience: 'hayirhah-app',
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; tokenId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'hayirhah-api',
      audience: 'hayirhah-app',
    }) as { userId: string; tokenId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.userId,
      tokenId: decoded.tokenId,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

/**
 * Get token expiration time in seconds
 */
export const getTokenExpirationTime = (expiresIn: string): number => {
  const timeMap: { [key: string]: number } = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));

  return value * (timeMap[unit] || 1);
}; 