import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.string().min(1).optional(),
});

/**
 * Register or update a device push token for the authenticated user.
 * POST /api/notifications/device
 */
export const registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', message: 'No authenticated user' });
      return;
    }

    const validation = registerDeviceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.issues });
      return;
    }

    const { token, platform } = validation.data;

    // Upsert by unique token; if token was previously associated with another user/device, move it.
    const existing = await prisma.deviceToken.findUnique({ where: { token } });
    if (existing) {
      const updated = await prisma.deviceToken.update({
        where: { token },
        data: {
          userId: req.user.userId,
          ...(platform !== undefined ? { platform } : {}),
          lastSeenAt: new Date(),
        },
      });
      res.status(200).json({ message: 'Device token updated', data: updated });
      return;
    }

    const created = await prisma.deviceToken.create({
      data: {
        userId: req.user.userId,
        token,
        ...(platform !== undefined ? { platform } : {}),
        lastSeenAt: new Date(),
      },
    });

    res.status(201).json({ message: 'Device token registered', data: created });
  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to register device token' });
  }
};

/**
 * Unregister a device push token for the authenticated user.
 * DELETE /api/notifications/device
 */
export const unregisterDeviceToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', message: 'No authenticated user' });
      return;
    }

    const validation = registerDeviceSchema.pick({ token: true }).safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.issues });
      return;
    }

    const { token } = validation.data;

    await prisma.deviceToken.deleteMany({
      where: {
        token,
        userId: req.user.userId,
      },
    });

    res.status(200).json({ message: 'Device token unregistered' });
  } catch (error) {
    console.error('Unregister device token error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to unregister device token' });
  }
};


