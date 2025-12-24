import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database
import { connectDatabase, disconnectDatabase } from './config/database';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import prayerTrackingRoutes from './routes/prayerTracking';
import groupRoutes from './routes/groups';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      `${process.env.MOBILE_APP_SCHEME || 'hayirhah'}://`,
    ],
    credentials: true,
  })
);

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test database connection
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/prayer-tracking', prayerTrackingRoutes);
app.use('/api/groups', groupRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Connect to database
  await connectDatabase();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await disconnectDatabase();
  process.exit(0);
});

export default app; 