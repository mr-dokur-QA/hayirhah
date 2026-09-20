import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Check,
  Compass,
  Loader2,
  Navigation,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowRight,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  TURKEY_CITIES,
  TURKEY_DISTRICTS,
  WORLD_CITIES,
  CityLocation,
  calculateQiblaBearing,
} from '../data/islamicData';
import {
  detectUserLocation,
  searchCitiesWorldwide,
  LocationDetectionResult,
} from '../services/locationService';

interface CityPickerModalProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  isOpen: boolean;
  onClose: () => void;
  initialPermissionDenied?: boolean;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  currentCity,
  onSelectCity,
  isOpen,
  onClose,
  initialPermissionDenied = false,
}) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'manual' | 'turkey' | 'world'>('manual');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [permissionDeniedAlert, setPermissionDeniedAlert] = useState<boolean>(initialPermissionDenied);
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPermissionDenied) {
        setPermissionDeniedAlert(true);
        setTab('manual');
      }
    } else {
      setSearch('');
      setDetectStatus(null);
      setSearchResults([]);
      setSearchExecuted(false);
    }
  }, [isOpen, initialPermissionDenied]);

  // Debounced search when typing
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchExecuted(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchCitiesWorldwide(trimmed);
        setSearchResults(results);
        setSearchExecuted(true);
      } catch (e) {
        console.warn('City search failed', e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed.length < 2) return;

    setIsSearchingOnline(true);
    try {
      const results = await searchCitiesWorldwide(trimmed);
      setSearchResults(results);
      setSearchExecuted(true);
    } catch (e) {
      console.warn('Manual search failed', e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectStatus('GPS / İnternet konumu alınıyor...');
    try {
      const res: LocationDetectionResult = await detectUserLocation();
      setDetectStatus(res.message);

      if (res.permissionDenied) {
        setPermissionDeniedAlert(true);
        setTab('manual');
        setIsDetecting(false);
        return;
      }

      setPermissionDeniedAlert(false);
      onSelectCity(res.city);
      setTimeout(() => {
        setIsDetecting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setDetectStatus('Konum izni alınamadı. Lütfen manuel giriniz.');
      setPermissionDeniedAlert(true);
      setTab('manual');
      setIsDetecting(false);
    }
  };

  const handleSelect = (city: CityLocation) => {
    try {
      localStorage.setItem('hayirhah_saved_city', JSON.stringify(city));
      localStorage.setItem('hayirhah_manual_location', 'true');
    } catch (e) {}
    onSelectCity(city);
    onClose();
  };

  const isSearchActive = search.trim().length >= 2;

  // Determine list based on current tab
  let displayCities: CityLocation[] = [];
  if (isSearchActive) {
    displayCities = searchResults;
  } else if (tab === 'turkey') {
    displayCities = [...TURKEY_DISTRICTS, ...TURKEY_CITIES];
  } else if (tab === 'world') {
    displayCities = WORLD_CITIES;
  } else {
    // Tab === 'manual' without active search: show popular district/city shortcuts
    displayCities = [
      ...TURKEY_DISTRICTS.slice(0, 10),
      ...WORLD_CITIES.slice(0, 6),
    ];
  }

  // Current city Qibla calculation
  const currentQibla = calculateQiblaBearing(currentCity.latitude, currentCity.longitude);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 transition-colors my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-850 via-emerald-800 to-teal-850 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>Konum & Şehir Belirleme</span>
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                Namaz vakitleri ve Kıble açısı bu konuma göre hesaplanır
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* GPS Permission Denied Alert Banner */}
        {permissionDeniedAlert && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Konum İzni Verilmedi veya Engellendi
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Namaz vakitleri ve Kıble yönünün kusursuz hesaplanabilmesi için aşağıdan yaşadığınız <strong>şehir, ilçe, adres veya posta kodunu</strong> manuel olarak aratıp seçebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Quick GPS Auto-Detect Button */}
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40">
          <button
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-75"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Konumunuz Algılanıyor...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-amber-300" />
                <span>GPS ile Otomatik Konum Bul</span>
              </>
            )}
          </button>
          {detectStatus && (
            <p className="text-[11px] text-center font-semibold text-emerald-800 dark:text-emerald-300 mt-1.5">
              {detectStatus}
            </p>
          )}
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => {
                setTab('manual');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'manual'
                  ? 'bg-white dark:bg-emerald-700 text-emerald-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Manuel Arama</span>
            </button>
            <button
              onClick={() => {
                setTab('turkey');
                setSearch('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'turkey'
                  ? 'bg-white dark:bg-emerald-700 text-emerald-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Türkiye</span>
            </button>
            <button
              onClick={() => {
                setTab('world');
                setSearch('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'world'
                  ? 'bg-white dark:bg-emerald-700 text-emerald-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Dünya & ABD</span>
            </button>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleManualSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Şehir, ilçe, açık adres veya posta kodu (örn: Bornova 35040, Wesley Chapel 33544, Kadıköy)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {isSearchingOnline ? (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            ) : null}
          </form>

          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Hızlı İlçe & Posta Kodu Seçimi
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Bornova, İzmir (35040)', query: 'Bornova 35040' },
                { label: 'Kadıköy, İst (34710)', query: 'Kadıköy 34710' },
                { label: 'Çankaya, Ank (06530)', query: 'Çankaya 06530' },
                { label: 'Wesley Chapel (33544)', query: 'Wesley Chapel 33544' },
                { label: 'Nilüfer, Bursa (16140)', query: 'Nilüfer 16140' },
                { label: 'Muratpaşa, Ant (07010)', query: 'Muratpaşa 07010' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearch(item.query)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all font-semibold"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
          {displayCities.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Compass className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                "{search}" için sonuç bulunamadı
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Şehir, ilçe veya 5 haneli posta kodunuzu yazarak tekrar aratabilirsiniz.
              </p>
            </div>
          ) : (
            displayCities.map((city) => {
              const isSelected =
                city.name === currentCity.name &&
                Math.abs(city.latitude - currentCity.latitude) < 0.08 &&
                Math.abs(city.longitude - currentCity.longitude) < 0.08;

              const qibla = calculateQiblaBearing(city.latitude, city.longitude);

              return (
                <button
                  key={`${city.name}-${city.country}-${city.latitude}-${city.longitude}`}
                  onClick={() => handleSelect(city)}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between text-xs font-semibold gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold border-2 border-emerald-500 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {city.name}
                        </span>
                        {city.district && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold">
                            İlçe: {city.district}
                          </span>
                        )}
                        {city.postcode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold">
                            PK: {city.postcode}
                          </span>
                        )}
                        {city.isAutoDetected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                            GPS
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {city.fullAddress ||
                          [city.state, city.country].filter(Boolean).join(', ')}
                      </p>

                      {/* Live Qibla & Distance Pill */}
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                          <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Kıble: {qibla.angle}° ({qibla.cardinal})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Ka'be: {qibla.distanceKm.toLocaleString('tr-TR')} km
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                          ({city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <div className="p-1 rounded-full bg-emerald-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 hover:text-emerald-600 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info: Selected Location & Calculated Qibla */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-medium block">
              Aktif Konum:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentCity.name}, {currentCity.country}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
              🧭 Kıble Yönü: {currentQibla.angle}° ({currentQibla.cardinal})
            </span>
            <span className="text-[10px] text-slate-400">
              Mesafe: {currentQibla.distanceKm.toLocaleString('tr-TR')} km
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
