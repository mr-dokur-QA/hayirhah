import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptic & Vibration feedback service.
 * Uses Capacitor Haptics on iOS & Android devices,
 * with graceful fallback to browser navigator.vibrate.
 */
export const HapticFeedback = {
  /**
   * Subtle light tap (ideal for zikir count, toggles, tab clicks)
   */
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  },

  /**
   * Medium impact (for taking a cüz, saving settings, committing numbers)
   */
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  },

  /**
   * Heavy impact (for completing a full 33-bead round, reset button)
   */
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    }
  },

  /**
   * Success notification pulse (completing a Hatim, finishing a prayer check)
   */
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 50, 20]);
      }
    }
  },

  /**
   * Selection tick (scrolling numbers or picking items)
   */
  selection: async () => {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  },
};
