import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, BookOpen, Flame, Calendar, Award, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { DailyPrayerTracking } from '../types';
import { ApiService } from '../services/api';
import confetti from 'canvas-confetti';

interface IbadetTrackerProps {
  onTrackingUpdated?: (tracking: DailyPrayerTracking) => void;
}

export const IbadetTracker: React.FC<IbadetTrackerProps> = ({ onTrackingUpdated }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tracking, setTracking] = useState<DailyPrayerTracking>(() => ApiService.getDailyTracking(selectedDate));
  const [activeTab, setActiveTab] = useState<'farz' | 'nafile' | 'kaza' | 'quran'>('farz');

  useEffect(() => {
    const loaded = ApiService.getDailyTracking(selectedDate);
    setTracking(loaded);
  }, [selectedDate]);

  const saveTracking = (updated: DailyPrayerTracking) => {
    setTracking(updated);
    ApiService.saveDailyTracking(updated);
    if (onTrackingUpdated) onTrackingUpdated(updated);
  };

  const toggleFard = (prayer: 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi', field: 'isCompleted' | 'completedSunnet' | 'completedTesbihat') => {
    const current = tracking.fardPrayers[prayer] || { isCompleted: false, completedSunnet: false, completedTesbihat: false };
    const nextVal = !current[field];

    const updated = {
      ...tracking,
      fardPrayers: {
        ...tracking.fardPrayers,
        [prayer]: {
          ...current,
          [field]: nextVal,
        },
      },
    };

    if (field === 'isCompleted' && nextVal) {
      // Check if all 5 completed
      const allCompleted = Object.entries(updated.fardPrayers).every(([k, v]) => k === prayer ? true : v.isCompleted);
      if (allCompleted) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    }

    saveTracking(updated);
  };

  const toggleNafile = (name: 'teheccud' | 'duha' | 'evvabin' | 'tespih') => {
    const current = tracking.sunnahPrayers || { teheccud: false, duha: false, evvabin: false, tespih: false };
    const updated = {
      ...tracking,
      sunnahPrayers: {
        ...current,
        [name]: !current[name],
      },
    };
    saveTracking(updated);
  };

  const updateKaza = (prayer: 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir', delta: number) => {
    const current = tracking.kazaPrayers || { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 };
    const nextVal = Math.max(0, (current[prayer] || 0) + delta);
    const updated = {
      ...tracking,
      kazaPrayers: {
        ...current,
        [prayer]: nextVal,
      },
    };
    saveTracking(updated);
  };

  const updateQuranPages = (delta: number) => {
    const nextVal = Math.max(0, (tracking.quranReadingPages || 0) + delta);
    const updated = {
      ...tracking,
      quranReadingPages: nextVal,
    };
    saveTracking(updated);
  };

  const changeDateBy = (days: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Stats calculation
  const completedFardCount = Object.values(tracking.fardPrayers || {}).filter((p) => p.isCompleted).length;
  const completedSunnetCount = Object.values(tracking.fardPrayers || {}).filter((p) => p.completedSunnet).length;
  const completedTesbihatCount = Object.values(tracking.fardPrayers || {}).filter((p) => p.completedTesbihat).length;
  const totalKazaCount = Object.values(tracking.kazaPrayers || {}).reduce((a, b) => a + (b || 0), 0);

  const prayerNames: { key: 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi'; title: string; arabic: string; sunnetLabel: string }[] = [
    { key: 'sabah', title: 'Sabah Namazı', arabic: 'صلاة الفجر', sunnetLabel: '2 Rekat Sünnet' },
    { key: 'ogle', title: 'Öğle Namazı', arabic: 'صلاة الظهر', sunnetLabel: '4 İlk + 2 Son Sünnet' },
    { key: 'ikindi', title: 'İkindi Namazı', arabic: 'صلاة العصر', sunnetLabel: '4 Rekat Sünnet' },
    { key: 'aksam', title: 'Akşam Namazı', arabic: 'صلاة المغرب', sunnetLabel: '2 Rekat Sünnet' },
    { key: 'yatsi', title: 'Yatsı & Vitir', arabic: 'صلاة العشاء', sunnetLabel: '4 İlk + 2 Son Sünnet' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Header & Date Navigation */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Günlük İbadet Çetelesi</h3>
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <Flame className="w-3 h-3 text-emerald-600" />
                {completedFardCount}/5 Vakit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Farz, sünnet, tesbihat ve kaza namazlarınızı günü gününe takip edin.</p>
          </div>

          {/* Date Picker Bar */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => changeDateBy(-1)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Önceki Gün"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 min-w-[120px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {selectedDate === new Date().toISOString().split('T')[0]
                  ? 'Bugün'
                  : new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <button
              onClick={() => changeDateBy(1)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Sonraki Gün"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-5 border-b border-slate-200/80 -mb-4 sm:-mb-6">
          <button
            onClick={() => setActiveTab('farz')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'farz'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Farz & Sünnet</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {completedFardCount}/5
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nafile')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'nafile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Nafile İbadetler</span>
          </button>

          <button
            onClick={() => setActiveTab('kaza')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'kaza'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Kaza Defteri</span>
            {totalKazaCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                {totalKazaCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quran')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quran'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Kur'an Okuma</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {tracking.quranReadingPages || 0} syf
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {/* Tab 1: 5 Farz & Sunnah Prayers */}
        {activeTab === 'farz' && (
          <div className="space-y-3">
            {prayerNames.map((p) => {
              const state = tracking.fardPrayers[p.key] || { isCompleted: false, completedSunnet: false, completedTesbihat: false };
              return (
                <div
                  key={p.key}
                  className={`p-4 rounded-xl border transition-all ${
                    state.isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left title & Arabic */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFard(p.key, 'isCompleted')}
                        className="text-emerald-600 hover:text-emerald-700 transition-transform active:scale-95"
                      >
                        {state.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm ${state.isCompleted ? 'text-emerald-950 line-through decoration-emerald-500/40' : 'text-slate-800'}`}>
                            {p.title}
                          </h4>
                          <span className="text-xs text-slate-400 font-arabic">{p.arabic}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{p.sunnetLabel}</span>
                      </div>
                    </div>

                    {/* Checkboxes: Farz / Sünnet / Tesbihat */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => toggleFard(p.key, 'isCompleted')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          state.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Farz
                      </button>

                      <button
                        onClick={() => toggleFard(p.key, 'completedSunnet')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          state.completedSunnet
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Sünnet
                      </button>

                      <button
                        onClick={() => toggleFard(p.key, 'completedTesbihat')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          state.completedTesbihat
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Tesbihat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Completion Footer */}
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-emerald-600" />
                Günün Tamamlanma Oranı:
              </span>
              <span className="font-bold text-emerald-950">
                %{Math.round((completedFardCount / 5) * 100)} Farz • {completedSunnetCount}/5 Sünnet • {completedTesbihatCount}/5 Tesbihat
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Nafile Prayers */}
        {activeTab === 'nafile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'teheccud', name: 'Teheccüd Namazı', desc: 'Gece uykudan uyanıp kılınan pek faziletli nafile namaz (2-8 rekat)', time: 'Gecenin son üçte biri' },
              { key: 'duha', name: 'Kuşluk (Duhâ) Namazı', desc: 'Güneş doğup 45 dk geçtikten sonra kılınan şükür namazı (2-8 rekat)', time: 'Öğleden önce' },
              { key: 'evvabin', name: 'Evvâbîn Namazı', desc: 'Akşam namazının sünnetinden sonra kılınan tövbe ve sığınma namazı (6 rekat)', time: 'Akşamdan sonra' },
              { key: 'tespih', name: 'Tesbih Namazı', desc: '300 defa tesbih zikrinin okunduğu günahların affına vesile namaz (4 rekat)', time: 'Her vakit' },
            ].map((item) => {
              const checked = !!tracking.sunnahPrayers?.[item.key as keyof typeof tracking.sunnahPrayers];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleNafile(item.key as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                      <span className="inline-block mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        {item.time}
                      </span>
                    </div>
                    <div className="mt-1">
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Kaza Namazı Counter */}
        {activeTab === 'kaza' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Bugün kıldığınız kaza namazlarını işaretleyerek borçlarınızı düzenli olarak azaltın.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'sabah', label: 'Sabah Kazası' },
                { key: 'ogle', label: 'Öğle Kazası' },
                { key: 'ikindi', label: 'İkindi Kazası' },
                { key: 'aksam', label: 'Akşam Kazası' },
                { key: 'yatsi', label: 'Yatsı Kazası' },
                { key: 'vitir', label: 'Vitir Kazası' },
              ].map((item) => {
                const count = tracking.kazaPrayers?.[item.key as keyof typeof tracking.kazaPrayers] || 0;
                return (
                  <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    <span className="text-2xl font-black text-emerald-950 my-1.5">{count}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateKaza(item.key as any, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateKaza(item.key as any, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Quran Pages Read */}
        {activeTab === 'quran' && (
          <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Günlük Kur'an Tilaveti</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Bugün okuduğunuz sayfa sayısını kaydedin. Peygamber Efendimiz (s.a.v): "Kur'an okuyunuz, çünkü o kıyamet günü okuyanlara şefaatçi olarak gelecektir." buyurmuştur.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => updateQuranPages(-1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="bg-white px-6 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-3xl font-black text-emerald-950">{tracking.quranReadingPages || 0}</span>
                <span className="text-xs text-emerald-700 block font-semibold">Sayfa</span>
              </div>
              <button
                onClick={() => updateQuranPages(1)}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {[5, 10, 20].map((quick) => (
                <button
                  key={quick}
                  onClick={() => updateQuranPages(quick)}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-emerald-800"
                >
                  +{quick} Sayfa (Cüz)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
