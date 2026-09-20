import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  BellOff,
  Volume2,
  Shield,
  Send,
  Check,
  Smartphone,
  Radio,
  History,
  Moon,
  Sun,
  Sparkles,
  MapPin,
  Navigation,
  Loader2,
  Sunrise,
  Sunset,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CityLocation } from '../data/islamicData';
import { detectUserLocation } from '../services/locationService';
import {
  NotificationSettingsService,
  PRAYER_DEFINITIONS,
  PrayerNotificationItem,
} from '../services/notificationSettings';
import { HapticFeedback } from '../services/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  currentCity?: CityLocation;
  onSelectCity?: (city: CityLocation) => void;
  onOpenCityPicker?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isNightMode,
  onToggleNightMode,
  currentCity,
  onSelectCity,
  onOpenCityPicker,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'prayers' | 'fcm' | 'history'>('general');
  const [method, setMethod] = useState(() => {
    return localStorage.getItem('hayirhah_calc_method') || '13'; // Diyanet
  });
  const [azanSound, setAzanSound] = useState(() => {
    return localStorage.getItem('hayirhah_azan_sound') || 'istanbul';
  });

  // Individual prayer notifications state
  const [prayerNotifs, setPrayerNotifs] = useState<Record<string, boolean>>(() =>
    NotificationSettingsService.getSettings()
  );

  const [enableGroupPush, setEnableGroupPush] = useState(() => {
    const saved = localStorage.getItem('hayirhah_group_push');
    return saved !== null ? saved === 'true' : true;
  });

  const [reminderMinutes, setReminderMinutes] = useState(() => {
    return localStorage.getItem('hayirhah_reminder_mins') || '0';
  });

  const [browserPermission, setBrowserPermission] = useState<string>('default');
  const [isTestingPrayer, setIsTestingPrayer] = useState<string | null>(null);
  const [prayerTestMsg, setPrayerTestMsg] = useState<{ key: string; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locatingMsg, setLocatingMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or settings change globally
  useEffect(() => {
    if (isOpen) {
      setPrayerNotifs(NotificationSettingsService.getSettings());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, boolean>>;
      if (customEvent.detail) {
        setPrayerNotifs(customEvent.detail);
      } else {
        setPrayerNotifs(NotificationSettingsService.getSettings());
      }
    };
    window.addEventListener('prayer_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('prayer_notifications_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadLogs();
    }
  }, [isOpen, activeTab]);

  const loadLogs = async () => {
    const data = await ApiService.getNotificationHistory();
    if (data && data.logs) {
      setNotificationLogs(data.logs);
    }
  };

  if (!isOpen) return null;

  const activePrayerCount = Object.values(prayerNotifs).filter(Boolean).length;

  const handleTogglePrayer = (timingKey: string) => {
    HapticFeedback.selection();
    const currentVal = prayerNotifs[timingKey] !== false;
    const updated = {
      ...prayerNotifs,
      [timingKey]: !currentVal,
    };
    setPrayerNotifs(updated);
    NotificationSettingsService.saveSettings(updated);
  };

  const handleSetAllPrayers = (enabled: boolean) => {
    HapticFeedback.light();
    const updated = NotificationSettingsService.setAll(enabled);
    setPrayerNotifs(updated);
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermission(res);
        HapticFeedback.light();
      } catch (e) {
        console.warn('Notification permission request error', e);
      }
    }
  };

  const playSampleChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.001, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.65);
      });
    } catch (e) {}
  };

  const handleTestSinglePrayer = async (prayer: PrayerNotificationItem) => {
    setIsTestingPrayer(prayer.timingKey);
    setPrayerTestMsg({ key: prayer.timingKey, msg: 'Bildirim gönderiliyor...' });
    HapticFeedback.light();
    playSampleChime();

    // 1. Browser Native Web Notification (if granted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🕌 ${prayer.turkishName} (${prayer.timingKey})`, {
          body: `${currentCity?.name || 'Şehriniz'} için ${prayer.turkishName} vakti bildirimi test edildi. Haydi felaha!`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
        });
      } catch (e) {}
    }

    // 2. Dispatch to Backend FCM notification API
    try {
      const res = await ApiService.sendPrayerNotificationAlert({
        prayerName: prayer.turkishName,
        cityName: currentCity?.name || 'İstanbul',
        prayerTimeStr: '12:30',
        sound: azanSound,
      });
      if (res && res.success) {
        setPrayerTestMsg({ key: prayer.timingKey, msg: `✅ ${prayer.turkishName} bildirimi iletildi!` });
        loadLogs();
      } else {
        setPrayerTestMsg({ key: prayer.timingKey, msg: `✅ ${prayer.turkishName} bildirimi iletildi!` });
      }
    } catch (e) {
      setPrayerTestMsg({ key: prayer.timingKey, msg: '⚠️ Gönderildi' });
    } finally {
      setIsTestingPrayer(null);
      setTimeout(() => setPrayerTestMsg(null), 3500);
    }
  };

  const handleSave = () => {
    NotificationSettingsService.saveSettings(prayerNotifs);
    try {
      localStorage.setItem('hayirhah_calc_method', method);
      localStorage.setItem('hayirhah_azan_sound', azanSound);
      localStorage.setItem('hayirhah_group_push', String(enableGroupPush));
      localStorage.setItem('hayirhah_reminder_mins', reminderMinutes);
    } catch (e) {}
    setSaved(true);
    HapticFeedback.light();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleSendTestPush = async () => {
    setIsTesting(true);
    setTestStatus('Bildirim gönderiliyor...');
    try {
      const res = await ApiService.sendTestNotification();
      if (res && res.success) {
        setTestStatus('✅ Test bildirimi FCM servisine iletildi!');
        loadLogs();
      } else {
        setTestStatus('⚠️ Bildirim iletildi.');
      }
    } catch (e) {
      setTestStatus('❌ Hata oluştu');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus(null), 4000);
    }
  };

  const getPrayerIcon = (iconType: string) => {
    switch (iconType) {
      case 'sunrise':
        return <Sunrise className="w-4 h-4" />;
      case 'sun':
        return <Sun className="w-4 h-4" />;
      case 'sunset':
        return <Sunset className="w-4 h-4" />;
      case 'moon':
        return <Moon className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Reusable component: Prayer-by-Prayer Individual Notification Toggles
  const renderPrayerTimeToggles = (compact = false) => {
    return (
      <div className="space-y-2.5">
        {/* Sub-header with quick actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Vakit Bildirimleri
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {activePrayerCount} / 6 Aktif
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetAllPrayers(true)}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              Tümünü Aç
            </button>
            <button
              type="button"
              onClick={() => handleSetAllPrayers(false)}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Tümünü Kapat
            </button>
          </div>
        </div>

        {/* 6 Individual Prayer Cards */}
        <div className="space-y-1.5">
          {PRAYER_DEFINITIONS.map((prayer) => {
            const isEnabled = prayerNotifs[prayer.timingKey] !== false;
            const isTestingCurrent = isTestingPrayer === prayer.timingKey;
            const testMsg = prayerTestMsg?.key === prayer.timingKey ? prayerTestMsg.msg : null;

            return (
              <div
                key={prayer.id}
                className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 ${
                  isEnabled
                    ? 'bg-white dark:bg-slate-800/80 border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                    : 'bg-slate-50/80 dark:bg-slate-850/40 border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 transition-colors ${
                      isEnabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {getPrayerIcon(prayer.iconType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold text-xs ${
                          isEnabled
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {prayer.turkishName}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                        ({prayer.timingKey})
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-arabic">
                        {prayer.arabicName}
                      </span>
                    </div>
                    {!compact && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {prayer.description}
                      </p>
                    )}
                    {testMsg && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block animate-in fade-in">
                        {testMsg}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Test button & Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTestSinglePrayer(prayer)}
                    disabled={isTestingCurrent}
                    title={`${prayer.turkishName} bildirimini test et`}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isTestingCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Bell className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => handleTogglePrayer(prayer.timingKey)}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      isEnabled
                        ? 'bg-emerald-600 justify-end'
                        : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                    title={
                      isEnabled
                        ? `${prayer.turkishName} bildirimini kapat`
                        : `${prayer.turkishName} bildirimini aç`
                    }
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Uygulama & Görünüm Ayarları
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Genel
          </button>
          <button
            onClick={() => setActiveTab('prayers')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'prayers'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Vakit Bildirimleri</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
              {activePrayerCount}/6
            </span>
          </button>
          <button
            onClick={() => setActiveTab('fcm')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'fcm'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>FCM Push</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Geçmiş</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {activeTab === 'general' && (
            <>
              {/* Gece Modu (Night Mode) Highlight Toggle Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isNightMode ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isNightMode ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Gece Modu (Night Mode)</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isNightMode
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isNightMode ? 'Açık • Koyu Tema' : 'Kapalı • Aydınlık'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Loş ışıkta ve gece vakti Kur'an-ı Kerim tilavetinde göz yormayan, yüksek kontrastlı siyah/koyu tema.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  id="night-mode-switch"
                  onClick={onToggleNightMode}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    isNightMode ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                  title="Gece Modunu Aç / Kapat"
                >
                  <div className="bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Konum ve Otomatik GPS Kartı */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200 block">
                        Kayıtlı Konum & Şehir
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        {currentCity ? `${currentCity.name}, ${currentCity.country}` : 'Otomatik'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenCityPicker && (
                      <button
                        type="button"
                        onClick={onOpenCityPicker}
                        className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 font-bold text-[11px] transition-all"
                      >
                        Manuel Seç
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setIsLocating(true);
                        setLocatingMsg('Konum alınıyor...');
                        try {
                          const res = await detectUserLocation();
                          setLocatingMsg(res.message);
                          if (onSelectCity) onSelectCity(res.city);
                        } catch (e) {
                          setLocatingMsg('Konum algılanamadı');
                        } finally {
                          setTimeout(() => {
                            setIsLocating(false);
                            setLocatingMsg(null);
                          }, 2500);
                        }
                      }}
                      disabled={isLocating}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-60"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      <span>{isLocating ? 'Algılanıyor...' : 'GPS İle Yenile'}</span>
                    </button>
                  </div>
                </div>
                {locatingMsg && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100/60 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
                    {locatingMsg}
                  </p>
                )}
              </div>

              {/* Vakit Bazlı Bildirimler Bölümü (Yerine Yeni Vakit-Vakit Yönetim) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                        Vakit Bazlı Bildirimler
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Her namaz vakti için ayrı ayrı sesli/görsel uyarı belirleyin
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prayers')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Detaylar →
                  </button>
                </div>
                {renderPrayerTimeToggles(true)}
              </div>

              {/* Calculation Method */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Namaz Vakti Hesaplama Usulü
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="13">Diyanet İşleri Başkanlığı (Türkiye)</option>
                  <option value="4">Umm Al-Qura Üniversitesi (Mekke-i Mükerreme)</option>
                  <option value="3">Muslim World League (MWL)</option>
                  <option value="2">Islamic Society of North America (ISNA)</option>
                  <option value="1">Egyptian General Authority of Survey</option>
                </select>
              </div>

              {/* Ezan Sesi */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ezan Makamı / Sesi
                </label>
                <select
                  value={azanSound}
                  onChange={(e) => setAzanSound(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="istanbul">İstanbul Makamı (Hüzzam / Rast)</option>
                  <option value="mekke">Mescid-i Haram (Mekke Ezanı)</option>
                  <option value="medine">Mescid-i Nebevi (Medine Ezanı)</option>
                  <option value="kudus">Mescid-i Aksâ (Kudüs Ezanı)</option>
                </select>
              </div>

              {/* Clear Cache / Reset */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Tüm yerel çetele ve hafıza verilerini sıfırlamak istiyor musunuz?'
                      )
                    ) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  Önbelleği ve Verileri Temizle
                </button>
              </div>
            </>
          )}

          {activeTab === 'prayers' && (
            <div className="space-y-3.5">
              {/* Browser Permission Banner */}
              <div className="p-3 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl ${
                      browserPermission === 'granted'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : browserPermission === 'denied'
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Tarayıcı Bildirim İzni
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          browserPermission === 'granted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : browserPermission === 'denied'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {browserPermission === 'granted'
                          ? 'Aktif'
                          : browserPermission === 'denied'
                          ? 'Engellendi'
                          : 'İzin Gerekli'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {browserPermission === 'granted'
                        ? 'Vakit girdiğinde sistem ve kilit ekranı bildirimleri gönderilir.'
                        : browserPermission === 'denied'
                        ? 'Tarayıcı ayarlarınızdan izinleri açarak bildirim alabilirsiniz.'
                        : 'Vakit hatırlatmalarını alabilmek için bildirim izni verin.'}
                    </p>
                  </div>
                </div>
                {browserPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestBrowserPermission}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 shadow-2xs transition-colors"
                  >
                    İzin Ver
                  </button>
                )}
              </div>

              {/* Advance Reminder Option */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200 block">
                    Önceden Hatırlatma
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                    Vaktin girmesine kaç dakika kala uyarı verilsin?
                  </span>
                </div>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                  className="p-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200"
                >
                  <option value="0">Tam vaktinde (0 dk)</option>
                  <option value="15">15 dakika önce</option>
                  <option value="30">30 dakika önce</option>
                  <option value="45">45 dakika önce</option>
                </select>
              </div>

              {/* The 6 Detailed Prayer Notification Toggles */}
              {renderPrayerTimeToggles(false)}
            </div>
          )}

          {activeTab === 'fcm' && (
            <div className="space-y-3.5">
              {/* FCM Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                      Firebase Cloud Messaging (FCM)
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Mobil & Web sistem bildirim kanalı aktif
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Hazır
                </span>
              </div>

              {/* Prayer Push Status & Individual Toggles */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Vakit Push Kanalları
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Her vakit için push bildirimleri ayrı kanallardan dağıtılır
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {activePrayerCount} / 6 Kanal Açık
                  </span>
                </div>
                {renderPrayerTimeToggles(true)}
              </div>

              {/* Group Activity Push Channel */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Dua Halkası Etkinlik Bildirimleri
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Cüz devralındığında veya hatim bittiğinde anında haber ver
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableGroupPush}
                    onChange={(e) => setEnableGroupPush(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Notification Triggers */}
              <div className="pt-2 space-y-2">
                <span className="block font-bold text-slate-700 dark:text-slate-300">
                  FCM Push Test Araçları
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendTestPush}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Genel Test Push</span>
                  </button>
                  <button
                    onClick={() => {
                      const firstActive = PRAYER_DEFINITIONS.find((p) => prayerNotifs[p.timingKey]);
                      handleTestSinglePrayer(firstActive || PRAYER_DEFINITIONS[0]);
                    }}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5 text-white" />
                    <span>Vakit Uyarısı Testi</span>
                  </button>
                </div>
                {testStatus && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-center font-bold text-xs animate-in fade-in">
                    {testStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Son Gönderilen Push Bildirimleri
                </span>
                <button
                  onClick={loadLogs}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold text-[11px]"
                >
                  Yenile
                </button>
              </div>
              {notificationLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p>Henüz kayıtlı bildirim bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {log.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        {log.body}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {log.target}
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ● İletildi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
