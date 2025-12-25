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

    const data = await response.json();
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

  if (type === 'daily') {
    return `
Sen bir İslami ibadet danışmanısın. Kullanıcının günlük namaz verilerini analiz edip Türkçe, samimi ve motive edici bir rapor hazırla.

📅 TARİH: ${turkishDays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}

📊 GÜNLÜK VERİLER:
- Farz Namaz: ${data.completedFard}/5 kılındı (%${data.fardCompletionRate})
- Sünnet Namazlar: ${data.completedSunnet}/5 (%${data.sunnetRate})
- Tesbihat: ${data.completedTesbihat}/5 (%${data.tesbihatRate})
- Kılınan Kaza Namazı: ${data.totalKaza} adet
- Teheccüd: ${data.teheccudCount > 0 ? 'Evet' : 'Hayır'}
- Duha: ${data.duhaCount > 0 ? 'Evet' : 'Hayır'}

RAPOR FORMATI:
1. Kısa bir selamlama ve genel değerlendirme (1-2 cümle)
2. ✅ Başarılar (varsa)
3. ⚠️ Dikkat Edilmesi Gerekenler (varsa)
4. 💡 Kısa ve pratik 1-2 öneri
5. Motive edici kapanış cümlesi

NOT: Kısa ve öz tut (maksimum 150 kelime). Emoji kullan. Samimi ol ama saygılı.
`;
  } else if (type === 'weekly') {
    return `
Sen bir İslami ibadet danışmanısın. Kullanıcının haftalık namaz verilerini analiz edip Türkçe, detaylı ama okunabilir bir rapor hazırla.

📅 HAFTA: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} haftası

📊 HAFTALIK VERİLER:
- Toplam Gün: ${data.totalDays}
- Toplam Farz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Çok Kaçırılan: ${data.mostMissedPrayer} (${data.mostMissedCount} gün)
- En Az Kaçırılan: ${data.leastMissedPrayer} (${data.leastMissedCount} gün)
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR (7 gün içinde):
- Teheccüd: ${data.teheccudCount} gün
- Duha: ${data.duhaCount} gün
- Evvabin: ${data.evvabinCount} gün
- Tesbih Namazı: ${data.tespihCount} gün
- Kaza Namazı: ${data.totalKaza} adet

RAPOR FORMATI:
1. Haftalık genel değerlendirme (2-3 cümle)
2. 📈 Güçlü Yönler (en az 2 madde)
3. 📉 Gelişim Alanları (en az 2 madde)
4. 💡 Önümüzdeki Hafta İçin Hedefler (2-3 pratik öneri)
5. Motive edici kapanış

NOT: 200 kelimeyi geçme. Emoji kullan. Samimi ve cesaretlendirici ol.
`;
  } else {
    return `
Sen bir İslami ibadet danışmanısın. Kullanıcının aylık namaz verilerini analiz edip Türkçe, kapsamlı bir rapor hazırla.

📅 AY: ${turkishMonths[date.getMonth()]} ${date.getFullYear()}

📊 AYLIK VERİLER:
- Toplam Gün: ${data.totalDays}
- Farz Namaz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR (ay boyunca):
- Teheccüd: ${data.teheccudCount} gün
- Duha: ${data.duhaCount} gün
- Evvabin: ${data.evvabinCount} gün
- Tesbih Namazı: ${data.tespihCount} gün
- Toplam Kaza: ${data.totalKaza} adet

RAPOR FORMATI:
1. Aylık genel değerlendirme (3-4 cümle)
2. 🏆 Ayın Başarıları (en önemli 3 başarı)
3. 🎯 Gelişim Fırsatları (3 alan)
4. 📊 Karşılaştırmalı Analiz (güçlü/zayıf vakitler)
5. 🌟 Gelecek Ay İçin Öneriler (3 hedef)
6. İlham verici kapanış

NOT: 300 kelimeyi geçme. Emoji kullan. Profesyonel ama samimi ol.
`;
  }
}

