import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Prayer types
const FARD_PRAYERS = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
const SUNNAH_PRAYERS = ['teheccud', 'duha', 'evvabin', 'tespih'] as const;

// Validation schemas
const updatePrayerSchema = z.object({
  prayer: z.enum(FARD_PRAYERS),
  isCompleted: z.boolean(),
  completedSunnet: z.boolean().optional(),
  completedTesbihat: z.boolean().optional(),
});

const updateSunnahSchema = z.object({
  prayer: z.enum(SUNNAH_PRAYERS),
  isCompleted: z.boolean(),
});


/**
 * Get daily prayer tracking record
 */
export const getDailyRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const date = req.params.date as string;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }

    // Find existing record
    let prayerRecord = await prisma.prayerTracking.findUnique({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
    });

    // If no record exists, create a default one
    if (!prayerRecord) {
      const defaultRecord = {
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
      };

      prayerRecord = await prisma.prayerTracking.create({
        data: {
          userId: req.user.userId,
          date: new Date(date),
          fardPrayers: defaultRecord.fardPrayers,
          sunnahPrayers: defaultRecord.sunnahPrayers,
          kazaPrayers: defaultRecord.kazaPrayers,
          quranReadingPages: 0,
        },
      });
    }

    res.status(200).json({
      message: 'Daily record retrieved successfully',
      data: prayerRecord,
    });
  } catch (error) {
    console.error('Get daily record error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get daily record',
    });
  }
};

/**
 * Update daily prayer tracking record
 */
export const updateDailyRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const date = req.params.date as string;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }

    const { fardPrayers, sunnahPrayers, kazaPrayers, quranReadingPages } = req.body;

    // Build update data object
    const updateData: any = {};
    if (fardPrayers !== undefined) updateData.fardPrayers = fardPrayers;
    if (sunnahPrayers !== undefined) updateData.sunnahPrayers = sunnahPrayers;
    if (kazaPrayers !== undefined) updateData.kazaPrayers = kazaPrayers;
    if (quranReadingPages !== undefined) updateData.quranReadingPages = quranReadingPages;
    updateData.userUsername = req.user.username;

    // Upsert prayer tracking record
    const updatedRecord = await prisma.prayerTracking.upsert({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
      update: updateData,
      create: {
        userId: req.user.userId,
        userUsername: req.user.username,
        date: new Date(date),
        fardPrayers: fardPrayers || {},
        sunnahPrayers: sunnahPrayers || {},
        kazaPrayers: kazaPrayers || {},
        quranReadingPages: quranReadingPages ?? 0,
      },
    });

    res.status(200).json({
      message: 'Daily record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update daily record error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update daily record',
    });
  }
};

/**
 * Update specific fard prayer
 */
export const updateFardPrayer = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const date = req.params.date as string;
    const validation = updatePrayerSchema.safeParse(req.body);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { prayer, isCompleted, completedSunnet, completedTesbihat } = validation.data;

    // Get existing record
    const existingRecord = await prisma.prayerTracking.findUnique({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
    });

    const currentFardPrayers = (existingRecord?.fardPrayers as any) || {};
    
    // Update the specific prayer
    currentFardPrayers[prayer] = {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : null,
      completedSunnet: completedSunnet ?? false,
      completedTesbihat: completedTesbihat ?? false,
    };

    // Upsert the record
    const updatedRecord = await prisma.prayerTracking.upsert({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
      update: {
        fardPrayers: currentFardPrayers,
        userUsername: req.user.username,
      },
      create: {
        userId: req.user.userId,
        userUsername: req.user.username,
        date: new Date(date),
        fardPrayers: currentFardPrayers,
        sunnahPrayers: {},
        kazaPrayers: {},
        quranReadingPages: 0,
      },
    });

    res.status(200).json({
      message: 'Fard prayer updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update fard prayer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update fard prayer',
    });
  }
};

/**
 * Update sunnah prayer
 */
export const updateSunnahPrayer = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const date = req.params.date as string;
    const validation = updateSunnahSchema.safeParse(req.body);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }

    const { prayer, isCompleted } = validation.data;

    // Get existing record
    const existingRecord = await prisma.prayerTracking.findUnique({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
    });

    const currentSunnahPrayers = (existingRecord?.sunnahPrayers as any) || {};
    currentSunnahPrayers[prayer] = isCompleted;

    // Upsert the record
    const updatedRecord = await prisma.prayerTracking.upsert({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
      update: {
        sunnahPrayers: currentSunnahPrayers,
        userUsername: req.user.username,
      },
      create: {
        userId: req.user.userId,
        userUsername: req.user.username,
        date: new Date(date),
        fardPrayers: {},
        sunnahPrayers: currentSunnahPrayers,
        kazaPrayers: {},
        quranReadingPages: 0,
      },
    });

    res.status(200).json({
      message: 'Sunnah prayer updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update sunnah prayer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update sunnah prayer',
    });
  }
};

/**
 * Update kaza prayers
 */
export const updateKazaPrayers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const date = req.params.date as string;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }

    const { kazaPrayers } = req.body;

    if (!kazaPrayers) {
      res.status(400).json({
        error: 'Missing data',
        message: 'kazaPrayers field is required',
      });
      return;
    }

    // Upsert the record
    const updatedRecord = await prisma.prayerTracking.upsert({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: new Date(date),
        },
      },
      update: {
        kazaPrayers,
        userUsername: req.user.username,
      },
      create: {
        userId: req.user.userId,
        userUsername: req.user.username,
        date: new Date(date),
        fardPrayers: {},
        sunnahPrayers: {},
        kazaPrayers,
        quranReadingPages: 0,
      },
    });

    res.status(200).json({
      message: 'Kaza prayers updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update kaza prayers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update kaza prayers',
    });
  }
};

/**
 * Get prayer tracking records for a date range
 */
export const getDateRangeRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        error: 'Missing parameters',
        message: 'startDate and endDate are required',
      });
      return;
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate as string) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
      res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format',
      });
      return;
    }

    const records = await prisma.prayerTracking.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json({
      message: 'Date range records retrieved successfully',
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error('Get date range records error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get date range records',
    });
  }
};

/**
 * Get weekly statistics
 */
export const getWeeklyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { startDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    
    // Get start of week (7 days ago)
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);

    const records = await prisma.prayerTracking.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: weekStart,
          lte: start,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate basic statistics
    const stats = {
      totalDays: records.length,
      totalRecords: records.length,
      period: {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: start.toISOString().split('T')[0],
      },
    };

    res.status(200).json({
      message: 'Weekly statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get weekly statistics',
    });
  }
};

/**
 * Get all prayer tracking records for the current user
 */
export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const records = await prisma.prayerTracking.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json({
      message: 'All records retrieved successfully',
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error('Get all records error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get all records',
    });
  }
};

/**
 * Get monthly statistics
 */
export const getMonthlyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user',
      });
      return;
    }

    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;

    // Get first and last day of the month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0);

    const records = await prisma.prayerTracking.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const stats = {
      totalDays: records.length,
      daysInMonth: monthEnd.getDate(),
      totalRecords: records.length,
      period: {
        year: targetYear,
        month: targetMonth,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
      },
    };

    res.status(200).json({
      message: 'Monthly statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get monthly statistics',
    });
  }
}; 