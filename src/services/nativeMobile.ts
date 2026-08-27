import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NativeMobile = {
  isNative: () => Capacitor.isNativePlatform(),
  getPlatform: () => Capacitor.getPlatform(), // 'ios' | 'android' | 'web'

  /**
   * Initialize native mobile settings on application startup
   */
  init: async (isNightMode: boolean) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 1. Configure Status Bar
      await NativeMobile.syncStatusBar(isNightMode);

      // 2. Hide Splash screen after app renders
      await SplashScreen.hide({
        fadeOutDuration: 350,
      });

      // 3. Request Local Notification permissions if not granted
      await NativeMobile.requestNotificationPermission();
    } catch (e) {
      console.warn('NativeMobile initialization warning:', e);
    }
  },

  /**
   * Sync Status Bar with App Theme (Light/Dark Mode)
   */
  syncStatusBar: async (isNightMode: boolean) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (isNightMode) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#090D16' });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#064E3B' });
      }
    } catch (e) {
      console.warn('Could not update status bar:', e);
    }
  },

  /**
   * Request Notification Permissions for Ezan and Hatim alerts
   */
  requestNotificationPermission: async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('Notification permission check failed:', e);
      return false;
    }
  },

  /**
   * Schedule a Native Prayer / Hatim Notification
   */
  scheduleNotification: async (title: string, body: string, at: Date, id: number = 100) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at },
            sound: 'adhan_chime.wav',
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (e) {
      console.warn('Failed to schedule native notification:', e);
    }
  },
};
