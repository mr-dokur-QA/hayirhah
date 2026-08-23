import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { IbadetTracker } from './components/IbadetTracker';
import { GroupManager } from './components/GroupManager';
import { QuranReader } from './components/QuranReader';
import { ArabicTextViewer } from './components/ArabicTextViewer';
import { QiblaFinder } from './components/QiblaFinder';
import { Zikirmatik } from './components/Zikirmatik';
import { AIAdvisor } from './components/AIAdvisor';
import { CityPickerModal } from './components/CityPickerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { TURKEY_CITIES, CityLocation, DAILY_HADITHS } from './data/islamicData';
import { User, DailyPrayerTracking } from './types';
import { ApiService } from './services/api';
import { Clock, CheckSquare, Users, BookOpen, Compass, Sparkles, Quote, Flame, Bell, X, CheckCircle } from 'lucide-react';

interface ActivePrayerAlert {
  id: string;
  prayerName: string;
  turkishName: string;
  time: string;
  cityName: string;
  timestamp: number;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'vakitler' | 'ibadet' | 'gruplar' | 'kuran' | 'dualar' | 'kible_zikir'>('vakitler');
  
  // Initialize current city from saved location in localStorage or default to Istanbul
  const [currentCity, setCurrentCity] = useState<CityLocation>(() => {
    try {
      const saved = localStorage.getItem('hayirhah_saved_city');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved city from localStorage', e);
    }
    return TURKEY_CITIES[0]; // Default: Istanbul
  });

  const [user, setUser] = useState<User | null>(() => ApiService.getCurrentUser());
  const [dailyHadith, setDailyHadith] = useState(DAILY_HADITHS[0]);

  // In-app prayer notification banner state
  const [activeAlert, setActiveAlert] = useState<ActivePrayerAlert | null>(null);

  // Modals state
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Daily tracking stats for summary
  const [todayTracking, setTodayTracking] = useState<DailyPrayerTracking>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return ApiService.getDailyTracking(todayStr);
  });

  // Selected Juz for opening in QuranReader from Hatim groups
  const [selectedJuzForReader, setSelectedJuzForReader] = useState<number | null>(null);

  // Cached prayer timings for background monitoring
  const [cachedTimings, setCachedTimings] = useState<Record<string, string> | null>(null);
  const prayerCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Select daily Hadith by day of the year
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const hadith = DAILY_HADITHS[dayOfYear % DAILY_HADITHS.length] || DAILY_HADITHS[0];
    setDailyHadith(hadith);
  }, []);

  // Save selected city to localStorage when changed
  const handleCitySelect = (city: CityLocation) => {
    setCurrentCity(city);
    try {
      localStorage.setItem('hayirhah_saved_city', JSON.stringify(city));
    } catch (e) {
      console.warn('Failed to save city to localStorage', e);
    }
  };

  // Helper: Play a soft notification audio chime
  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 melodic chord

      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        
        gain.gain.setValueAtTime(0.001, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.85);
      });
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Fetch and cache prayer times for background task whenever city changes
  useEffect(() => {
    let isMounted = true;
    const fetchTimings = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/prayer-times?lat=${currentCity.latitude}&lng=${currentCity.longitude}&date=${todayStr}`);
        const json = await res.json();
        if (json?.data?.timings && isMounted) {
          setCachedTimings(json.data.timings);
        }
      } catch (e) {
        console.warn('Could not fetch prayer times for background monitor', e);
      }
    };

    fetchTimings();
    return () => {
      isMounted = false;
    };
  }, [currentCity]);

  // Request browser Web Notification permission if supported and not determined
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Request on first user interaction or mount
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Background Task Engine: monitors time against saved location's prayer times
  useEffect(() => {
    if (!cachedTimings) return;

    const prayerDefinitions: { key: string; turkishName: string; timingKey: string }[] = [
      { key: 'imsak', turkishName: 'İmsak / Sabah Namazı', timingKey: 'Fajr' },
      { key: 'gunes', turkishName: 'Güneş Doğumu', timingKey: 'Sunrise' },
      { key: 'ogle', turkishName: 'Öğle Namazı', timingKey: 'Dhuhr' },
      { key: 'ikindi', turkishName: 'İkindi Namazı', timingKey: 'Asr' },
      { key: 'aksam', turkishName: 'Akşam Namazı', timingKey: 'Maghrib' },
      { key: 'yatsi', turkishName: 'Yatsı Namazı', timingKey: 'Isha' },
    ];

    const checkPrayerTimes = () => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      const todayStr = now.toISOString().split('T')[0];

      // Retrieve already notified keys for today
      let notifiedList: string[] = [];
      try {
        const stored = localStorage.getItem(`hayirhah_notified_${todayStr}`);
        if (stored) {
          notifiedList = JSON.parse(stored);
        }
      } catch (e) {}

      for (const prayer of prayerDefinitions) {
        const prayerTimeStr = cachedTimings[prayer.timingKey];
        if (!prayerTimeStr) continue;

        // Normalize prayer time string to HH:MM format
        const cleanPrayerTime = prayerTimeStr.trim().substring(0, 5);
        const notificationKey = `${todayStr}_${currentCity.name}_${prayer.key}`;

        if (cleanPrayerTime === currentTimeStr && !notifiedList.includes(notificationKey)) {
          // Mark as notified in storage
          notifiedList.push(notificationKey);
          try {
            localStorage.setItem(`hayirhah_notified_${todayStr}`, JSON.stringify(notifiedList));
          } catch (e) {}

          console.log(`🔔 [BACKGROUND PRAYER TASK] Vakit girdi: ${prayer.turkishName} (${cleanPrayerTime}) - ${currentCity.name}`);

          // 1. Dispatch through Notification API service
          ApiService.sendPrayerNotificationAlert({
            prayerName: prayer.turkishName,
            cityName: currentCity.name,
            prayerTimeStr: cleanPrayerTime,
          });

          // 2. Trigger native browser Web Notification if allowed
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`🕌 Vakit Girdi: ${prayer.turkishName}`, {
                body: `${currentCity.name} için ${prayer.turkishName} vakti (${cleanPrayerTime}) girdi. "Namaz müminin miracıdır." Haydi felaha!`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
              });
            } catch (err) {
              console.warn('Native notification error', err);
            }
          }

          // 3. Play audio chime
          playNotificationSound();

          // 4. Set in-app visual alert banner
          setActiveAlert({
            id: notificationKey,
            prayerName: prayer.key,
            turkishName: prayer.turkishName,
            time: cleanPrayerTime,
            cityName: currentCity.name,
            timestamp: Date.now(),
          });
        }
      }
    };

    // Run check immediately and then on interval
    checkPrayerTimes();
    prayerCheckIntervalRef.current = setInterval(checkPrayerTimes, 15000); // Check every 15s

    return () => {
      if (prayerCheckIntervalRef.current) {
        clearInterval(prayerCheckIntervalRef.current);
      }
    };
  }, [cachedTimings, currentCity]);

  const navItems = [
    { id: 'vakitler', label: 'Vakitler', icon: <Clock className="w-4 h-4" /> },
    { id: 'ibadet', label: 'İbadet Çetelesi', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'gruplar', label: 'Dua Halkaları', icon: <Users className="w-4 h-4" /> },
    { id: 'kuran', label: "Kur'an-ı Kerîm", icon: <BookOpen className="w-4 h-4" /> },
    { id: 'dualar', label: 'Mübarek Dualar', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'kible_zikir', label: 'Kıble & Zikir', icon: <Compass className="w-4 h-4" /> },
  ] as const;

  const completedFard = Object.values(todayTracking.fardPrayers || {}).filter((p) => p.isCompleted).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Global Navigation Header */}
      <Header
        currentCity={currentCity}
        onOpenCityPicker={() => setIsCityPickerOpen(true)}
        onOpenQibla={() => {
          setActiveTab('kible_zikir');
        }}
        onOpenAIReport={() => setIsAIAdvisorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={user}
      />

      {/* Real-time Prayer Time Notification Alert Banner */}
      {activeAlert && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-lg border-b border-emerald-500/40 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 text-amber-300 flex items-center justify-center animate-bounce">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    🕌 Vakit Girdi: {activeAlert.turkishName} ({activeAlert.time})
                  </span>
                  <span className="text-[10px] bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                    {activeAlert.cityName}
                  </span>
                </div>
                <p className="text-xs text-emerald-100">
                  "Namaz müminin miracıdır." Vaktinde eda ederek ibadet çetelenize kaydedebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('ibadet');
                  setActiveAlert(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Çeteleye İşle</span>
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Main Navigation Tabs */}
      <nav className="hidden md:block bg-white border-b border-slate-200/80 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === item.id
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Streak / Daily Progress Badge */}
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs font-semibold text-slate-500">Bugünkü Gayret:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>{completedFard}/5 Farz</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-12">
        {/* Tab 1: Vakitler Dashboard */}
        {activeTab === 'vakitler' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PrayerTimesWidget
              currentCity={currentCity}
              onOpenCityPicker={() => setIsCityPickerOpen(true)}
              onOpenQibla={() => setActiveTab('kible_zikir')}
            />

            {/* Quick Actions & Daily Hadith Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Daily Hadith / Spiritual Quote Card */}
              <div className="md:col-span-7 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-emerald-800/40 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Quote className="w-4 h-4 fill-amber-300" />
                    <span>Günün Hadis-i Şerîfi</span>
                  </div>
                  <p className="font-arabic text-lg sm:text-xl text-emerald-200/90 leading-loose text-right" dir="rtl">
                    {dailyHadith.arabic}
                  </p>
                  <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed italic pt-1">
                    "{dailyHadith.turkish}"
                  </p>
                </div>
                <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300 font-medium">
                  <span>Kaynak: {dailyHadith.source}</span>
                  <span className="text-[11px] bg-emerald-800/60 px-2 py-0.5 rounded-md">Manevi Feyiz</span>
                </div>
              </div>

              {/* Today's Quick Ibadet Status Card */}
              <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Günün İbadet Özeti
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      %{Math.round((completedFard / 5) * 100)}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900">Kulluk & İbadet Çetelesi</h4>
                  <p className="text-xs text-slate-500">
                    Farz namazlarınızı, sünnetleri ve zikirleri işaretleyerek günlük takibinizi sürdürün.
                  </p>
                </div>

                {/* Progress Mini Grid */}
                <div className="grid grid-cols-5 gap-1.5 py-2">
                  {[
                    { key: 'sabah', label: 'Sabah' },
                    { key: 'ogle', label: 'Öğle' },
                    { key: 'ikindi', label: 'İkindi' },
                    { key: 'aksam', label: 'Akşam' },
                    { key: 'yatsi', label: 'Yatsı' },
                  ].map((pr) => {
                    const done = !!todayTracking.fardPrayers[pr.key as keyof typeof todayTracking.fardPrayers]?.isCompleted;
                    return (
                      <div
                        key={pr.key}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          done
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{pr.label}</span>
                        <span className="text-xs">{done ? '✓' : '•'}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setActiveTab('ibadet')}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Çeteleyi Tamamla</span>
                </button>
              </div>
            </div>

            {/* Communal Rings Quick Preview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900">Aktif Hatim ve Dua Halkaları</h4>
                  <p className="text-xs text-slate-500">Mümin kardeşlerinizle birlikte okunan hatim ve tefriciyeler.</p>
                </div>
                <button
                  onClick={() => setActiveTab('gruplar')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  Tümünü Gör →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { title: 'Ramazan-ı Şerif 1. Hatm-i Şerif', type: '30 Cüz', progress: '18 / 30 Cüz', percent: 60 },
                  { title: 'Hasta Kardeşlerimiz İçin Tefriciye', type: 'Salât-ı Tefriciye', progress: '3.120 / 4.444', percent: 70 },
                  { title: '1.000 İhlâs-ı Şerif Halkası', type: 'İhlâs', progress: '850 / 1.000', percent: 85 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTab('gruplar')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60 transition-all cursor-pointer space-y-2"
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {item.type}
                    </span>
                    <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{item.title}</h5>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">{item.progress}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: İbadet Çetelesi & Kaza */}
        {activeTab === 'ibadet' && (
          <div className="animate-in fade-in duration-200">
            <IbadetTracker onTrackingUpdated={(updated) => setTodayTracking(updated)} />
          </div>
        )}

        {/* Tab 3: Dua Kardeşliği & Hatim Grupları */}
        {activeTab === 'gruplar' && (
          <div className="animate-in fade-in duration-200">
            <GroupManager
              currentUser={user}
              onOpenJuzInQuranReader={(juzNumber) => {
                setSelectedJuzForReader(juzNumber);
                setActiveTab('kuran');
              }}
            />
          </div>
        )}

        {/* Tab 4: Kur'an-ı Kerîm */}
        {activeTab === 'kuran' && (
          <div className="animate-in fade-in duration-200">
            <QuranReader
              initialJuz={selectedJuzForReader}
              onClearInitial={() => setSelectedJuzForReader(null)}
            />
          </div>
        )}

        {/* Tab 5: Mübarek Dualar & Sureler */}
        {activeTab === 'dualar' && (
          <div className="animate-in fade-in duration-200">
            <ArabicTextViewer />
          </div>
        )}

        {/* Tab 6: Kıble Pusulası & Zikirmatik */}
        {activeTab === 'kible_zikir' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            <QiblaFinder currentCity={currentCity} />
            <Zikirmatik />
          </div>
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center transition-colors ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[9px] tracking-tight mt-0.5 truncate max-w-[48px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <CityPickerModal
        currentCity={currentCity}
        onSelectCity={handleCitySelect}
        isOpen={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
      />

      <AIAdvisor
        user={user}
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        user={user}
        onUserChange={(u) => setUser(u)}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
