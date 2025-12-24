import * as bcrypt from 'bcryptjs';

// Default rounds for bcrypt hashing (12 is a good balance of security and performance)
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a password with its hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Failed to compare password');
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object with validation results
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let score = 0;

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Maximum length check
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Complexity checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /(.)\1{2,}/,  // Repeated characters (aaa, 111, etc.)
    /123456/,     // Sequential numbers
    /abcdef/,     // Sequential letters
    /qwerty/i,    // QWERTY pattern
    /password/i,  // The word "password"
    /admin/i,     // The word "admin"
    /user/i,      // The word "user"
  ];

  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure');
      score = Math.max(0, score - 1);
    }
  });

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 3) {
    strength = 'weak';
  } else if (score < 5) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Generate a secure random password
 * @param length - Length of the password (default: 12)
 * @returns string - Generated password
 */
export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}; 