import { QURAN_SURAHS } from '../data/islamicData';

export interface AyahMealItem {
  number: number;
  numberInSurah: number;
  juz: number;
  page?: number;
  surahNumber: number;
  surahTurkishName: string;
  turkishTranslation: string;
  isFirstAyahOfSurah: boolean;
}

// Backward compatibility alias
export type AyahItem = AyahMealItem;

// In-memory caches
const surahMealCache = new Map<number, AyahMealItem[]>();
const juzMealCache = new Map<number, AyahMealItem[]>();

// Offline / instantaneous fallback meals for prominent surahs
const ESSENTIAL_SURAHS_FALLBACK: Record<number, { numberInSurah: number; text: string }[]> = {
  // 1: Fâtiha
  1: [
    { numberInSurah: 1, text: 'Rahmân ve Rahîm olan Allah’ın adıyla.' },
    { numberInSurah: 2, text: 'Hamd, Âlemlerin Rabbi olan Allah’a mahsustur.' },
    { numberInSurah: 3, text: 'O, Rahmân’dır, Rahîm’dir.' },
    { numberInSurah: 4, text: 'Hesap ve ceza gününün (âhiret gününün) mâlikidir.' },
    { numberInSurah: 5, text: '(Rabbimiz!) Yalnız sana kulluk eder ve yalnız senden yardım dileriz.' },
    { numberInSurah: 6, text: 'Bizi doğru yola (Sırât-ı Müstakîm’e) ilet;' },
    { numberInSurah: 7, text: 'Kendilerine lütufta bulunduğun kimselerin yoluna; gazaba uğramışların ve sapmışların yoluna değil.' },
  ],
  // 108: Kevser
  108: [
    { numberInSurah: 1, text: 'Şüphesiz biz sana Kevser’i (pek çok hayır ve nimeti) verdik.' },
    { numberInSurah: 2, text: 'O halde Rabbin için namaz kıl ve kurban kes.' },
    { numberInSurah: 3, text: 'Doğrusu sana kin besleyen, asıl sonu kesik (ebter) olan odur.' },
  ],
  // 103: Asr
  103: [
    { numberInSurah: 1, text: 'Asra (zamana) yemin olsun ki;' },
    { numberInSurah: 2, text: 'İnsan gerçekten ziyan içindedir.' },
    { numberInSurah: 3, text: 'Ancak iman edip sâlih ameller işleyenler, birbirlerine hakkı tavsiye edenler ve sabrı tavsiye edenler müstesnadır.' },
  ],
  // 112: İhlâs
  112: [
    { numberInSurah: 1, text: 'De ki: O Allah birdir.' },
    { numberInSurah: 2, text: 'Allah Samed’dir (her şey O’na muhtaçtır, O hiçbir şeye muhtaç değildir).' },
    { numberInSurah: 3, text: 'O, doğurmamış ve doğmamıştır.' },
    { numberInSurah: 4, text: 'Hiçbir şey O’nun dengi ve benzeri değildir.' },
  ],
  // 113: Felak
  113: [
    { numberInSurah: 1, text: 'De ki: Sabahın Rabbine sığınırım;' },
    { numberInSurah: 2, text: 'Yarattığı şeylerin şerrinden,' },
    { numberInSurah: 3, text: 'Karanlığı çöktüğü zaman gecenin şerrinden,' },
    { numberInSurah: 4, text: 'Düğümlere üfleyen büyücülerin şerrinden,' },
    { numberInSurah: 5, text: 'Ve haset ettiği zaman hasetçinin şerrinden!' },
  ],
  // 114: Nâs
  114: [
    { numberInSurah: 1, text: 'De ki: İnsanların Rabbine sığınırım,' },
    { numberInSurah: 2, text: 'İnsanların hükümdarına (Mâlikine),' },
    { numberInSurah: 3, text: 'İnsanların ilâhına;' },
    { numberInSurah: 4, text: 'O sinsi vesvesecinin (şeytanın) şerrinden,' },
    { numberInSurah: 5, text: 'Ki o, insanların göğüslerine vesvese fısıldar;' },
    { numberInSurah: 6, text: 'Gerek cinlerden gerek insanlardan!' },
  ],
  // 94: İnşirah
  94: [
    { numberInSurah: 1, text: '(Ey Muhammed!) Senin göğsünü açıp genişletmedik mi?' },
    { numberInSurah: 2, text: 'Belini büken ağır yükünü üzerinden indirmedik mi?' },
    { numberInSurah: 3, text: 'Senin şanını ve namını yüceltmedik mi?' },
    { numberInSurah: 4, text: 'Elbette her zorlukla beraber bir kolaylık vardır.' },
    { numberInSurah: 5, text: 'Gerçekten her zorlukla beraber bir kolaylık vardır.' },
    { numberInSurah: 6, text: 'Öyleyse bir işi bitirince hemen diğerine koyul.' },
    { numberInSurah: 7, text: 'Ve yalnız Rabbine yönel, O’na rağbet et.' },
  ],
  // 97: Kadr
  97: [
    { numberInSurah: 1, text: 'Şüphesiz biz onu (Kur’an’ı) Kadir gecesinde indirdik.' },
    { numberInSurah: 2, text: 'Kadir gecesinin ne olduğunu sen bilir misin?' },
    { numberInSurah: 3, text: 'Kadir gecesi bin aydan daha hayırlıdır.' },
    { numberInSurah: 4, text: 'Melekler ve Ruh (Cebrail), o gecede Rablerinin izniyle her türlü iş için iner de iner.' },
    { numberInSurah: 5, text: 'O gece, tanyeri ağarana kadar bir esenliktir (selâmettir).' },
  ],
};

export const QuranService = {
  /**
   * Fetch complete Turkish Meal (Diyanet) for a given Surah (1 to 114)
   */
  async getSurah(surahNumber: number): Promise<AyahMealItem[]> {
    if (surahMealCache.has(surahNumber)) {
      return surahMealCache.get(surahNumber)!;
    }

    const localSurah = QURAN_SURAHS.find((s) => s.number === surahNumber);
    const surahTurkishName = localSurah?.englishNameTranslation || `Sure ${surahNumber}`;

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/tr.diyanet`);
      if (response.ok) {
        const json = await response.json();
        const rawAyahs = json?.data?.ayahs || [];

        const items: AyahMealItem[] = rawAyahs.map((a: any, idx: number) => ({
          number: a.number || idx + 1,
          numberInSurah: a.numberInSurah || idx + 1,
          juz: a.juz || 1,
          page: a.page || 1,
          surahNumber,
          surahTurkishName,
          turkishTranslation: a.text || '',
          isFirstAyahOfSurah: (a.numberInSurah || idx + 1) === 1,
        }));

        if (items.length > 0) {
          surahMealCache.set(surahNumber, items);
          return items;
        }
      }
    } catch (e) {
      console.warn(`Could not fetch online meal for surah ${surahNumber}, using fallback`, e);
    }

    // Check if we have pre-defined offline fallback
    if (ESSENTIAL_SURAHS_FALLBACK[surahNumber]) {
      const fallbackList: AyahMealItem[] = ESSENTIAL_SURAHS_FALLBACK[surahNumber].map((fb) => ({
        number: fb.numberInSurah,
        numberInSurah: fb.numberInSurah,
        juz: 1,
        surahNumber,
        surahTurkishName,
        turkishTranslation: fb.text,
        isFirstAyahOfSurah: fb.numberInSurah === 1,
      }));
      surahMealCache.set(surahNumber, fallbackList);
      return fallbackList;
    }

    // Return friendly placeholder if offline and not in fallback
    const totalAyahs = localSurah?.numberOfAyahs || 10;
    const defaultList: AyahMealItem[] = Array.from({ length: Math.min(totalAyahs, 7) }, (_, i) => ({
      number: i + 1,
      numberInSurah: i + 1,
      juz: 1,
      surahNumber,
      surahTurkishName,
      turkishTranslation: `${surahTurkishName} Suresi ${i + 1}. ayet-i kerime meali yükleniyor... İnternet bağlantınızı kontrol ediniz.`,
      isFirstAyahOfSurah: i === 0,
    }));

    return defaultList;
  },

  /**
   * Fetch complete Turkish Meal (Diyanet) for a given Juz (1 to 30)
   */
  async getJuz(juzNumber: number): Promise<AyahMealItem[]> {
    if (juzMealCache.has(juzNumber)) {
      return juzMealCache.get(juzNumber)!;
    }

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/tr.diyanet`);
      if (response.ok) {
        const json = await response.json();
        const rawAyahs = json?.data?.ayahs || [];

        const items: AyahMealItem[] = rawAyahs.map((a: any, idx: number) => {
          const surahNum = a.surah?.number || 1;
          const matchSurah = QURAN_SURAHS.find((s) => s.number === surahNum);
          const surahTurkishName = matchSurah?.englishNameTranslation || a.surah?.englishName || `Sure ${surahNum}`;

          return {
            number: a.number || idx + 1,
            numberInSurah: a.numberInSurah || idx + 1,
            juz: juzNumber,
            page: a.page || 1,
            surahNumber: surahNum,
            surahTurkishName,
            turkishTranslation: a.text || '',
            isFirstAyahOfSurah: (a.numberInSurah || idx + 1) === 1,
          };
        });

        if (items.length > 0) {
          juzMealCache.set(juzNumber, items);
          return items;
        }
      }
    } catch (e) {
      console.warn(`Could not fetch online meal for juz ${juzNumber}`, e);
    }

    // Fallback if offline
    if (juzNumber === 1 && ESSENTIAL_SURAHS_FALLBACK[1]) {
      const items: AyahMealItem[] = ESSENTIAL_SURAHS_FALLBACK[1].map((fb) => ({
        number: fb.numberInSurah,
        numberInSurah: fb.numberInSurah,
        juz: 1,
        surahNumber: 1,
        surahTurkishName: 'Fâtiha Suresi',
        turkishTranslation: fb.text,
        isFirstAyahOfSurah: fb.numberInSurah === 1,
      }));
      return items;
    }

    return [];
  },

  /**
   * Search Turkish translations across loaded/queried content
   */
  async searchMeal(query: string, surahNumber?: number): Promise<AyahMealItem[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQuery)}/all/tr.diyanet`);
      if (res.ok) {
        const json = await res.json();
        const matches = json?.data?.matches || [];
        return matches.slice(0, 50).map((m: any) => {
          const surahNum = m.surah?.number || 1;
          const matchSurah = QURAN_SURAHS.find((s) => s.number === surahNum);
          return {
            number: m.number,
            numberInSurah: m.numberInSurah,
            juz: m.juz || 1,
            page: m.page || 1,
            surahNumber: surahNum,
            surahTurkishName: matchSurah?.englishNameTranslation || m.surah?.englishName || `Sure ${surahNum}`,
            turkishTranslation: m.text,
            isFirstAyahOfSurah: m.numberInSurah === 1,
          };
        });
      }
    } catch (e) {
      console.warn('Search query failed', e);
    }

    return [];
  },
};
