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
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const turkishMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const commonRules = `
ÖNEMLİ KURALLAR (KESİNLİKLE UYULMALI):
- ASLA yargılayıcı, eleştiren veya suçlayıcı bir dil KULLANMA
- "Kaçırdın", "yapamadın", "eksik kaldın", "ihmal ettin" gibi ifadeler YASAK
- Kullanıcıyı kötü hissettiren, utandıran veya baskı yapan cümleler YASAK
- Sadece NESNEL istatistiksel verileri sun
- Her zaman TEŞVİK EDİCİ ve DESTEKLEYICI ol
- Kullanıcının çabasını takdir et, yolculuğuna saygı göster
- "Kılınmayan" yerine "henüz kılınmayan" veya sadece rakamları kullan
- Negatif yerine pozitif çerçeveleme yap (örn: "3 namaz kılınmamış" yerine "2 namaz kılındı")
`;

  if (type === 'daily') {
    return `
Sen yardımsever bir ibadet takip asistanısın. Kullanıcının günlük namaz istatistiklerini Türkçe olarak özetle.

${commonRules}

📅 TARİH: ${turkishDays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}

📊 GÜNLÜK İSTATİSTİKLER:
- Farz Namaz: ${data.completedFard}/5 (%${data.fardCompletionRate})
- Sünnet: ${data.completedSunnet}/5 (%${data.sunnetRate})
- Tesbihat: ${data.completedTesbihat}/5 (%${data.tesbihatRate})
- Kaza Namazı: ${data.totalKaza} adet
- Teheccüd: ${data.teheccudCount > 0 ? 'Evet' : '-'}
- Duha: ${data.duhaCount > 0 ? 'Evet' : '-'}

RAPOR FORMATI:
1. Kısa ve sıcak bir selamlama
2. 📊 Günün özet istatistikleri (sayılar)
3. ✨ Bugün için bir teşvik cümlesi
4. 💪 Yarın için pozitif bir motivasyon

NOT: Maksimum 100 kelime. Emoji kullan. Sıcak ve destekleyici ol. YARGILAMA!
`;
  } else if (type === 'weekly') {
    return `
Sen yardımsever bir ibadet takip asistanısın. Kullanıcının haftalık namaz istatistiklerini Türkçe olarak analiz et.

${commonRules}

📅 HAFTA: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} haftası

📊 HAFTALIK İSTATİSTİKLER:
- Kayıtlı Gün: ${data.totalDays}
- Farz Namaz Toplamı: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Düzenli Vakit: ${data.leastMissedPrayer}
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR:
- Teheccüd: ${data.teheccudCount} gün
- Duha: ${data.duhaCount} gün
- Evvabin: ${data.evvabinCount} gün
- Tesbih Namazı: ${data.tespihCount} gün
- Kaza: ${data.totalKaza} adet

RAPOR FORMATI:
1. Sıcak bir selamlama
2. 📊 Haftalık istatistik özeti (sadece rakamlar, yorum yok)
3. ⭐ En güçlü yönler (2 madde - pozitif çerçeveleme)
4. 🎯 Önümüzdeki hafta için nazik öneriler (opsiyonel hedefler, zorunluluk değil)
5. 💚 Destekleyici kapanış

NOT: Maksimum 150 kelime. Pozitif ol. ASLA eleştirme veya yargılama!
`;
  } else {
    return `
Sen yardımsever bir ibadet takip asistanısın. Kullanıcının aylık namaz istatistiklerini Türkçe olarak özetle.

${commonRules}

📅 AY: ${turkishMonths[date.getMonth()]} ${date.getFullYear()}

📊 AYLIK İSTATİSTİKLER:
- Kayıtlı Gün: ${data.totalDays}
- Farz Namaz Toplamı: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR:
- Teheccüd: ${data.totalTeheccud || data.teheccudCount} gün
- Duha: ${data.totalDuha || data.duhaCount} gün
- Evvabin: ${data.totalEvvabin || data.evvabinCount} gün
- Tesbih Namazı: ${data.totalTespih || data.tespihCount} gün
- Toplam Kaza: ${data.totalKaza} adet

RAPOR FORMATI:
1. Sıcak bir selamlama ve ay özeti
2. 📊 Aylık istatistik tablosu (sadece sayılar)
3. 🌟 Ayın öne çıkan başarıları (3 madde - kutlama tonu)
4. 📈 İstatistiksel gözlemler (nötr, yargısız)
5. 🎯 Gelecek ay için nazik öneriler (isteğe bağlı hedefler)
6. 💚 İlham verici ve destekleyici kapanış

NOT: Maksimum 200 kelime. Her cümle pozitif olmalı. ASLA eleştirme, yargılama veya baskı yapma!
`;
  }
}

