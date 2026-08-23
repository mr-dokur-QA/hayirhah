import React, { useState } from 'react';
import { ARABIC_TEXTS } from '../data/islamicData';
import { CEVSEN_BABS, CevsenBab } from '../data/cevsenData';
import { ArabicTextItem } from '../types';
import { renderTevafukText } from '../utils/quranFormatter';
import { Sparkles, Check, Copy, ZoomIn, ZoomOut, RotateCcw, Shield, HeartHandshake, Eye, Bookmark, Award } from 'lucide-react';

export const ArabicTextViewer: React.FC = () => {
  const [selectedText, setSelectedText] = useState<ArabicTextItem>(ARABIC_TEXTS[0]);
  const [selectedBabFilter, setSelectedBabFilter] = useState<'all' | number>('all');
  const [fontSize, setFontSize] = useState<number>(26);
  const [fontFamily, setFontFamily] = useState<'husrev' | 'classic'>('husrev');
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [highlightTevafuk, setHighlightTevafuk] = useState(true);
  const [paperTheme, setPaperTheme] = useState<'parchment' | 'cream' | 'white' | 'dark'>('parchment');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [readCount, setReadCount] = useState<number>(0);

  const isCevsen = selectedText.id === 'cevsen';
  const isTefriciye = selectedText.id === 'tefriciye';

  const copyVerse = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getThemeClass = () => {
    switch (paperTheme) {
      case 'parchment':
        return 'bg-[#fbf7ea] text-slate-900 border-[#d8c79d]';
      case 'cream':
        return 'bg-[#fcfaf2] text-slate-900 border-amber-200/70';
      case 'white':
        return 'bg-white text-slate-900 border-slate-200';
      case 'dark':
        return 'bg-slate-900 text-slate-100 border-slate-700';
    }
  };

  const displayedCevsenBabs: CevsenBab[] = isCevsen
    ? selectedBabFilter === 'all'
      ? CEVSEN_BABS
      : CEVSEN_BABS.filter((b) => b.sectionNumber === selectedBabFilter || b.babNumber === selectedBabFilter)
    : [];

  return (
    <div className="space-y-6">
      {/* Selector Tabs: Sadece Cevşen ve Salât-ı Tefriciye */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        {ARABIC_TEXTS.map((item) => {
          const isCurrent = selectedText.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedText(item);
                setSelectedBabFilter('all');
                setReadCount(0);
              }}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
                isCurrent
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-md border-emerald-900 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-2xs'
              }`}
            >
              {item.id === 'cevsen' ? (
                <Shield className={`w-4 h-4 ${isCurrent ? 'text-amber-300' : 'text-emerald-700'}`} />
              ) : (
                <HeartHandshake className={`w-4 h-4 ${isCurrent ? 'text-amber-300' : 'text-emerald-700'}`} />
              )}
              <div className="text-left">
                <div className="leading-tight">{item.title}</div>
                <div className={`text-[11px] font-arabic ${isCurrent ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {item.arabicTitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Mushaf Reader Container */}
      <div className="rounded-2xl border border-slate-300/80 shadow-md overflow-hidden bg-white">
        {/* Banner Ser-lövha */}
        <div className="p-6 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-amber-500/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Mübarek Dualar & Virdler
              </span>
              {isCevsen && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-800/80 text-emerald-200">
                  100 Bab / 1001 İsm-i Şerif
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-arabic text-amber-100">{selectedText.arabicTitle}</h2>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {selectedText.title}
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{selectedText.description}</p>
          </div>

          {/* Reading Counter / Tasbeeh Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between sm:justify-start gap-4 text-center shrink-0">
            <div>
              <span className="text-[11px] text-amber-200 block font-semibold">Okuma Sayacı</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black text-white">{readCount}</span>
                {selectedText.countTarget && (
                  <span className="text-xs text-amber-300/80">/ {selectedText.countTarget.toLocaleString('tr-TR')}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReadCount((c) => c + 1)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
                  title="1 Arttır"
                >
                  +1
                </button>
                {isTefriciye && (
                  <>
                    <button
                      onClick={() => setReadCount((c) => c + 10)}
                      className="px-2.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                      title="10 Arttır"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => setReadCount((c) => c + 33)}
                      className="px-2.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                      title="33 Arttır"
                    >
                      +33
                    </button>
                  </>
                )}
              </div>
              {readCount > 0 && (
                <button
                  onClick={() => setReadCount(0)}
                  className="text-[10px] text-slate-300 hover:text-rose-300 flex items-center justify-center gap-1 opacity-80 hover:opacity-100"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Sıfırla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Controls Toolbar (Mushaf Tarzı Ayarlar) */}
        <div className="p-4 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            {/* Hat Seçimi */}
            <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 font-semibold text-slate-700 shadow-2xs">
              <button
                onClick={() => setFontFamily('husrev')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fontFamily === 'husrev'
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Okuması kolay Hüsrev Nesih Hattı"
              >
                Hüsrev Hattı
              </button>
              <button
                onClick={() => setFontFamily('classic')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fontFamily === 'classic'
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Klasik Arapça Hat"
              >
                Klasik Hat
              </button>
            </div>

            {/* Tevafuk Renklendirme Toggle */}
            <button
              onClick={() => setHighlightTevafuk(!highlightTevafuk)}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                highlightTevafuk
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
              title="Lafzatullah ve İlahi İsimleri Kırmızı ile Vurgula"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#d8264e]"></span>
              Tevâfuk Renklendirme
            </button>

            {/* Okunuş & Meal Toggles */}
            <button
              onClick={() => setShowTransliteration(!showTransliteration)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
                showTransliteration
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Okunuş (Türkçe)
            </button>

            <button
              onClick={() => setShowMeaning(!showMeaning)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
                showMeaning
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Türkçe Meâl
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Kağıt Teması */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setPaperTheme('parchment')}
                className={`w-6 h-6 rounded-lg bg-[#fbf7ea] border border-amber-300 transition-all ${
                  paperTheme === 'parchment' ? 'ring-2 ring-emerald-700 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Mushaf Saman Kağıdı"
              />
              <button
                onClick={() => setPaperTheme('cream')}
                className={`w-6 h-6 rounded-lg bg-[#fcfaf2] border border-amber-200 transition-all ${
                  paperTheme === 'cream' ? 'ring-2 ring-emerald-700 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Krem Rengi Kağıt"
              />
              <button
                onClick={() => setPaperTheme('white')}
                className={`w-6 h-6 rounded-lg bg-white border border-slate-300 transition-all ${
                  paperTheme === 'white' ? 'ring-2 ring-emerald-700 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Beyaz Kağıt"
              />
              <button
                onClick={() => setPaperTheme('dark')}
                className={`w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 transition-all ${
                  paperTheme === 'dark' ? 'ring-2 ring-emerald-700 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Gece Modu"
              />
            </div>

            {/* Font Boyutu Kontrolü */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
              <button
                onClick={() => setFontSize((s) => Math.max(20, s - 2))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Yazı Boyutunu Küçült"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-slate-800 px-1 text-xs">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(46, s + 2))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Yazı Boyutunu Büyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Cevşen İçin Bab / Bölüm Filtresi */}
        {isCevsen && (
          <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-200/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-amber-900 whitespace-nowrap flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-amber-700" />
              Bölüm Seç:
            </span>
            <button
              onClick={() => setSelectedBabFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                selectedBabFilter === 'all'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-amber-900 hover:bg-amber-100/60 border border-amber-200'
              }`}
            >
              Tüm Bablar (1 - 100)
            </button>
            {[1, 2, 4, 10, 20].map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedBabFilter(sec)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedBabFilter === sec
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-amber-900 hover:bg-amber-100/60 border border-amber-200'
                }`}
              >
                {sec}. Bölüm ({sec === 1 ? '1-5. Bab' : sec === 2 ? '6-10. Bab' : sec === 4 ? '20. Bab' : sec === 10 ? '50. Bab' : '99-100. Bab'})
              </button>
            ))}
          </div>
        )}

        {/* Mushaf Page Viewport */}
        <div className={`p-6 sm:p-10 space-y-8 max-h-[75vh] overflow-y-auto ${getThemeClass()}`}>
          {isCevsen ? (
            /* CEVSEN BABS VIEW */
            displayedCevsenBabs.map((bab) => (
              <div
                key={bab.babNumber}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 transition-all shadow-xs ${
                  paperTheme === 'dark'
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-white/80 border-[#d8c79d] hover:border-amber-500'
                }`}
              >
                {/* Gold Bab Rosette Badge & Header */}
                <div className="flex items-center justify-between pb-4 border-b border-amber-300/40 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold text-xs shadow-xs">
                      {bab.babNumber}
                    </span>
                    <span className="font-bold text-xs text-amber-900 tracking-wide">
                      Cevşen-ül Kebîr • {bab.babNumber}. Bab ({bab.sectionNumber}. Bölüm)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyVerse(bab.arabic, bab.babNumber)}
                      className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Arapça Metni Kopyala"
                    >
                      {copiedIndex === bab.babNumber ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Renkli Arapça Metin (Mushaf & Tevafuk Tarzı) */}
                <div
                  className={`${
                    fontFamily === 'husrev' ? 'font-husrev' : 'font-arabic'
                  } text-right font-medium leading-[2.6] px-2 tracking-wide select-text`}
                  style={{ fontSize: `${fontSize}px` }}
                  dir="rtl"
                >
                  {bab.arabic.split('\n').map((line, lIdx) => {
                    const isBismillah = line.includes('بِسْمِ اللَّهِ');
                    const isDuaResponse = line.includes('سُبْحَانَكَ يَا لَا إِلَٰهَ') || line.includes('سُبْحَانَكَ يَا لَا إِلَهَ');

                    return (
                      <div
                        key={lIdx}
                        className={`my-2 ${
                          isBismillah
                            ? 'text-center font-bold text-emerald-800 text-[0.9em] my-3 border-y border-amber-300/30 py-2'
                            : isDuaResponse
                            ? 'text-center font-bold text-amber-800 bg-amber-500/10 rounded-xl py-2 px-3 my-3 text-[0.92em]'
                            : ''
                        }`}
                      >
                        {renderTevafukText(line, undefined, highlightTevafuk)}
                      </div>
                    );
                  })}
                </div>

                {/* Okunuş (Türkçe) */}
                {showTransliteration && (
                  <div className="mt-5 pt-4 border-t border-amber-300/30">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Okunuşu (Türkçe Harfler):
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 italic leading-relaxed whitespace-pre-line">
                      {bab.transliteration}
                    </p>
                  </div>
                )}

                {/* Türkçe Meâl */}
                {showMeaning && (
                  <div className="mt-3 pt-3 border-t border-amber-200/30">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                      Türkçe Meâl & Anlamı:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                      {bab.meaning}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            /* SALAT-I TEFRICIYE VIEW */
            selectedText.verses.map((verse, index) => (
              <div
                key={verse.number}
                className={`relative p-6 sm:p-10 rounded-2xl border-2 transition-all shadow-md ${
                  paperTheme === 'dark'
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-white/95 border-[#d8c79d]'
                }`}
              >
                {/* Header Banner */}
                <div className="flex items-center justify-between pb-4 border-b border-amber-300/50 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 to-teal-800 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      ✨
                    </span>
                    <span className="font-bold text-sm text-emerald-950">
                      Salât-ı Tefriciye (Salât-ı Nâriye)
                    </span>
                  </div>

                  <button
                    onClick={() => copyVerse(verse.arabic, index)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Arapça Metni Kopyala"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Renklendirilmiş Salât-ı Tefriciye Arapça Metni */}
                <div
                  className={`${
                    fontFamily === 'husrev' ? 'font-husrev' : 'font-arabic'
                  } text-right font-medium leading-[2.6] px-2 sm:px-4 tracking-wide select-text text-slate-950`}
                  style={{ fontSize: `${fontSize}px` }}
                  dir="rtl"
                >
                  {renderTevafukText(verse.arabic, undefined, highlightTevafuk)}
                </div>

                {/* Okunuş */}
                {showTransliteration && (
                  <div className="mt-8 pt-5 border-t border-amber-300/40">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                      Türkçe Okunuşu:
                    </span>
                    <p className="text-xs sm:text-base font-medium text-slate-800 italic leading-relaxed">
                      {verse.turkish}
                    </p>
                  </div>
                )}

                {/* Meâl */}
                {showMeaning && verse.meaning && (
                  <div className="mt-4 pt-4 border-t border-amber-200/40">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                      Türkçe Meâli:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {verse.meaning}
                    </p>
                  </div>
                )}

                {/* Fazileti */}
                {verse.virtue && (
                  <div className="mt-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
                    <span className="font-bold flex items-center gap-1 text-amber-900 mb-1">
                      <Award className="w-4 h-4 text-amber-700" /> Fazilet ve Tavsiyesi:
                    </span>
                    {verse.virtue}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
