import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  BellOff,
  MapPin,
  Sparkles,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';
import { CityLocation } from '../data/islamicData';
import { PrayerTimeItem, PrayerTimesData } from '../types';
import { ApiService } from '../services/api';
import { getPrayerTimesForLocation } from '../services/prayerTimeService';
import { NotificationSettingsService } from '../services/notificationSettings';
import { HapticFeedback } from '../services/haptics';

interface PrayerTimesWidgetProps {
  currentCity: CityLocation;
  onOpenCityPicker: () => void;
  onOpenQibla: () => void;
  onOpenIbadet?: () => void;
}

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({
  currentCity,
  onOpenCityPicker,
  onOpenQibla,
  onOpenIbadet,
}) => {
  const [data, setData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>(() =>
    NotificationSettingsService.getSettings()
  );

  // Sync notification toggles with global event
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, boolean>>;
      if (customEvent.detail) {
        setNotifs(customEvent.detail);
      } else {
        setNotifs(NotificationSettingsService.getSettings());
      }
    };
    window.addEventListener('prayer_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('prayer_notifications_updated', handleUpdate);
    };
  }, []);

  // Calculate or fetch prayer times
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadTimes() {
      try {
        const { timings: t, hijriDate } = await getPrayerTimesForLocation(
          currentCity.latitude,
          currentCity.longitude,
          currentCity.name,
          new Date()
        );

        if (t && isMounted) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          const rawList = [
            { id: 'imsak', name: 'Fajr', turkishName: 'İmsak', arabicName: 'الفجر', time: t.Fajr || '05:45' },
            { id: 'gunes', name: 'Sunrise', turkishName: 'Güneş', arabicName: 'الشروق', time: t.Sunrise || '07:12' },
            { id: 'ogle', name: 'Dhuhr', turkishName: 'Öğle', arabicName: 'الظهر', time: t.Dhuhr || '13:18' },
            { id: 'ikindi', name: 'Asr', turkishName: 'İkindi', arabicName: 'العصر', time: t.Asr || '16:35' },
            { id: 'aksam', name: 'Maghrib', turkishName: 'Akşam', arabicName: 'المغرب', time: t.Maghrib || '19:15' },
            { id: 'yatsi', name: 'Isha', turkishName: 'Yatsı', arabicName: 'العشاء', time: t.Isha || '20:35' },
          ];

          let nextItem: PrayerTimeItem | null = null;
          let minDiff = 24 * 60;

          const items: PrayerTimeItem[] = rawList.map((item) => {
            const [h, m] = item.time.split(':').map(Number);
            const prayerMinutes = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
            const isPassed = currentMinutes >= prayerMinutes;
            let diff = prayerMinutes - currentMinutes;
            if (diff < 0) diff += 24 * 60; // next day wrap

            if (diff < minDiff && diff > 0) {
              minDiff = diff;
              nextItem = { ...item, isPassed, isCurrent: false, isNext: true };
            }

            return {
              ...item,
              isPassed,
              isCurrent: false,
              isNext: false,
            };
          });

          if (!nextItem && items.length > 0) {
            nextItem = items[0];
          }

          // Mark isNext
          if (nextItem) {
            const target = items.find((i) => i.id === nextItem!.id);
            if (target) target.isNext = true;
          }

          const hoursLeft = Math.floor(minDiff / 60);
          const minsLeft = minDiff % 60;
          const timeRemaining = `${hoursLeft > 0 ? `${hoursLeft} sa ` : ''}${minsLeft} dk kaldı`;

          setData({
            city: currentCity.name,
            country: currentCity.country,
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
            hijriDate: hijriDate || '15 Şaban 1447',
            timings: t,
            items,
            nextPrayer: nextItem,
            timeRemaining,
          });
        }
      } catch (e) {
        console.error('Error fetching prayer times', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTimes();
    const interval = setInterval(loadTimes, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentCity]);

  const toggleNotif = async (item: PrayerTimeItem) => {
    HapticFeedback.light();
    const newState = NotificationSettingsService.togglePrayer(item.name);
    setNotifs((prev) => ({ ...prev, [item.name]: newState }));

    if (newState) {
      await ApiService.sendPrayerNotificationAlert({
        prayerName: item.turkishName,
        cityName: currentCity.name,
        prayerTimeStr: item.time,
      });
    }
  };

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'imsak': return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'gunes': return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'ogle': return <Sun className="w-4 h-4 text-amber-500" />;
      case 'ikindi': return <Sun className="w-4 h-4 text-orange-400" />;
      case 'aksam': return <Sunset className="w-4 h-4 text-rose-400" />;
      case 'yatsi': return <Moon className="w-4 h-4 text-emerald-300" />;
      default: return <Clock className="w-4 h-4 text-emerald-500" />;
    }
  };

  const nextPrayer = data?.nextPrayer;

  return (
    <div className="space-y-2.5">
      {/* Compact Next Prayer Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 shadow-md shadow-emerald-950/10 border border-emerald-800/40">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Location & Next Prayer Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-emerald-300 text-[11px] font-semibold">
              <button
                onClick={onOpenCityPicker}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 group"
                title="Şehir veya Konum Değiştir"
              >
                <MapPin className="w-3 h-3 text-amber-300 group-hover:scale-110 transition-transform" />
                <span className="font-bold underline decoration-dotted underline-offset-2">
                  {currentCity.district ? `${currentCity.district}, ${currentCity.name}` : currentCity.name}
                  {currentCity.postcode ? ` (${currentCity.postcode})` : ''}
                </span>
                <span className="text-[9px] opacity-75 font-normal ml-0.5">• Değiştir</span>
              </button>
              <span className="text-emerald-500/80">•</span>
              <span className="text-emerald-200/70">{data?.hijriDate || ''}</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap pt-0.5">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/20">
                Sıradaki Vakit
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                <span>{nextPrayer ? nextPrayer.turkishName : 'Namaz Vakti'}</span>
                {nextPrayer?.arabicName && (
                  <span className="text-lg sm:text-xl font-normal text-emerald-200/75 font-arabic">
                    {nextPrayer.arabicName}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Right: Time, Countdown & Expand Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap pt-1 sm:pt-0">
            {/* Prayer Hour Badge */}
            <div className="bg-emerald-950/80 border border-emerald-700/50 rounded-xl px-3.5 py-1.5 backdrop-blur-xs text-center min-w-[76px]">
              <span className="text-[10px] text-emerald-300/80 block uppercase font-bold tracking-wider">
                Vakit Saati
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {nextPrayer ? nextPrayer.time : '--:--'}
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl px-3.5 py-1.5 backdrop-blur-xs text-center min-w-[100px]">
              <span className="text-[10px] text-amber-300/90 block uppercase font-bold tracking-wider">
                Kalan Süre
              </span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-amber-200">
                {data?.timeRemaining || 'Hesaplanıyor...'}
              </span>
            </div>

            {/* Toggle 6 Times Button */}
            <button
              onClick={() => setShowAllTimes(!showAllTimes)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800/70 hover:bg-emerald-700/80 text-emerald-100 text-xs font-bold border border-emerald-600/40 transition-all active:scale-95"
              title={showAllTimes ? 'Vakitleri Gizle' : 'Tüm 6 Vakti Göster'}
            >
              <span>{showAllTimes ? 'Gizle' : 'Tüm Vakitler'}</span>
              {showAllTimes ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable 6 Prayer Times Section */}
      {showAllTimes && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bugünün Namaz Vakitleri ({currentCity.name})
            </span>
            <div className="flex items-center gap-3">
              {onOpenIbadet && (
                <button
                  onClick={onOpenIbadet}
                  className="text-[11px] text-teal-700 dark:text-teal-400 font-bold hover:underline"
                >
                  İbadet Çetelesi →
                </button>
              )}
              <button
                onClick={onOpenQibla}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <Compass className="w-3 h-3" />
                <span>Kıble Pusulası</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            ) : (
              data?.items.map((item) => {
                const isNext = item.isNext;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-2.5 transition-all flex flex-col justify-between border ${
                      isNext
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 shadow-xs ring-1 ring-emerald-500/20'
                        : item.isPassed
                        ? 'bg-slate-50/70 dark:bg-slate-850 border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                          {getPrayerIcon(item.id)}
                        </span>
                        <span className={`text-xs font-bold ${isNext ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.turkishName}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleNotif(item)}
                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 transition-colors"
                        title={`${item.turkishName} Bildirimi`}
                      >
                        {notifs[item.name] !== false ? (
                          <Bell className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <BellOff className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className={`text-base font-extrabold tracking-tight ${isNext ? 'text-emerald-950 dark:text-emerald-100 font-black' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.time}
                      </span>
                      {isNext ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold">
                          Sıradaki
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-arabic">
                          {item.arabicName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
