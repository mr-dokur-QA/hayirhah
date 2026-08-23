import React, { useState } from 'react';
import { Sparkles, RotateCcw, Volume2, VolumeX, Flame, Award, CheckCircle2 } from 'lucide-react';
import { POPULAR_DHIKRS } from '../data/islamicData';
import { DhikrItem } from '../types';
import confetti from 'canvas-confetti';

export const Zikirmatik: React.FC = () => {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem>(POPULAR_DHIKRS[0]);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [totalLaps, setTotalLaps] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const handleIncrement = () => {
    playClickSound();
    const nextCount = count + 1;

    if (target > 0 && nextCount >= target) {
      // Reached target!
      setCount(0);
      setTotalLaps((l) => l + 1);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    if (confirm('Zikir sayacını sıfırlamak istediğinize emin misiniz?')) {
      setCount(0);
      setTotalLaps(0);
    }
  };

  const progressPercent = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Selector of Pre-set Dhikrs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Zikir Seçimi & Hedef
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_DHIKRS.map((dhikr) => (
            <button
              key={dhikr.id}
              onClick={() => {
                setSelectedDhikr(dhikr);
                setTarget(dhikr.targetCount || 33);
                setCount(0);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedDhikr.id === dhikr.id
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs block truncate">{dhikr.name}</span>
              <span className="text-[10px] font-arabic text-emerald-700 block truncate mt-0.5">
                {dhikr.arabic}
              </span>
            </button>
          ))}
        </div>

        {/* Target Buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Hedef:</span>
          {[33, 99, 100, 500, 1000].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTarget(t);
                setCount(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                target === t
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Digital Tasbih Counter Unit */}
      <div className="bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-emerald-800/40 flex flex-col items-center text-center space-y-6">
        {/* Selected Dhikr Display */}
        <div className="space-y-1">
          <span className="font-arabic text-2xl sm:text-3xl text-amber-300 font-semibold block">
            {selectedDhikr.arabic}
          </span>
          <h3 className="text-base font-bold text-white">{selectedDhikr.name}</h3>
          <p className="text-xs text-emerald-200/80">{selectedDhikr.meaning}</p>
        </div>

        {/* Digital LCD Counter Screen */}
        <div className="w-full max-w-xs bg-black/60 border-2 border-emerald-600/60 rounded-2xl p-4 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-emerald-900/60">
            <span>TUR: {totalLaps}</span>
            <span>HEDEF: {target}</span>
          </div>
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-emerald-400 py-3 select-none">
            {count.toString().padStart(4, '0')}
          </div>
          <div className="w-full h-1.5 rounded-full bg-emerald-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Big Tactile Clicker Button */}
        <div className="pt-2">
          <button
            id="zikirmatik-tap-btn"
            onClick={handleIncrement}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white font-black text-xl shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-150 border-4 border-emerald-300/40 flex flex-col items-center justify-center gap-1 select-none cursor-pointer"
          >
            <span className="font-arabic text-2xl">سبحان الله</span>
            <span className="text-xs uppercase tracking-widest font-bold">ÇEK (+1)</span>
          </button>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              soundEnabled ? 'bg-emerald-700 text-white' : 'bg-white/10 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Ses Açık' : 'Sessiz'}</span>
          </button>
        </div>

        {/* Virtue Note */}
        {selectedDhikr.virtue && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-emerald-200/90 text-left max-w-sm">
            <span className="font-bold text-amber-300">✨ Hadis-i Şerif: </span>
            {selectedDhikr.virtue}
          </div>
        )}
      </div>
    </div>
  );
};
