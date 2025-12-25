import { Request, Response } from 'express';
import { prisma } from '../config/database';

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface PrayerData {
  fardPrayers?: Record<string, { isCompleted: boolean; completedSunnet?: boolean; completedTesbihat?: boolean }>;
  sunnahPrayers?: Record<string, boolean>;
  kazaPrayers?: Record<string, number>;
}

/**
 * Generate AI prayer report
 */
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { type, startDate, endDate } = req.body;

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      res.status(400).json({ error: 'Invalid report type. Use: daily, weekly, monthly' });
      return;
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      res.status(500).json({ error: 'AI service not configured' });
      return;
    }

    // Get prayer tracking data
    const userId = req.user.userId;
    const now = new Date();
    let dateFilter: { gte: Date; lte: Date };

    if (type === 'daily') {
      const targetDate = startDate ? new Date(startDate) : now;
      dateFilter = {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59),
      };
    } else if (type === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      dateFilter = { gte: weekStart, lte: weekEnd };
    } else {
      // monthly
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = { gte: monthStart, lte: monthEnd };
    }

    const prayerRecords = await prisma.prayerTracking.findMany({
      where: {
        userId,
        date: dateFilter,
      },
      orderBy: { date: 'asc' },
    });

    // Analyze data
    const analysisData = analyzeData(prayerRecords, type);
    const prompt = buildPrompt(analysisData, type, now);

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Sen yardımsever bir İslami ibadet danışmanısın. Türkçe konuşuyorsun ve samimi ama saygılı bir üslubun var.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      res.status(500).json({ error: 'AI service error', details: errorData });
      return;
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content || 'Rapor oluşturulamadı.';

    res.status(200).json({
      success: true,
      report: {
        type,
        content: content.trim(),
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: dateFilter.gte.toISOString(),
          end: dateFilter.lte.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('AI Report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

function analyzeData(records: any[], type: string): Record<string, any> {
  const totalDays = records.length;
  let completedFard = 0;
  let totalFard = 0;
  let completedSunnet = 0;
  let completedTesbihat = 0;
  let teheccudCount = 0;
  let duhaCount = 0;
  let evvabinCount = 0;
  let tespihCount = 0;
  let totalKaza = 0;

  const missedByPrayer: Record<string, number> = {
    sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0,
  };

  for (const record of records) {
    const fardPrayers = (record.fardPrayers as PrayerData['fardPrayers']) || {};
    const sunnahPrayers = (record.sunnahPrayers as PrayerData['sunnahPrayers']) || {};
    const kazaPrayers = (record.kazaPrayers as PrayerData['kazaPrayers']) || {};

    // Fard prayers analysis
    for (const [name, data] of Object.entries(fardPrayers)) {
      totalFard++;
      if (data?.isCompleted) {
        completedFard++;
        if (data?.completedSunnet) completedSunnet++;
        if (data?.completedTesbihat) completedTesbihat++;
      } else {
        const normalizedName = name.toLowerCase().replace('ö', 'o').replace('ş', 's').replace('ı', 'i');
        if (missedByPrayer[normalizedName] !== undefined) {
          missedByPrayer[normalizedName]++;
        }
      }
    }

    // Sunnah prayers
    if (sunnahPrayers.teheccud) teheccudCount++;
    if (sunnahPrayers.duha) duhaCount++;
    if (sunnahPrayers.evvabin) evvabinCount++;
    if (sunnahPrayers.tespih) tespihCount++;

    // Kaza prayers
    for (const count of Object.values(kazaPrayers)) {
      totalKaza += count || 0;
    }
  }

  // Find most/least missed
  const missedEntries = Object.entries(missedByPrayer);
  const mostMissed = missedEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  const leastMissed = missedEntries.reduce((a, b) => a[1] < b[1] ? a : b);

  const prayerNameMap: Record<string, string> = {
    sabah: 'Sabah', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı',
  };

  return {
    totalDays,
    totalFard: totalFard || totalDays * 5,
    completedFard,
    fardCompletionRate: totalFard > 0 ? Math.round((completedFard / totalFard) * 100) : 0,
    completedSunnet,
    completedTesbihat,
    sunnetRate: completedFard > 0 ? Math.round((completedSunnet / completedFard) * 100) : 0,
    tesbihatRate: completedFard > 0 ? Math.round((completedTesbihat / completedFard) * 100) : 0,
    mostMissedPrayer: prayerNameMap[mostMissed[0]] || mostMissed[0],
    mostMissedCount: mostMissed[1],
    leastMissedPrayer: prayerNameMap[leastMissed[0]] || leastMissed[0],
    leastMissedCount: leastMissed[1],
    teheccudCount,
    duhaCount,
    evvabinCount,
    tespihCount,
    totalKaza,
    missedByPrayer,
  };
}

function buildPrompt(data: Record<string, any>, type: string, date: Date): string {
  const turkishDays = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
  const turkishMonths = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];

  const commonRules = `
ONEMLI KURALLAR:
- Samimi, sicak ve arkadas gibi bir dil kullan (Hayirhah modunda bir arkadas gibi)
- ASLA yargilayici, elestiren veya suclayici olma
- Kullaniciyi kotu hissettiren ifadeler YASAK
- Her zaman tesvik edici ve destekleyici ol
- Kullanicinin cabasini takdir et
- Sadece Turkce karakterler ve cumleler kullan
- Sadece bolum basliklarinda emoji kullan, metin icinde emoji kullanma
- Raporun sonunda MUTLAKA kullaniciya dua et
- Raporun sonunda konuyla ilgili kisa bir hadis veya ayet meali ekle ve kaynagini belirt
`;

  if (type === 'daily') {
    return `
Sen Hayirhah uygulamasinin samimi ve destekleyici asistanisin. Kullanicinin gunluk namaz verilerini sicak bir dille ozetle.

${commonRules}

TARIH: ${turkishDays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}

GUNLUK VERILER:
- Farz Namaz: ${data.completedFard}/5
- Sunnet: ${data.completedSunnet}/5
- Tesbihat: ${data.completedTesbihat}/5
- Kaza Namazi: ${data.totalKaza} adet
- Teheccud: ${data.teheccudCount > 0 ? 'Evet' : 'Henuz yok'}
- Duha: ${data.duhaCount > 0 ? 'Evet' : 'Henuz yok'}

RAPOR FORMATI:

- "Merhaba kardesim!" diye baslayip gunun ozetini samimi bir dille anlat

💪 GUCLU YONLERIN
- Bugunku basarilarini ve guzel yonlerini vurgula (1-2 madde)

🌱 GELISTIRILECEK YONLER
- Nazikce ve tesvik edici sekilde onerilerde bulun
- Eger her sey mukemmelse, bunu kutla

🤲 DUA
- Icten bir dua ile kapatis

📖 ILHAM
- Kisa bir hadis veya ayet meali ve kaynagi

NOT: Maksimum 150 kelime. Arkadas gibi sicak ol.
`;
  } else if (type === 'weekly') {
    return `
Sen Hayirhah uygulamasinin samimi ve destekleyici asistanisin. Kullanicinin haftalik namaz verilerini sicak bir dille analiz et.

${commonRules}

HAFTA: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} haftasi

HAFTALIK VERILER:
- Kayitli Gun: ${data.totalDays}
- Farz Namaz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Duzenli Vakit: ${data.leastMissedPrayer}
- En Zorlandigi Vakit: ${data.mostMissedPrayer}
- Sunnet Orani: %${data.sunnetRate}
- Tesbihat Orani: %${data.tesbihatRate}

NAFILE NAMAZLAR:
- Teheccud: ${data.teheccudCount} gun
- Duha: ${data.duhaCount} gun
- Evvabin: ${data.evvabinCount} gun
- Tesbih Namazi: ${data.tespihCount} gun
- Kaza: ${data.totalKaza} adet

RAPOR FORMATI:

- "Merhaba kardesim!" diye baslayip haftanin kisa bir ozetini ver

💪 GUCLU YONLERIN
- Bu haftaki basarilari ve parlayan yonleri vurgula (2-3 madde)
- Hangi vakitte basarili, nafile namazlar, tesbihat vs.

🌱 GELISTIRILECEK YONLER
- Nazikce ve tesvik edici oneriler (davet seklinde)
- Cok basariliysa bunu kutla

🤲 DUA
- Icten bir dua ile kapatis

📖 ILHAM
- Ilham verici bir hadis veya ayet meali ve kaynagi

NOT: Maksimum 180 kelime. Arkadas gibi samimi ol.
`;
  } else {
    return `
Sen Hayirhah uygulamasinin samimi ve destekleyici asistanisin. Kullanicinin aylik namaz verilerini sicak bir dille ozetle.

${commonRules}

AY: ${turkishMonths[date.getMonth()]} ${date.getFullYear()}

AYLIK VERILER:
- Kayitli Gun: ${data.totalDays}
- Farz Namaz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Duzenli Vakit: ${data.leastMissedPrayer}
- En Zorlandigi Vakit: ${data.mostMissedPrayer}
- Sunnet Orani: %${data.sunnetRate}
- Tesbihat Orani: %${data.tesbihatRate}

NAFILE NAMAZLAR:
- Teheccud: ${data.totalTeheccud || data.teheccudCount} gun
- Duha: ${data.totalDuha || data.duhaCount} gun
- Evvabin: ${data.totalEvvabin || data.evvabinCount} gun
- Tesbih Namazi: ${data.totalTespih || data.tespihCount} gun
- Toplam Kaza: ${data.totalKaza} adet

RAPOR FORMATI:

- "Merhaba kardesim!" diye baslayip ayin kisa bir ozetini ver

💪 GUCLU YONLERIN
- Bu ayki basarilari ve one cikan yonleri vurgula (3-4 madde)
- Hangi vakitler guclu, nafile namazlar, tesbihat, kaza performansi

🌱 GELISTIRILECEK YONLER
- Nazikce ve tesvik edici oneriler (davet seklinde, baski yapma)

📈 GELECEK AY ICIN HEDEFLER
- 1-2 kucuk ve ulasildabilir hedef oner

🤲 DUA
- Icten bir dua ile kapatis

📖 ILHAM
- Ilham verici bir hadis veya ayet meali ve kaynagi

NOT: Maksimum 220 kelime. Arkadas gibi sicak ve samimi ol.
`;
  }
}

