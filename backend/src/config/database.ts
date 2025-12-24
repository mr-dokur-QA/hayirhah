import { PrismaClient } from '@prisma/client';

// Global Prisma Client instance
let prisma: PrismaClient;

// Singleton pattern for Prisma Client
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to avoid exhausting connection limit
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  prisma = globalForPrisma.prisma;
}

// Database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
};

export { prisma };
export default prisma; 