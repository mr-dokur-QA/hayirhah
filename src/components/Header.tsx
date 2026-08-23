import React from 'react';
import { Sparkles, MapPin, Compass, Settings, User as UserIcon, Moon } from 'lucide-react';
import { CityLocation } from '../data/islamicData';
import { User } from '../types';

interface HeaderProps {
  currentCity: CityLocation;
  onOpenCityPicker: () => void;
  onOpenQibla: () => void;
  onOpenAIReport: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  user: User | null;
  hijriDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onOpenCityPicker,
  onOpenQibla,
  onOpenAIReport,
  onOpenSettings,
  onOpenAuth,
  user,
  hijriDate = 'Ramazan-ı Şerif 1447',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 font-arabic text-xl font-bold">
            ح
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg sm:text-xl text-emerald-950 tracking-tight flex items-center gap-1.5">
                Hayırhah
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider hidden sm:inline-block">
                İbadet & Dua
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Moon className="w-3 h-3 text-emerald-600" />
              <span>{hijriDate}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Location Badge */}
          <button
            id="city-picker-btn"
            onClick={onOpenCityPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60 transition-colors text-xs font-semibold"
            title="Şehir Değiştir"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentCity.name}</span>
          </button>

          {/* Qibla Quick Button */}
          <button
            id="header-qibla-btn"
            onClick={onOpenQibla}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Kıble Pusulası"
          >
            <Compass className="w-4 h-4 text-emerald-700" />
          </button>

          {/* AI Spiritual Advisor Button */}
          <button
            id="header-ai-advisor-btn"
            onClick={onOpenAIReport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-medium text-xs shadow-xs transition-all"
            title="AI İbadet Danışmanı"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manevi Rapor</span>
          </button>

          {/* Settings Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Ayarlar"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile */}
          <button
            id="header-user-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-medium"
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
