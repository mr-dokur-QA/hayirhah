import { Router } from 'express';
import { authenticate, rateLimit } from '../middleware/auth';
import { registerDeviceToken, unregisterDeviceToken, sendTestNotification } from '../controllers/notificationController';

const router = Router();

const notifRateLimit = rateLimit(200, 15 * 60 * 1000);

router.post('/device', authenticate, notifRateLimit, registerDeviceToken);
router.delete('/device', authenticate, notifRateLimit, unregisterDeviceToken);
router.post('/test', authenticate, notifRateLimit, sendTestNotification);

export default router;


