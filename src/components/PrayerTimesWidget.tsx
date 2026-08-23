import React, { useState, useEffect } from 'react';
import { Clock, Volume2, VolumeX, Bell, BellOff, MapPin, Sparkles, Sunrise, Sun, Sunset, Moon, Send } from 'lucide-react';
import { CityLocation } from '../data/islamicData';
import { PrayerTimeItem, PrayerTimesData } from '../types';
import { ApiService } from '../services/api';

interface PrayerTimesWidgetProps {
  currentCity: CityLocation;
  onOpenCityPicker: () => void;
  onOpenQibla: () => void;
}

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({
  currentCity,
  onOpenCityPicker,
  onOpenQibla,
}) => {
  const [data, setData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAzan, setIsPlayingAzan] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  });

  // Calculate or fetch prayer times
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadTimes() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/prayer-times?lat=${currentCity.latitude}&lng=${currentCity.longitude}&date=${todayStr}`);
        const json = await res.json();

        if (json?.data?.timings && isMounted) {
          const t = json.data.timings;
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
            const prayerMinutes = h * 60 + m;
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
          const timeRemaining = `${hoursLeft > 0 ? `${hoursLeft} sa ` : ''}${minsLeft} dk`;

          setData({
            city: currentCity.name,
            country: currentCity.country,
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
            hijriDate: `${json.data?.date?.hijri?.day || '04'} ${json.data?.date?.hijri?.month?.en === 'Ramadan' ? 'Ramazan' : 'Şaban'} ${json.data?.date?.hijri?.year || '1447'}`,
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
    const key = item.name;
    const newState = !notifs[key];
    setNotifs((prev) => ({ ...prev, [key]: newState }));

    if (newState) {
      // Send a test push for this prayer time
      await ApiService.sendPrayerNotificationAlert({
        prayerName: item.turkishName,
        cityName: currentCity.name,
        prayerTimeStr: item.time,
      });
    }
  };

  const playAzanSample = () => {
    setIsPlayingAzan(!isPlayingAzan);
    if (!isPlayingAzan) {
      // Audio notification beep or audio web audio synth
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {}
    }
  };

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'imsak': return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'gunes': return <Sunrise className="w-5 h-5 text-amber-400" />;
      case 'ogle': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'ikindi': return <Sun className="w-5 h-5 text-orange-400" />;
      case 'aksam': return <Sunset className="w-5 h-5 text-rose-400" />;
      case 'yatsi': return <Moon className="w-5 h-5 text-emerald-300" />;
      default: return <Clock className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Next Prayer Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/15 border border-emerald-800/40">
        {/* Background Islamic Pattern Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vakit Takibi • {currentCity.name}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-3">
              <span>{data?.nextPrayer ? data.nextPrayer.turkishName : 'Namaz Vakti'}</span>
              <span className="text-xl sm:text-2xl font-normal text-emerald-200/80 font-arabic">
                {data?.nextPrayer?.arabicName}
              </span>
            </h2>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span>Vakte Kalan Süre:</span>
              <span className="font-bold text-amber-300 text-base">{data?.timeRemaining || 'Hesaplanıyor...'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-950/80 border border-emerald-700/50 rounded-xl px-4 py-2.5 backdrop-blur-md">
              <span className="text-xs text-emerald-300/80 block">Vakit Saati</span>
              <span className="text-2xl font-black tracking-tight text-white">
                {data?.nextPrayer ? data.nextPrayer.time : '--:--'}
              </span>
            </div>

            <button
              id="prayer-azan-btn"
              onClick={playAzanSample}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-medium text-xs transition-all ${
                isPlayingAzan
                  ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-emerald-800/60 hover:bg-emerald-700/70 text-emerald-100 border-emerald-600/40'
              }`}
            >
              {isPlayingAzan ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span>{isPlayingAzan ? 'Ezan Dinletisi Aktif' : 'Ezan Sesi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Prayer Times Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))
        ) : (
          data?.items.map((item) => {
            const isNext = item.isNext;
            return (
              <div
                key={item.id}
                className={`relative rounded-xl p-4 transition-all duration-200 flex flex-col justify-between border ${
                  isNext
                    ? 'bg-gradient-to-b from-emerald-50 to-teal-50/70 border-emerald-400 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : item.isPassed
                    ? 'bg-slate-50/80 border-slate-200/80 text-slate-500'
                    : 'bg-white border-slate-200/80 text-slate-800 shadow-xs hover:border-emerald-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100">
                    {getPrayerIcon(item.id)}
                  </span>
                  <button
                    onClick={() => toggleNotif(item)}
                    className="text-slate-400 hover:text-emerald-600 p-1"
                    title="Bildirim Ayarı"
                  >
                    {notifs[item.name] !== false ? (
                      <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                </div>

                {/* Body */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isNext ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>
                      {item.turkishName}
                    </span>
                    <span className="text-xs text-slate-400 font-arabic">{item.arabicName}</span>
                  </div>
                  <div className={`text-xl font-extrabold tracking-tight mt-0.5 ${isNext ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                    {item.time}
                  </div>
                </div>

                {/* Next Badge */}
                {isNext && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                    Sıradaki
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
