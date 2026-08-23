import { QURAN_SURAHS } from '../data/islamicData';

export interface AyahItem {
  number: number;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber: number;
  surahArabicName: string;
  surahTurkishName: string;
  arabicText: string;
  turkishTranslation: string;
  audioUrl: string;
  isFirstAyahOfSurah: boolean;
}

/**
 * Strips any API-prepended Bismillah prefix from Ayah 1 of Surahs (except Surah 1 Al-Fatiha, where Bismillah IS Ayah 1).
 * This ensures Bismillah is rendered ONLY in the authentic Surah Ser-lövha (Header Banner) at the beginning of surahs,
 * and never repeated inside the ayah text or attached to arbitrary pages.
 */
export function stripBismillahFromAyah(rawText: string, surahNum: number, numberInSurah: number): string {
  if (!rawText) return '';
  if (surahNum === 1 || numberInSurah !== 1) {
    return rawText;
  }
  // Remove Uthmani / standard Bismillah prefixes from Ayah 1 (handling BOM, zero-width spaces, diacritics)
  const bismillahRegex = /^[\uFEFF\u200B\s]*بِسْمِ[\s\S]+?ٱ?لرَّحْمَ[ٰـ]?نِ\s+ٱ?لرَّحِيمِ\s*/u;
  const stripped = rawText.replace(bismillahRegex, '').trim();
  return stripped.length > 0 ? stripped : rawText;
}

export interface PageResponse {
  pageNumber: number;
  juzNumber: number;
  ayahs: AyahItem[];
  surahsOnPage: {
    number: number;
    arabicName: string;
    turkishName: string;
  }[];
}

// In-memory cache to prevent re-fetching
const pageCache = new Map<number, PageResponse>();
const juzCache = new Map<number, AyahItem[]>();
const surahCache = new Map<number, AyahItem[]>();

export const QuranService = {
  // Fetch a specific page (1 to 604)
  async getPage(pageNumber: number): Promise<PageResponse> {
    if (pageCache.has(pageNumber)) {
      return pageCache.get(pageNumber)!;
    }

    try {
      const [arabicRes, turkishRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/tr.diyanet`).catch(() => null),
      ]);

      if (!arabicRes.ok) {
        throw new Error(`Failed to fetch page ${pageNumber}`);
      }

      const arabicJson = await arabicRes.json();
      let turkishJson: any = null;
      if (turkishRes && turkishRes.ok) {
        turkishJson = await turkishRes.json();
      }

      const rawArabicAyahs = arabicJson?.data?.ayahs || [];
      const rawTurkishAyahs = turkishJson?.data?.ayahs || [];

      const surahsOnPageMap = new Map<number, { number: number; arabicName: string; turkishName: string }>();

      const ayahs: AyahItem[] = rawArabicAyahs.map((a: any, index: number) => {
        const surahInfo = a.surah || {};
        const surahNum = surahInfo.number || 1;
        const matchingLocalSurah = QURAN_SURAHS.find((s) => s.number === surahNum);

        const turkishName = matchingLocalSurah?.englishNameTranslation || surahInfo.englishName || `Sure ${surahNum}`;
        const arabicName = surahInfo.name || matchingLocalSurah?.name || '';

        if (!surahsOnPageMap.has(surahNum)) {
          surahsOnPageMap.set(surahNum, {
            number: surahNum,
            arabicName,
            turkishName,
          });
        }

        const isFirst = a.numberInSurah === 1;
        const cleanedArabicText = stripBismillahFromAyah(a.text, surahNum, a.numberInSurah);

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          juz: a.juz || 1,
          page: a.page || pageNumber,
          surahNumber: surahNum,
          surahArabicName: arabicName,
          surahTurkishName: turkishName,
          arabicText: cleanedArabicText,
          turkishTranslation: rawTurkishAyahs[index]?.text || '',
          audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
          isFirstAyahOfSurah: isFirst,
        };
      });

      const response: PageResponse = {
        pageNumber,
        juzNumber: ayahs[0]?.juz || 1,
        ayahs,
        surahsOnPage: Array.from(surahsOnPageMap.values()),
      };

      pageCache.set(pageNumber, response);
      return response;
    } catch (error) {
      console.error(`QuranService getPage(${pageNumber}) error:`, error);
      throw error;
    }
  },

  // Fetch all Ayahs of a complete Juz (1 to 30)
  async getJuz(juzNumber: number): Promise<AyahItem[]> {
    if (juzCache.has(juzNumber)) {
      return juzCache.get(juzNumber)!;
    }

    try {
      const [arabicRes, turkishRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/tr.diyanet`).catch(() => null),
      ]);

      if (!arabicRes.ok) {
        throw new Error(`Failed to fetch juz ${juzNumber}`);
      }

      const arabicJson = await arabicRes.json();
      let turkishJson: any = null;
      if (turkishRes && turkishRes.ok) {
        turkishJson = await turkishRes.json();
      }

      const rawArabicAyahs = arabicJson?.data?.ayahs || [];
      const rawTurkishAyahs = turkishJson?.data?.ayahs || [];

      const ayahs: AyahItem[] = rawArabicAyahs.map((a: any, index: number) => {
        const surahInfo = a.surah || {};
        const surahNum = surahInfo.number || 1;
        const matchingLocalSurah = QURAN_SURAHS.find((s) => s.number === surahNum);

        const turkishName = matchingLocalSurah?.englishNameTranslation || surahInfo.englishName || `Sure ${surahNum}`;
        const arabicName = surahInfo.name || matchingLocalSurah?.name || '';
        const isFirst = a.numberInSurah === 1;
        const cleanedArabicText = stripBismillahFromAyah(a.text, surahNum, a.numberInSurah);

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          juz: a.juz || juzNumber,
          page: a.page || 1,
          surahNumber: surahNum,
          surahArabicName: arabicName,
          surahTurkishName: turkishName,
          arabicText: cleanedArabicText,
          turkishTranslation: rawTurkishAyahs[index]?.text || '',
          audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
          isFirstAyahOfSurah: isFirst,
        };
      });

      juzCache.set(juzNumber, ayahs);
      return ayahs;
    } catch (error) {
      console.error(`QuranService getJuz(${juzNumber}) error:`, error);
      throw error;
    }
  },

  // Fetch full Surah
  async getSurah(surahNumber: number): Promise<AyahItem[]> {
    if (surahCache.has(surahNumber)) {
      return surahCache.get(surahNumber)!;
    }

    try {
      const [arabicRes, turkishRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/tr.diyanet`).catch(() => null),
      ]);

      if (!arabicRes.ok) {
        throw new Error(`Failed to fetch surah ${surahNumber}`);
      }

      const arabicJson = await arabicRes.json();
      let turkishJson: any = null;
      if (turkishRes && turkishRes.ok) {
        turkishJson = await turkishRes.json();
      }

      const rawArabicAyahs = arabicJson?.data?.ayahs || [];
      const rawTurkishAyahs = turkishJson?.data?.ayahs || [];
      const matchingLocalSurah = QURAN_SURAHS.find((s) => s.number === surahNumber);

      const ayahs: AyahItem[] = rawArabicAyahs.map((a: any, index: number) => {
        const isFirst = a.numberInSurah === 1;
        const cleanedArabicText = stripBismillahFromAyah(a.text, surahNumber, a.numberInSurah);

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          juz: a.juz || 1,
          page: a.page || 1,
          surahNumber,
          surahArabicName: matchingLocalSurah?.name || '',
          surahTurkishName: matchingLocalSurah?.englishNameTranslation || `Sure ${surahNumber}`,
          arabicText: cleanedArabicText,
          turkishTranslation: rawTurkishAyahs[index]?.text || '',
          audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
          isFirstAyahOfSurah: isFirst,
        };
      });

      surahCache.set(surahNumber, ayahs);
      return ayahs;
    } catch (error) {
      console.error(`QuranService getSurah(${surahNumber}) error:`, error);
      throw error;
    }
  },
};
