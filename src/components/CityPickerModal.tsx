import React, { useState, useEffect } from 'react';
import { Search, MapPin, Check, Compass, Loader2, Navigation, Sparkles } from 'lucide-react';
import { TURKEY_CITIES, WORLD_CITIES, CityLocation } from '../data/islamicData';
import { detectUserLocation, searchCitiesWorldwide } from '../services/locationService';

interface CityPickerModalProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  currentCity,
  onSelectCity,
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'turkey' | 'world' | 'search'>('turkey');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDetectStatus(null);
      setSearchResults([]);
    }
  }, [isOpen]);

  // Online search when user types a custom city
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchCitiesWorldwide(search);
        setSearchResults(results);
      } catch (e) {
        console.warn('City search failed', e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectStatus('GPS / İnternet konumu alınıyor...');
    try {
      const res = await detectUserLocation();
      setDetectStatus(res.message);
      onSelectCity(res.city);
      setTimeout(() => {
        setIsDetecting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setDetectStatus('Konum algılanamadı, lütfen listeden seçin.');
      setIsDetecting(false);
    }
  };

  const isSearchActive = search.trim().length >= 2;
  const allCities = tab === 'turkey' ? TURKEY_CITIES : WORLD_CITIES;
  const displayCities = isSearchActive
    ? searchResults.length > 0
      ? searchResults
      : allCities.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.country && c.country.toLowerCase().includes(search.toLowerCase())) ||
            (c.state && c.state.toLowerCase().includes(search.toLowerCase()))
        )
    : allCities;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Şehir & Konum Belirleme</h3>
              <p className="text-[11px] text-emerald-100 font-medium">Namaz vakitleri bu konuma göre hesaplanır</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick GPS Auto-Detect Button */}
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40">
          <button
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] disabled:opacity-75"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Konumunuz Algılanıyor...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Mevcut Konumumu Otomatik Algıla (GPS)</span>
              </>
            )}
          </button>
          {detectStatus && (
            <p className="text-[11px] text-center font-semibold text-emerald-800 dark:text-emerald-300 mt-2">
              {detectStatus}
            </p>
          )}
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTab('turkey');
                setSearch('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'turkey' && !isSearchActive
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Türkiye (81 İl)
            </button>
            <button
              onClick={() => {
                setTab('world');
                setSearch('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'world' && !isSearchActive
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              ABD & Dünya Şehirleri
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Şehir veya eyalet arayın (örn: Wesley Chapel, Tampa, İzmir)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {isSearchingOnline && (
              <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" />
            )}
          </div>
        </div>

        {/* City List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {displayCities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <Compass className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold">"{search}" için sonuç bulunamadı.</p>
              <p className="text-[11px] text-slate-400">Üstteki "Otomatik Algıla (GPS)" butonuna tıklayabilirsiniz.</p>
            </div>
          ) : (
            displayCities.map((city) => {
              const isSelected =
                city.name === currentCity.name &&
                Math.abs(city.latitude - currentCity.latitude) < 0.1;
              return (
                <button
                  key={`${city.name}-${city.country}-${city.latitude}`}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between text-xs font-semibold ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{city.name}</span>
                        {city.isAutoDetected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                            GPS
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {city.country} {city.state ? `• ${city.state}` : ''}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">
            Seçili Konum: <strong className="text-slate-700 dark:text-slate-200">{currentCity.name}</strong> ({currentCity.country})
          </p>
        </div>
      </div>
    </div>
  );
};
