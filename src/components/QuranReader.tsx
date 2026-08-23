import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Bookmark,
  BookmarkCheck,
  Languages,
  FileText,
  Sparkles,
  RefreshCw,
  Palette,
  Eye,
  Check,
} from 'lucide-react';
import { QURAN_SURAHS } from '../data/islamicData';
import { JUZ_PAGE_RANGES, JuzPageRange, BookmarkData } from '../data/juzMapping';
import { QuranSurah } from '../types';
import { QuranService, AyahItem } from '../services/quranService';
import {
  renderTevafukText,
  toArabicDigits,
  JUZ_ARABIC_NAMES,
  cleanQuranText,
} from '../utils/quranFormatter';

interface QuranReaderProps {
  initialJuz?: number | null;
  initialSurahNumber?: number | null;
  onClearInitial?: () => void;
}

const BOOKMARK_STORAGE_KEY = 'hayirhah_quran_bookmark';

export const QuranReader: React.FC<QuranReaderProps> = ({
  initialJuz,
  initialSurahNumber,
  onClearInitial,
}) => {
  // Navigation tabs: 'juz' (30 Cüz Hatim) or 'surahs' (114 Sure)
  const [activeTab, setActiveTab] = useState<'juz' | 'surahs'>(initialSurahNumber ? 'surahs' : 'juz');

  // Reading view type: 'page' (Sayfa Sayfa - 20 sayfa) vs 'surah' (Sure Sure)
  const [viewMode, setViewMode] = useState<'page' | 'surah'>(initialSurahNumber ? 'surah' : 'page');

  // Page reading display format: 'mushaf' (Orijinal Sayfa / Altın Tezhip Çerçeveli Akıcı Kitap) vs 'cards' (Ayet Kartları)
  const [displayLayout, setDisplayLayout] = useState<'mushaf' | 'cards'>('mushaf');

  // Selected Juz and Range
  const [selectedJuz, setSelectedJuz] = useState<number>(initialJuz || 1);
  const currentJuzRange: JuzPageRange =
    JUZ_PAGE_RANGES.find((j) => j.juzNumber === selectedJuz) || JUZ_PAGE_RANGES[0];

  // Current page (1 - 604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialJuz) {
      const match = JUZ_PAGE_RANGES.find((j) => j.juzNumber === initialJuz);
      return match ? match.startPage : 1;
    }
    return 1;
  });

  // Selected Surah
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah>(() => {
    if (initialSurahNumber) {
      return QURAN_SURAHS.find((s) => s.number === initialSurahNumber) || QURAN_SURAHS[0];
    }
    return QURAN_SURAHS[0];
  });

  // Search in Surahs
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded Ayahs
  const [ayahs, setAyahs] = useState<AyahItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Styling & Reading Options
  const [fontSize, setFontSize] = useState<number>(27);
  const [fontFamily, setFontFamily] = useState<'husrev' | 'classic'>('husrev');
  const [highlightTevafuk, setHighlightTevafuk] = useState<boolean>(true); // Kırmızı Lafzatullah renklendirmesi
  const [paperTheme, setPaperTheme] = useState<'yellowish' | 'warm' | 'white'>('yellowish'); // Sarımtırak saman kağıdı vs Sıcak vs Beyaz

  // Translation / Meal Display Toggle
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [revealedTranslationMap, setRevealedTranslationMap] = useState<Record<number, boolean>>({});

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Bookmark / Ayraç state
  const [savedBookmark, setSavedBookmark] = useState<BookmarkData | null>(() => {
    try {
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  // Sync external initial props when changed (e.g. from Hatim task click)
  useEffect(() => {
    if (initialJuz) {
      setActiveTab('juz');
      setSelectedJuz(initialJuz);
      const match = JUZ_PAGE_RANGES.find((j) => j.juzNumber === initialJuz) || JUZ_PAGE_RANGES[0];
      setCurrentPage(match.startPage);
      setViewMode('page');
      if (onClearInitial) onClearInitial();
    } else if (initialSurahNumber) {
      setActiveTab('surahs');
      setViewMode('surah');
      const matchSurah = QURAN_SURAHS.find((s) => s.number === initialSurahNumber) || QURAN_SURAHS[0];
      setSelectedSurah(matchSurah);
      if (onClearInitial) onClearInitial();
    }
  }, [initialJuz, initialSurahNumber]);

  // Load Content based on viewMode (Page vs Surah)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    setRevealedTranslationMap({});

    // Stop audio on page change
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
      setActiveAudioIndex(null);
    }

    async function loadData() {
      try {
        if (viewMode === 'page') {
          const pageData = await QuranService.getPage(currentPage);
          if (isMounted) {
            setAyahs(pageData.ayahs);
            // Ensure selectedJuz matches this page
            const matchJuz = JUZ_PAGE_RANGES.find(
              (j) => currentPage >= j.startPage && currentPage <= j.endPage
            );
            if (matchJuz && matchJuz.juzNumber !== selectedJuz) {
              setSelectedJuz(matchJuz.juzNumber);
            }
            setLoading(false);
          }
        } else {
          const surahData = await QuranService.getSurah(selectedSurah.number);
          if (isMounted) {
            setAyahs(surahData);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error('Failed to load Quran text:', err);
        if (isMounted) {
          setLoadError('Arapça metinler yüklenirken bağlantı sorunu oluştu.');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedSurah, viewMode]);

  // Handle Juz Selection
  const handleSelectJuz = (juzNum: number) => {
    setSelectedJuz(juzNum);
    const match = JUZ_PAGE_RANGES.find((j) => j.juzNumber === juzNum) || JUZ_PAGE_RANGES[0];
    setCurrentPage(match.startPage);
    setViewMode('page');
  };

  // Handle Page Change
  const handleGoToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(604, pageNum));
    setCurrentPage(clamped);
    const matchJuz = JUZ_PAGE_RANGES.find((j) => clamped >= j.startPage && clamped <= j.endPage);
    if (matchJuz) {
      setSelectedJuz(matchJuz.juzNumber);
    }
    setViewMode('page');
  };

  const handleSelectSurah = (surah: QuranSurah) => {
    setSelectedSurah(surah);
    setViewMode('surah');
  };

  // Ayraç (Bookmark) Save and Restore handlers
  const handleSaveBookmark = () => {
    const bookmark: BookmarkData = {
      juzNumber: selectedJuz,
      pageNumber: currentPage,
      surahName: viewMode === 'surah' ? selectedSurah.englishNameTranslation : undefined,
      surahNumber: viewMode === 'surah' ? selectedSurah.number : undefined,
      savedAt: new Date().toISOString(),
      note: `${selectedJuz}. Cüz, Sayfa ${currentPage}`,
    };
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmark));
      setSavedBookmark(bookmark);
      setBookmarkToast(`Kaldığınız yer kaydedildi: ${selectedJuz}. Cüz, Sayfa ${currentPage}`);
      setTimeout(() => setBookmarkToast(null), 3500);
    } catch (e) {
      console.warn('Could not save bookmark', e);
    }
  };

  const handleGoToBookmark = () => {
    if (!savedBookmark) return;
    setSelectedJuz(savedBookmark.juzNumber);
    setCurrentPage(savedBookmark.pageNumber);
    setViewMode('page');
    setBookmarkToast(`${savedBookmark.juzNumber}. Cüz, Sayfa ${savedBookmark.pageNumber}'ye gidildi.`);
    setTimeout(() => setBookmarkToast(null), 3000);
  };

  const toggleSingleTranslation = (index: number) => {
    setRevealedTranslationMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Audio Recitation handler
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(false);
      setActiveAudioIndex(null);
    } else {
      if (ayahs.length > 0) {
        playAyahAudio(0);
      }
    }
  };

  const playAyahAudio = (index: number) => {
    if (index >= ayahs.length) {
      setIsPlayingAudio(false);
      setActiveAudioIndex(null);
      return;
    }
    const ayah = ayahs[index];
    if (!ayah?.audioUrl) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(ayah.audioUrl);
    audioElementRef.current = audio;
    setActiveAudioIndex(index);
    setIsPlayingAudio(true);

    audio.onended = () => {
      playAyahAudio(index + 1);
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setActiveAudioIndex(null);
    };

    audio.play().catch((err) => {
      console.warn('Audio play failed', err);
      setIsPlayingAudio(false);
    });
  };

  const filteredSurahs = QURAN_SURAHS.filter(
    (s) =>
      s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  // Compute page index within current juz (e.g. Sayfa 1/20)
  const pageIndexInJuz = currentPage - currentJuzRange.startPage + 1;
  const isBookmarkedCurrentPage = savedBookmark?.pageNumber === currentPage;

  // Find unique surah names on this page
  const pageSurahNames = Array.from(new Set(ayahs.map((a) => a.surahTurkishName))).join(', ');
  const firstSurahOnPage = ayahs[0]?.surahTurkishName || currentJuzRange.startSurahName;

  // Paper background class
  const paperClass =
    paperTheme === 'yellowish'
      ? 'bg-[#fbf7ea] text-slate-900 shadow-inner'
      : paperTheme === 'warm'
      ? 'bg-[#fdfbf7] text-slate-900'
      : 'bg-white text-slate-900';

  return (
    <div className="space-y-4">
      {/* Bookmark notification toast */}
      {bookmarkToast && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-medium">{bookmarkToast}</span>
          </div>
          <button onClick={() => setBookmarkToast(null)} className="text-emerald-200 hover:text-white ml-3 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Layout Grid: Sidebar Navigation + Reader Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Juz / Surah Selector & Bookmark Widget */}
        <div className="lg:col-span-4 space-y-4">
          {/* Bookmark (Ayraç) Box */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Kaldığım Yer (Ayraç)</span>
              </div>
              <button
                onClick={handleSaveBookmark}
                className="px-2.5 py-1 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-[11px] font-bold transition-all flex items-center gap-1 border border-emerald-500/40 text-emerald-100 shadow-2xs"
                title="Şu an okuduğunuz sayfayı ayraç olarak kaydeder"
              >
                <Bookmark className="w-3 h-3 text-amber-300" />
                <span>Burayı Ayraçla</span>
              </button>
            </div>

            {savedBookmark ? (
              <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">
                    {savedBookmark.juzNumber}. Cüz • Sayfa {savedBookmark.pageNumber}
                  </p>
                  <span className="text-[10px] text-emerald-200 block mt-0.5">
                    Kayıt:{' '}
                    {new Date(savedBookmark.savedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  onClick={handleGoToBookmark}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1"
                >
                  <span>Kaldığım Yere Git</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-emerald-200/80 italic">
                Henüz ayraç koymadınız. Okurken "Burayı Ayraçla"ya basarak kaldığınız sayfayı kaydedebilirsiniz.
              </p>
            )}
          </div>

          {/* Navigation Box (30 Cüz vs 114 Sure) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-4 max-h-[78vh] flex flex-col">
            {/* Tab switch */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => {
                  setActiveTab('juz');
                  setViewMode('page');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'juz' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>30 Cüz (Hatim)</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('surahs');
                  setViewMode('surah');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'surahs' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sureler</span>
              </button>
            </div>

            {/* 30 Cüz Listesi ve 20 Sayfalık Izgara */}
            {activeTab === 'juz' ? (
              <div className="overflow-y-auto space-y-3.5 flex-1 pr-1">
                {/* Current Selected Juz Header & 20 Pages Grid */}
                <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Seçili Cüz</span>
                      <h4 className="text-xs font-bold text-slate-900">{currentJuzRange.name}</h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      {currentJuzRange.totalPages} Sayfa ({currentJuzRange.startPage} - {currentJuzRange.endPage})
                    </span>
                  </div>

                  {/* 20 Pages Quick Grid for this Juz */}
                  <div className="pt-2 border-t border-emerald-200/70">
                    <span className="text-[10px] font-semibold text-emerald-900 block mb-1.5">
                      Cüzün 20 Sayfası (Tıkla ve Oku):
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: currentJuzRange.totalPages }, (_, i) => {
                        const pageNum = currentJuzRange.startPage + i;
                        const isCurrent = currentPage === pageNum && viewMode === 'page';
                        const isBookmarked = savedBookmark?.pageNumber === pageNum;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleGoToPage(pageNum)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all relative border ${
                              isCurrent
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : isBookmarked
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                            }`}
                            title={`Sayfa ${pageNum} (${i + 1}. sayfa)`}
                          >
                            <span>{pageNum}</span>
                            {isBookmarked && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 30 Cüz Grid */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-2">Tüm Cüzler (1 - 30):</span>
                  <div className="grid grid-cols-3 gap-2">
                    {JUZ_PAGE_RANGES.map((juz) => (
                      <button
                        key={juz.juzNumber}
                        onClick={() => handleSelectJuz(juz.juzNumber)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col justify-between ${
                          selectedJuz === juz.juzNumber && viewMode === 'page'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                        }`}
                      >
                        <span className="block text-[9px] uppercase tracking-wider opacity-75">Cüz</span>
                        <span className="text-base font-bold my-0.5">{juz.juzNumber}</span>
                        <span className="text-[9px] opacity-80 block truncate font-normal">
                          {juz.startSurahName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Sure Listesi */
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Sure adı veya numarası ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                  {filteredSurahs.map((surah) => (
                    <button
                      key={surah.number}
                      onClick={() => handleSelectSurah(surah)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between border ${
                        viewMode === 'surah' && selectedSurah.number === surah.number
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs font-bold'
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                          {surah.number}
                        </span>
                        <div>
                          <span className="text-xs font-bold block">{surah.englishNameTranslation}</span>
                          <span className="text-[10px] text-slate-400">
                            {surah.numberOfAyahs} Ayet • {surah.revelationType === 'Meccan' ? 'Mekki' : 'Medeni'}
                          </span>
                        </div>
                      </div>
                      <span className="font-arabic text-base text-emerald-800">{surah.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Area: Authentic Mushaf Page / Reader View */}
        <div className="lg:col-span-8 bg-slate-100/80 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden min-h-[85vh]">
          {/* Top Reading Header & Controls */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Header Title Info */}
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-700 text-white font-arabic text-lg font-bold flex items-center justify-center shadow-xs">
                  {viewMode === 'page' ? toArabicDigits(currentPage) : selectedSurah.name.charAt(0)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {viewMode === 'page'
                        ? `${selectedJuz}. Cüz — Sayfa ${currentPage}`
                        : `${selectedSurah.englishNameTranslation} Suresi`}
                    </h3>
                    {viewMode === 'page' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                        {pageIndexInJuz} / {currentJuzRange.totalPages}. Sayfa
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    {viewMode === 'page'
                      ? `${JUZ_ARABIC_NAMES[selectedJuz] || currentJuzRange.name} • ${pageSurahNames || currentJuzRange.startSurahName}`
                      : `${selectedSurah.name} • ${selectedSurah.numberOfAyahs} Ayet`}
                  </span>
                </div>
              </div>

              {/* Bookmark & Recitation controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveBookmark}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isBookmarkedCurrentPage
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Bu sayfayı ayraç olarak kaydet"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isBookmarkedCurrentPage ? 'Ayraçlı' : 'Ayraç Koy'}</span>
                </button>

                <button
                  onClick={handleToggleAudio}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs animate-pulse'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={isPlayingAudio ? 'Tilaveti Durdur' : 'Sayfayı Sesli Dinle'}
                >
                  {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'Durdur' : 'Dinle'}</span>
                </button>
              </div>
            </div>

            {/* Second Row: Kağıt Rengi, Tevâfuk Renklendirmesi, Yazı Boyutu, Sayfa Düzeni */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center flex-wrap gap-2">
                {/* Görünüm Modu: Mushaf Sayfası (Resimdeki gibi) vs Ayet Kartları */}
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 font-semibold text-slate-700">
                  <button
                    onClick={() => setDisplayLayout('mushaf')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      displayLayout === 'mushaf'
                        ? 'bg-amber-700 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ahmed Hüsrev Hattı - Orijinal Mushaf Sayfa Düzeni"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Hüsrev Mushafı</span>
                  </button>
                  <button
                    onClick={() => setDisplayLayout('cards')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      displayLayout === 'cards'
                        ? 'bg-amber-700 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ayet Kartları ve Mealli Görünüm"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Ayet Kartları</span>
                  </button>
                </div>

                {/* Tevâfuk Renklendirme Butonu (Kırmızı Lafzatullah) */}
                <button
                  onClick={() => setHighlightTevafuk(!highlightTevafuk)}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                    highlightTevafuk
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Lafzatullah ve Tevâfuk kelimelerini kırmızı renkle vurgula"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d8264e]" />
                  <span>Tevâfuklu (Kırmızı)</span>
                  {highlightTevafuk && <Check className="w-3 h-3 text-rose-600" />}
                </button>

                {/* Kağıt Tonu Seçici (Sarımtırak Saman Kağıdı vs Sıcak vs Beyaz) */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5">
                  <button
                    onClick={() => setPaperTheme('yellowish')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      paperTheme === 'yellowish'
                        ? 'bg-[#f5ecd0] text-amber-950 border border-amber-400/60 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Orijinal Sarımtırak Saman Kağıdı Tonu"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#e8dbb0]" />
                    <span>Sarı Kağıt</span>
                  </button>
                  <button
                    onClick={() => setPaperTheme('warm')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      paperTheme === 'warm'
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Hafif Krem Kağıt"
                  >
                    Krem
                  </button>
                  <button
                    onClick={() => setPaperTheme('white')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      paperTheme === 'white'
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Açık Beyaz Kağıt"
                  >
                    Beyaz
                  </button>
                </div>

                {/* Font Size */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 gap-1.5 font-bold text-slate-700">
                  <button
                    onClick={() => setFontSize((f) => Math.max(18, f - 2))}
                    className="hover:text-amber-700 px-1"
                    title="Yazıyı Küçült"
                  >
                    A-
                  </button>
                  <span className="text-[11px]">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize((f) => Math.min(46, f + 2))}
                    className="hover:text-amber-700 px-1"
                    title="Yazıyı Büyüt"
                  >
                    A+
                  </button>
                </div>

                {/* Meal Göster/Gizle Butonu */}
                <button
                  onClick={() => setShowAllTranslations(!showAllTranslations)}
                  className={`px-2.5 py-1 rounded-xl border font-bold transition-all flex items-center gap-1 ${
                    showAllTranslations
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Türkçe mealleri aç/kapat"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{showAllTranslations ? 'Mealleri Gizle' : 'Mealler'}</span>
                </button>
              </div>

              {/* Page Navigator (Önceki / Sonraki Sayfa) */}
              {viewMode === 'page' && (
                <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => handleGoToPage(currentPage - 1)}
                    className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 font-bold flex items-center gap-0.5 text-slate-700"
                    title="Önceki Sayfa"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Önceki</span>
                  </button>
                  <div className="px-2 text-center">
                    <span className="font-bold text-amber-950 text-xs">{currentPage} / 604</span>
                  </div>
                  <button
                    disabled={currentPage >= 604}
                    onClick={() => handleGoToPage(currentPage + 1)}
                    className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 font-bold flex items-center gap-0.5 text-slate-700"
                    title="Sonraki Sayfa"
                  >
                    <span className="hidden sm:inline text-[11px]">Sonraki</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reading Canvas: Authentic Ahmed Husrev Mushaf Page View */}
          <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-start bg-slate-200/50">
            {loading ? (
              <div className="py-28 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">
                  {viewMode === 'page'
                    ? `Sayfa ${currentPage} Hüsrev Tevâfuk Hattı ile hazırlanıyor...`
                    : 'Sure metinleri yükleniyor...'}
                </p>
              </div>
            ) : loadError ? (
              <div className="py-20 text-center space-y-3 text-slate-500">
                <Info className="w-8 h-8 mx-auto text-amber-600" />
                <p className="text-sm font-semibold text-slate-700">{loadError}</p>
                <button
                  onClick={() => handleGoToPage(currentPage)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tekrar Dene</span>
                </button>
              </div>
            ) : ayahs.length === 0 ? (
              <div className="py-20 text-center space-y-2 text-slate-500">
                <Info className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-semibold">Bu sayfada gösterilecek metin bulunamadı.</p>
              </div>
            ) : displayLayout === 'mushaf' ? (
              /* ==============================================================
                 1. AUTHENTIC MUSHAF PAGE (Resimdeki Ahmet Hüsrev Sayfa Düzeni)
                 ============================================================== */
              <div
                className={`w-full max-w-3xl rounded-3xl ${paperClass} p-4 sm:p-7 shadow-xl border-4 border-[#bca057] transition-all relative select-text`}
                style={{
                  boxShadow: '0 12px 36px -4px rgba(90, 70, 20, 0.18), inset 0 0 40px rgba(180, 150, 80, 0.12)',
                }}
              >
                {/* Inner Double Golden Border (Tezhip Çerçevesi) */}
                <div className="border-2 border-[#b5984d] rounded-2xl p-4 sm:p-6 relative bg-opacity-40">
                  {/* Outer Top Page Number & Margin Tezhip Rose */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#b5984d]/40">
                    {/* Top Left: Arabic Numeral Page */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#78591b]">
                      <span className="text-sm font-arabic">{toArabicDigits(currentPage)}</span>
                      <span className="text-[10px] opacity-75">({currentPage})</span>
                    </div>

                    {/* Top Center: Juz Header Banner (اَلْجُزْءُ ...) */}
                    <div className="px-5 py-1 rounded-xl bg-gradient-to-r from-[#e7d8af] via-[#f7f0dc] to-[#e7d8af] border border-[#b5984d] shadow-2xs text-center">
                      <span className="font-arabic text-base sm:text-lg font-bold text-[#4a360f] tracking-wider">
                        {JUZ_ARABIC_NAMES[selectedJuz] || `${selectedJuz}. CÜZ`}
                      </span>
                    </div>

                    {/* Top Right: Surah Name in Arabic */}
                    <div className="text-right text-xs font-bold text-[#78591b]">
                      <span className="font-arabic text-sm sm:text-base">{ayahs[0]?.surahArabicName || firstSurahOnPage}</span>
                    </div>
                  </div>

                  {/* Flowing Quran Text (Mushaf Sayfası Gibi Kesintisiz & Akıcı) */}
                  <div
                    className={`${
                      fontFamily === 'husrev' ? 'font-husrev' : 'font-arabic'
                    } text-right text-[#171717] font-medium leading-[2.6] sm:leading-[2.8] tracking-wide text-justify select-text space-y-4`}
                    style={{ fontSize: `${fontSize}px` }}
                    dir="rtl"
                  >
                    {ayahs.map((ayah, index) => {
                      const isPlayingThis = activeAudioIndex === index;
                      const isMealVisible = showAllTranslations || revealedTranslationMap[index];

                      return (
                        <React.Fragment key={`${ayah.surahNumber}-${ayah.numberInSurah}-${index}`}>
                          {/* If a new surah starts on this page, render authentic Surah Banner */}
                          {ayah.isFirstAyahOfSurah && (
                            <div className="my-5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#eddcb4] via-[#fdf9eb] to-[#eddcb4] border-2 border-[#b5984d] text-center shadow-xs select-none">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs font-bold text-[#78591b] uppercase tracking-wider">
                                  {ayah.surahTurkishName} Suresi
                                </span>
                                <span className="font-arabic text-lg sm:text-xl font-bold text-[#4a360f]">
                                  سُورَةُ {ayah.surahArabicName}
                                </span>
                              </div>

                              {/* Bismillah Header */}
                              {ayah.surahNumber !== 9 && ayah.surahNumber !== 1 && (
                                <div className="pt-2 border-t border-[#b5984d]/40 mt-2">
                                  <span className="font-arabic text-2xl sm:text-3xl text-[#1e1b18] font-semibold block leading-loose">
                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ayah Flow Text with Tevafuk Red highlight & Rosette */}
                          <span
                            className={`inline transition-colors rounded-lg px-1 ${
                              isPlayingThis ? 'bg-amber-300/40 ring-1 ring-amber-500/50' : ''
                            }`}
                          >
                            {renderTevafukText(ayah.arabicText, ayah.numberInSurah, highlightTevafuk)}
                          </span>

                          {/* Inline translation if revealed */}
                          {isMealVisible && ayah.turkishTranslation && (
                            <div
                              className="my-3 p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-left text-xs sm:text-sm text-slate-800 font-normal leading-relaxed not-italic select-text"
                              dir="ltr"
                            >
                              <div className="flex items-center justify-between font-bold text-amber-900 text-[11px] mb-1">
                                <span>
                                  {ayah.surahTurkishName} : {ayah.numberInSurah}. Ayet Meali
                                </span>
                                <button
                                  onClick={() => toggleSingleTranslation(index)}
                                  className="text-amber-800 hover:text-amber-950 text-[10px]"
                                >
                                  ✕ Kapat
                                </button>
                              </div>
                              <p>{ayah.turkishTranslation}</p>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Bottom Page Indicator Footer */}
                  <div className="flex items-center justify-between pt-4 mt-5 border-t border-[#b5984d]/40 text-xs text-[#78591b] font-medium">
                    <span className="font-bold">{currentPage}</span>
                    <span className="text-[11px] opacity-80">
                      {selectedJuz}. Cüz — Sayfa {pageIndexInJuz} / {currentJuzRange.totalPages}
                    </span>
                    <span className="font-arabic text-sm font-bold">{toArabicDigits(currentPage)}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ==============================================================
                 2. AYAH CARDS VIEW (Ayet Kartları & Meal Karşılaştırma)
                 ============================================================== */
              <div className="w-full max-w-3xl space-y-4">
                {ayahs.map((ayah, index) => {
                  const isMealRevealed = showAllTranslations || revealedTranslationMap[index];
                  const isPlayingThisAyah = activeAudioIndex === index;

                  return (
                    <div key={`${ayah.surahNumber}-${ayah.numberInSurah}-${index}`} className="space-y-3">
                      {/* Surah Header if first ayah */}
                      {ayah.isFirstAyahOfSurah && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#eddcb4] via-[#fbf7ea] to-[#eddcb4] border-2 border-[#b5984d] text-center shadow-xs">
                          <h4 className="text-sm font-bold text-[#4a360f]">
                            {ayah.surahTurkishName} Suresi ({ayah.surahArabicName})
                          </h4>
                          {ayah.surahNumber !== 9 && ayah.surahNumber !== 1 && (
                            <span className="font-arabic text-2xl text-[#1e1b18] block mt-1">
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card */}
                      <div
                        className={`p-5 rounded-2xl ${paperClass} border-2 transition-all space-y-3 shadow-sm ${
                          isPlayingThisAyah
                            ? 'border-amber-500 bg-amber-100/50 ring-2 ring-amber-400/40'
                            : 'border-[#c9ae64]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                            <span className="w-8 h-8 rounded-xl bg-[#eadeba] text-[#5e4411] border border-[#b5984d] text-xs font-bold flex items-center justify-center">
                              {ayah.numberInSurah}
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium">{ayah.surahTurkishName}</span>

                            {!showAllTranslations && ayah.turkishTranslation && (
                              <button
                                onClick={() => toggleSingleTranslation(index)}
                                className={`mt-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border ${
                                  isMealRevealed
                                    ? 'bg-amber-200 text-amber-950 border-amber-400'
                                    : 'bg-white/80 text-slate-700 hover:bg-amber-100 border-slate-300'
                                }`}
                              >
                                <Languages className="w-3 h-3" />
                                <span>{isMealRevealed ? 'Gizle' : 'Meal'}</span>
                              </button>
                            )}
                          </div>

                          <div
                            className={`${
                              fontFamily === 'husrev' ? 'font-husrev' : 'font-arabic'
                            } text-right text-slate-900 font-medium leading-[2.5] tracking-wide flex-1 select-text`}
                            style={{ fontSize: `${fontSize}px` }}
                            dir="rtl"
                          >
                            {renderTevafukText(ayah.arabicText, ayah.numberInSurah, highlightTevafuk)}
                          </div>
                        </div>

                        {/* Turkish Meal */}
                        {isMealRevealed && ayah.turkishTranslation && (
                          <div className="pt-3 border-t border-amber-300/60 bg-amber-50/80 p-3 rounded-xl">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 mb-1">
                              <FileText className="w-3 h-3" />
                              <span>Diyanet Meali:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                              {ayah.turkishTranslation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Page Navigation Bar: Next / Prev Page */}
            {viewMode === 'page' && (
              <div className="w-full max-w-3xl pt-6 mt-4 border-t border-slate-300/80 flex items-center justify-between gap-3">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => {
                    handleGoToPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 disabled:opacity-30 flex items-center gap-2 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Önceki Sayfa ({currentPage > 1 ? currentPage - 1 : 1})</span>
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold text-slate-900 block">
                    {selectedJuz}. Cüz — Sayfa {pageIndexInJuz} / {currentJuzRange.totalPages}
                  </span>
                  <span className="text-[10px] text-slate-500">Toplam Kur'an Sayfası: {currentPage} / 604</span>
                </div>

                <button
                  disabled={currentPage >= 604}
                  onClick={() => {
                    handleGoToPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold disabled:opacity-30 flex items-center gap-2 shadow-xs"
                >
                  <span>Sonraki Sayfa ({currentPage < 604 ? currentPage + 1 : 604})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
