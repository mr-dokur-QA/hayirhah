export interface PrayerNotificationItem {
  id: string; // 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi'
  timingKey: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  turkishName: string;
  arabicName: string;
  description: string;
  iconType: 'sunrise' | 'sun' | 'sunset' | 'moon';
}

export const PRAYER_DEFINITIONS: PrayerNotificationItem[] = [
  {
    id: 'imsak',
    timingKey: 'Fajr',
    turkishName: 'İmsak / Sabah',
    arabicName: 'الفجر',
    description: 'Sabah namazı ve imsak vakti bildirimi',
    iconType: 'sunrise',
  },
  {
    id: 'gunes',
    timingKey: 'Sunrise',
    turkishName: 'Güneş Doğumu',
    arabicName: 'الشروق',
    description: 'Güneş doğuşu ve kerahet vakti başlangıcı',
    iconType: 'sun',
  },
  {
    id: 'ogle',
    timingKey: 'Dhuhr',
    turkishName: 'Öğle Namazı',
    arabicName: 'الظهر',
    description: 'Öğle ezanı ve cemaatle namaz vakti',
    iconType: 'sun',
  },
  {
    id: 'ikindi',
    timingKey: 'Asr',
    turkishName: 'İkindi Namazı',
    arabicName: 'العصر',
    description: 'İkindi ezanı ve ikindi namazı vakti',
    iconType: 'sunset',
  },
  {
    id: 'aksam',
    timingKey: 'Maghrib',
    turkishName: 'Akşam Namazı',
    arabicName: 'المغرب',
    description: 'Akşam ezanı ve iftar vakti bildirimi',
    iconType: 'sunset',
  },
  {
    id: 'yatsi',
    timingKey: 'Isha',
    turkishName: 'Yatsı Namazı',
    arabicName: 'العشاء',
    description: 'Yatsı ezanı ve vitir namazı bildirimi',
    iconType: 'moon',
  },
];

export const PRAYER_NOTIF_STORAGE_KEY = 'hayirhah_prayer_notifications_v2';

const TIMING_MAP: Record<string, string> = {
  imsak: 'Fajr',
  gunes: 'Sunrise',
  ogle: 'Dhuhr',
  ikindi: 'Asr',
  aksam: 'Maghrib',
  yatsi: 'Isha',
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  Fajr: 'Fajr',
  Sunrise: 'Sunrise',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

export const DEFAULT_PRAYER_NOTIFICATIONS: Record<string, boolean> = {
  Fajr: true,
  Sunrise: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true,
};

export const NotificationSettingsService = {
  getSettings(): Record<string, boolean> {
    if (typeof window === 'undefined') return { ...DEFAULT_PRAYER_NOTIFICATIONS };
    try {
      const stored = localStorage.getItem(PRAYER_NOTIF_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PRAYER_NOTIFICATIONS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse prayer notifications from localStorage', e);
    }
    return { ...DEFAULT_PRAYER_NOTIFICATIONS };
  },

  saveSettings(settings: Record<string, boolean>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PRAYER_NOTIF_STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(
        new CustomEvent('prayer_notifications_updated', {
          detail: settings,
        })
      );
    } catch (e) {
      console.warn('Failed to save prayer notifications to localStorage', e);
    }
  },

  isPrayerEnabled(keyOrTiming: string): boolean {
    const timingKey = TIMING_MAP[keyOrTiming] || keyOrTiming;
    const settings = this.getSettings();
    return settings[timingKey] !== false;
  },

  togglePrayer(keyOrTiming: string): boolean {
    const timingKey = TIMING_MAP[keyOrTiming] || keyOrTiming;
    const current = this.getSettings();
    const nextVal = !current[timingKey];
    const updated = { ...current, [timingKey]: nextVal };
    this.saveSettings(updated);
    return nextVal;
  },

  setAll(enabled: boolean) {
    const updated: Record<string, boolean> = {
      Fajr: enabled,
      Sunrise: enabled,
      Dhuhr: enabled,
      Asr: enabled,
      Maghrib: enabled,
      Isha: enabled,
    };
    this.saveSettings(updated);
    return updated;
  },
};
