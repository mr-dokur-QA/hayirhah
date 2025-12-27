import { Router } from 'express';
import { generateReport } from '../controllers/aiReportController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Rate limiting for AI reports (prevent abuse)
const aiRateLimit = rateLimit(10, 60 * 1000); // 10 requests per minute

/**
 * @route   POST /api/ai-report/generate
 * @desc    Generate AI prayer report
 * @access  Private
 */
router.post('/generate', authenticate, aiRateLimit, generateReport);

/**
 * @route   GET /api/ai-report/test
 * @desc    Test AI report endpoint
 * @access  Public
 */
router.get('/test', (_req, res) => {
  res.json({
    message: 'AI Report endpoint is working',
    timestamp: new Date().toISOString(),
    usage: {
      endpoint: 'POST /api/ai-report/generate',
      body: {
        type: 'daily | weekly | monthly',
        startDate: 'optional ISO date string',
      },
    },
  });
});

export default router;

