import React from 'react';
import { MapPin, Compass, Settings, User as UserIcon, Moon, Sun } from 'lucide-react';
import { CityLocation } from '../data/islamicData';
import { User } from '../types';
import { CrescentStarLogo } from './CrescentStarLogo';

interface HeaderProps {
  currentCity: CityLocation;
  onOpenCityPicker: () => void;
  onOpenQibla: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  user: User | null;
  hijriDate?: string;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onOpenCityPicker,
  onOpenQibla,
  onOpenSettings,
  onOpenAuth,
  user,
  hijriDate = 'Ramazan-ı Şerif 1447',
  isNightMode = false,
  onToggleNightMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <CrescentStarLogo className="w-10 h-10" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg sm:text-xl text-emerald-950 dark:text-emerald-300 tracking-tight flex items-center gap-1.5">
                Hayırhah
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50 font-semibold uppercase tracking-wider hidden sm:inline-block">
                İbadet & Dua
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Moon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{hijriDate}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Night Mode Direct Header Toggle */}
          {onToggleNightMode && (
            <button
              id="header-night-mode-btn"
              onClick={onToggleNightMode}
              className={`p-2 rounded-xl transition-all ${
                isNightMode
                  ? 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              title={isNightMode ? 'Aydınlık Moduna Geç' : 'Gece Modunu Aç'}
            >
              {isNightMode ? <Moon className="w-4 h-4 text-amber-300 fill-amber-300/30" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          )}

          {/* Location Badge */}
          <button
            id="city-picker-btn"
            onClick={onOpenCityPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors text-xs font-semibold"
            title="Şehir Değiştir"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentCity.name}</span>
          </button>

          {/* Qibla Quick Button */}
          <button
            id="header-qibla-btn"
            onClick={onOpenQibla}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Kıble Pusulası"
          >
            <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>

          {/* Settings Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Ayarlar & Gece Modu"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile */}
          <button
            id="header-user-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors text-xs font-medium"
          >
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt={user.username}
                className="w-5 h-5 rounded-full object-cover border border-emerald-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
            )}
            <span className="hidden md:inline max-w-[80px] truncate">{user?.username || 'Giriş'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
