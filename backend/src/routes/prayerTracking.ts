import { Router } from 'express';
import {
  getDailyRecord,
  updateDailyRecord,
  updateFardPrayer,
  updateSunnahPrayer,
  updateKazaPrayers,
  updateHealthData,
  getDateRangeRecords,
  getWeeklyStats,
  getMonthlyStats,
  getAllRecords,
} from '../controllers/prayerTrackingController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Rate limiting for prayer tracking endpoints
const prayerRateLimit = rateLimit(50, 15 * 60 * 1000); // 50 requests per 15 minutes
const statsRateLimit = rateLimit(20, 15 * 60 * 1000); // 20 requests per 15 minutes

/**
 * @route   GET /api/prayer-tracking/test
 * @desc    Test prayer tracking endpoints
 * @access  Public
 */
router.get('/test', (_req, res) => {
  res.json({ 
    message: 'Prayer tracking routes working',
    timestamp: new Date().toISOString(),
    endpoints: {
      getDailyRecord: 'GET /api/prayer-tracking/:date (requires auth)',
      updateDailyRecord: 'PUT /api/prayer-tracking/:date (requires auth)',
      updateFardPrayer: 'PUT /api/prayer-tracking/:date/fard (requires auth)',
      updateSunnahPrayer: 'PUT /api/prayer-tracking/:date/sunnah (requires auth)',
      updateKazaPrayers: 'PUT /api/prayer-tracking/:date/kaza (requires auth)',
      updateHealthData: 'PUT /api/prayer-tracking/:date/health (requires auth)',
      getDateRangeRecords: 'GET /api/prayer-tracking/range/records?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (requires auth)',
      getWeeklyStats: 'GET /api/prayer-tracking/stats/weekly?startDate=YYYY-MM-DD (requires auth)',
      getMonthlyStats: 'GET /api/prayer-tracking/stats/monthly?year=YYYY&month=MM (requires auth)',
    },
    dataStructure: {
      fardPrayers: {
        sabah: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        ogle: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        ikindi: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        aksam: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        yatsi: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
      },
      sunnahPrayers: {
        teheccud: false,
        duha: false,
        evvabin: false,
        tespih: false,
      },
      kazaPrayers: {
        sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0,
      },
      healthData: {
        waterIntake: 0, // liters (0-20)
        exerciseHours: 0, // hours (0-24)
        quranPages: 0, // pages (0-604)
        oralHygiene: false,
        readingHours: 0, // hours (0-24)
      },
    },
  });
});

/**
 * @route   GET /api/prayer-tracking/:date
 * @desc    Get daily prayer tracking record
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 */
router.get('/:date', authenticate, prayerRateLimit, getDailyRecord);

/**
 * @route   PUT /api/prayer-tracking/:date
 * @desc    Update daily prayer tracking record
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 * @body    {object} prayerData - Prayer tracking data
 */
router.put('/:date', authenticate, prayerRateLimit, updateDailyRecord);

/**
 * @route   PUT /api/prayer-tracking/:date/fard
 * @desc    Update specific fard prayer
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 * @body    {object} prayerData - Fard prayer data
 */
router.put('/:date/fard', authenticate, prayerRateLimit, updateFardPrayer);

/**
 * @route   PUT /api/prayer-tracking/:date/sunnah
 * @desc    Update specific sunnah prayer
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 * @body    {object} prayerData - Sunnah prayer data
 */
router.put('/:date/sunnah', authenticate, prayerRateLimit, updateSunnahPrayer);

/**
 * @route   PUT /api/prayer-tracking/:date/kaza
 * @desc    Update kaza prayers
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 * @body    {object} kazaData - Kaza prayer counts
 */
router.put('/:date/kaza', authenticate, prayerRateLimit, updateKazaPrayers);

/**
 * @route   PUT /api/prayer-tracking/:date/health
 * @desc    Update health data
 * @access  Private
 * @param   {string} date - Date in YYYY-MM-DD format
 * @body    {object} healthData - Health tracking data
 */
router.put('/:date/health', authenticate, prayerRateLimit, updateHealthData);

/**
 * @route   GET /api/prayer-tracking/all
 * @desc    Get all prayer tracking records for the current user
 * @access  Private
 */
router.get('/all', authenticate, statsRateLimit, getAllRecords);

/**
 * @route   GET /api/prayer-tracking/range/records
 * @desc    Get prayer tracking records for date range
 * @access  Private
 * @query   {string} startDate - Start date in YYYY-MM-DD format
 * @query   {string} endDate - End date in YYYY-MM-DD format
 */
router.get('/range/records', authenticate, statsRateLimit, getDateRangeRecords);

/**
 * @route   GET /api/prayer-tracking/stats/weekly
 * @desc    Get weekly prayer statistics
 * @access  Private
 * @query   {string} startDate - Optional start date (defaults to current date)
 */
router.get('/stats/weekly', authenticate, statsRateLimit, getWeeklyStats);

/**
 * @route   GET /api/prayer-tracking/stats/monthly
 * @desc    Get monthly prayer statistics
 * @access  Private
 * @query   {number} year - Optional year (defaults to current year)
 * @query   {number} month - Optional month (defaults to current month)
 */
router.get('/stats/monthly', authenticate, statsRateLimit, getMonthlyStats);

export default router; 