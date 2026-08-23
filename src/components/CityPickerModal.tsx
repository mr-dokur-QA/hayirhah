import React, { useState } from 'react';
import { Search, MapPin, Check, Globe } from 'lucide-react';
import { TURKEY_CITIES, WORLD_CITIES, CityLocation } from '../data/islamicData';

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
  const [tab, setTab] = useState<'turkey' | 'world'>('turkey');

  if (!isOpen) return null;

  const allCities = tab === 'turkey' ? TURKEY_CITIES : WORLD_CITIES;
  const filtered = allCities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.country && c.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg text-white">Şehir ve Konum Seçimi</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold">
            ✕
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('turkey')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'turkey' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Türkiye (81 İl)
            </button>
            <button
              onClick={() => setTab('world')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'world' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Mübarek & Dünya Şehirleri
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Şehir adı yazın (örn: İstanbul, Mekke, Konya)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* City List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-slate-100">
          {filtered.map((city) => {
            const isSelected = city.name === currentCity.name;
            return (
              <button
                key={city.name}
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between text-xs font-semibold ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{city.name}</span>
                  {city.country && <span className="text-[10px] text-slate-400">({city.country})</span>}
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
