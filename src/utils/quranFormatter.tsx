import React from 'react';

// Convert numbers to Arabic / Ottoman numerals
export function toArabicDigits(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((char) => digits[parseInt(char, 10)] || char)
    .join('');
}

export const JUZ_ARABIC_NAMES: Record<number, string> = {
  1: 'اَلْجُزْءُ الْاَوَّلُ',
  2: 'اَلْجُزْءُ الثَّانِي',
  3: 'اَلْجُزْءُ الثَّالِثُ',
  4: 'اَلْجُزْءُ الرَّابِعُ',
  5: 'اَلْجُزْءُ الْخَامِسُ',
  6: 'اَلْجُزْءُ السَّادِسُ',
  7: 'اَلْجُزْءُ السَّابِعُ',
  8: 'اَلْجُزْءُ الثَّامِنُ',
  9: 'اَلْجُزْءُ التَّاسِعُ',
  10: 'اَلْجُزْءُ الْعَاشِرُ',
  11: 'اَلْجُزْءُ الْحَادِي عَشَرَ',
  12: 'اَلْجُزْءُ الثَّانِي عَشَرَ',
  13: 'اَلْجُزْءُ الثَّالِثَ عَشَرَ',
  14: 'اَلْجُزْءُ الرَّابِعَ عَشَرَ',
  15: 'اَلْجُزْءُ الْخَامِسَ عَشَرَ',
  16: 'اَلْجُزْءُ السَّادِسَ عَشَرَ',
  17: 'اَلْجُزْءُ السَّابِعَ عَشَرَ',
  18: 'اَلْجُزْءُ الثَّامِنَ عَشَرَ',
  19: 'اَلْجُزْءُ التَّاسِعَ عَشَرَ',
  20: 'اَلْجُزْءُ الْعِشْرُونَ',
  21: 'اَلْجُزْءُ الْحَادِي وَالْعِشْرُونَ',
  22: 'اَلْجُزْءُ الثَّانِي وَالْعِشْرُونَ',
  23: 'اَلْجُزْءُ الثَّالِثُ وَالْعِشْرُونَ',
  24: 'اَلْجُزْءُ الرَّابِعُ وَالْعِشْرُونَ',
  25: 'اَلْجُزْءُ الْخَامِسُ وَالْعِشْرُونَ',
  26: 'اَلْجُزْءُ السَّادِسُ وَالْعِشْرُونَ',
  27: 'اَلْجُزْءُ السَّابِعُ وَالْعِشْرُونَ',
  28: 'اَلْجُزْءُ الثَّامِنُ وَالْعِشْرُونَ',
  29: 'اَلْجُزْءُ التَّاسِعُ وَالْعِشْرُونَ',
  30: 'اَلْجُزْءُ الثَّلَاثُونَ',
};

/**
 * Cleans obscure Medina/Uthmani micro glyphs that cause messy font overlap,
 * transforming the text into clean, easily readable Turkish Naskh (Ahmet Hüsrev) style.
 */
export function cleanQuranText(text: string): string {
  if (!text) return '';

  return text
    // Replace Wasla Alif with standard Alif
    .replace(/ٱ/g, 'ا')
    // Replace special Medina sukoon (rounded zero \u06DF) with standard sukoon (\u0652)
    .replace(/\u06DF/g, '\u0652')
    // Remove obscure micro Uthmani annotation marks that clutter web fonts:
    // \u06E0 to \u06EC (micro stops, small letters)
    .replace(/[\u06E0\u06E2\u06E3\u06E5\u06E6\u06E7\u06E8\u06EA\u06EB\u06EC\u06ED]/g, '')
    // Normalize dagger alif if disjointed
    .replace(/\u0670/g, 'ٰ')
    // Clean potential duplicate diacritics
    .replace(/([\u064B-\u065F])\1+/g, '$1')
    .trim();
}

/**
 * Checks if a word is Lafzatullah (Allah, Lillahi, Billahi, Wallahu, etc.) or divine name for Tevafuk coloring
 */
export function isLafzatullah(word: string): boolean {
  // Strip diacritics / harekes / punctuation to check base word
  const stripped = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\s,،؛.()١-٩0-9]/g, '').trim();

  // Common forms of Lafzatullah and sacred names in Tevafuklu Mushaf & Cevsen
  const lafzatPatterns = [
    'الله',
    'لله',
    'بالله',
    'والله',
    'فلله',
    'تالله',
    'اللهم',
    'ولله',
    'فالله',
    'كالله',
    'محمد',
    'محمدا',
    'محمدٍ',
  ];

  return lafzatPatterns.includes(stripped);
}

/**
 * Checks if a token is a Waqf / Durak sign (ج, ط, قف, ص, صلى, قلي, لا, م, ز)
 */
export function isWaqfSign(token: string): boolean {
  const clean = token.replace(/[\u064B-\u065F]/g, '').trim();
  const waqfs = ['ج', 'ط', 'قف', 'ص', 'صلى', 'قلى', 'لا', 'م', 'ز', 'صل', 'قل', 'ع'];
  return waqfs.includes(clean);
}

/**
 * Renders Arabic Quran text with:
 * 1. Clean legible font (obscure marks cleaned)
 * 2. Tevâfuklu Red/Rose coloring for Lafzatullah
 * 3. Golden/amber Ayah end rosette markers with numbers
 */
export function renderTevafukText(
  rawText: string,
  ayahNumber?: number,
  highlightLafzat: boolean = true
): React.ReactNode {
  const cleaned = cleanQuranText(rawText);
  // Split words while preserving spaces
  const words = cleaned.split(/(\s+)/);

  return (
    <span>
      {words.map((word, idx) => {
        if (!word) return null;
        if (/^\s+$/.test(word)) {
          return ' ';
        }

        const isAllah = highlightLafzat && isLafzatullah(word);
        const isWaqf = isWaqfSign(word);

        if (isAllah) {
          return (
            <span
              key={idx}
              className="text-[#d8264e] font-bold inline-block hover:scale-105 transition-transform"
              title="Lafzatullah (Tevâfuk)"
            >
              {word}
            </span>
          );
        }

        if (isWaqf) {
          return (
            <span
              key={idx}
              className="text-[#c53030] text-[0.75em] font-semibold align-super px-0.5 opacity-90 inline-block"
            >
              {word}
            </span>
          );
        }

        return <span key={idx}>{word}</span>;
      })}

      {ayahNumber !== undefined && (
        <span
          className="inline-flex items-center justify-center mx-1.5 align-middle select-none"
          title={`Ayet ${ayahNumber}`}
        >
          <span className="relative inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
            {/* Ornate Gold Rosette SVG */}
            <svg
              className="w-full h-full text-[#c59e47] drop-shadow-xs"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="1.6" fill="#faf5e4" />
              <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              {/* Petals / Rays */}
              <circle cx="18" cy="3" r="1.5" fill="currentColor" />
              <circle cx="18" cy="33" r="1.5" fill="currentColor" />
              <circle cx="3" cy="18" r="1.5" fill="currentColor" />
              <circle cx="33" cy="18" r="1.5" fill="currentColor" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-arabic text-[11px] sm:text-xs font-bold text-[#78591b]">
              {toArabicDigits(ayahNumber)}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
