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
            content: `Sen yardımsever bir İslami ibadet danışmanısın. Türkçe konuşuyorsun ve samimi ama saygılı bir üslubun var. 
            
ÖNEMLİ: Türkçe karakterleri doğru kullan (ö, ü, ş, ğ, ç, ı). Gerçekçi ol - eğer veri yoksa veya düşükse, olmayan başarıları uydurmayarak.`,
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
  let totalQuranPages = 0;
  let daysWithQuranReading = 0;

  const missedByPrayer: Record<string, number> = {
    sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0,
  };

  for (const record of records) {
    const fardPrayers = (record.fardPrayers as PrayerData['fardPrayers']) || {};
    const sunnahPrayers = (record.sunnahPrayers as PrayerData['sunnahPrayers']) || {};
    const kazaPrayers = (record.kazaPrayers as PrayerData['kazaPrayers']) || {};
    const quranReadingPages = record.quranReadingPages || 0;

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

    // Quran reading
    totalQuranPages += quranReadingPages;
    if (quranReadingPages > 0) {
      daysWithQuranReading++;
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
    totalQuranPages,
    daysWithQuranReading,
    averageQuranPagesPerDay: totalDays > 0 ? Math.round((totalQuranPages / totalDays) * 10) / 10 : 0,
    missedByPrayer,
  };
}

function buildPrompt(data: Record<string, any>, type: string, date: Date): string {
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const turkishMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // Veri durumunu analiz et
  const hasNoData = data.totalDays === 0;
  const hasVeryLittleData = data.totalDays > 0 && data.completedFard === 0;
  const hasLowCompletion = data.fardCompletionRate > 0 && data.fardCompletionRate < 20;
  const hasMediumCompletion = data.fardCompletionRate >= 20 && data.fardCompletionRate < 60;
  const hasGoodCompletion = data.fardCompletionRate >= 60;

  // Veri durumuna göre özel talimatlar
  let dataContextInstructions = '';
  
  if (hasNoData) {
    dataContextInstructions = `
⚠️ KRİTİK: Bu dönem için HİÇ VERİ YOK! Kullanıcı henüz kayıt yapmamış.
- "Azimli olduğunu görüyorum", "Çaban takdire şayan" gibi YANLIŞ ifadeler KULLANMA!
- Gerçekçi ol: veri yok demek başarı yok demek
- Nazikçe uygulamayı kullanmaya ve kayıt yapmaya davet et
- Başlangıç yapmanın öneminden bahset
- Umut verici ama DÜRÜST ol`;
  } else if (hasVeryLittleData) {
    dataContextInstructions = `
⚠️ DİKKAT: Kayıt var ama henüz HİÇ namaz işaretlenmemiş (0/${data.totalFard}).
- Olmayan başarıları uydurmayarak
- "Kayıt tutmaya başladın, bu önemli bir adım" gibi gerçekçi ifadeler kullan
- Küçük adımlarla başlamayı teşvik et
- Yargılama ama gerçekçi kal`;
  } else if (hasLowCompletion) {
    dataContextInstructions = `
📊 Düşük tamamlanma oranı (%${data.fardCompletionRate}).
- Mevcut çabayı takdir et ama abartmayarak
- Yargılama, cesaretlendir
- Küçük ve ulaşılabilir hedefler öner
- Gerçekçi iyileştirme önerileri ver`;
  } else if (hasMediumCompletion) {
    dataContextInstructions = `
📊 Orta düzey tamamlanma oranı (%${data.fardCompletionRate}).
- Gelişimi takdir et
- Güçlü yönleri vurgula
- Daha iyiye gidebileceğini nazikçe belirt`;
  } else if (hasGoodCompletion) {
    dataContextInstructions = `
📊 İyi bir tamamlanma oranı (%${data.fardCompletionRate}).
- Başarıyı içtenlikle kutla
- Sürdürülebilirlik için tavsiyeler ver
- Nafile namazlara teşvik et`;
  }

  const commonRules = `
ÖNEMLİ KURALLAR:
- Türkçe karakterleri DOĞRU kullan: ö, ü, ş, ğ, ç, ı (ASCII olmayan karakterler)
- Samimi, sıcak ve arkadaş gibi bir dil kullan
- ASLA yargılayıcı, eleştiren veya suçlayıcı olma
- Kullanıcıyı kötü hissettiren ifadeler YASAK
- Her zaman teşvik edici ve destekleyici ol
- Sadece bölüm başlıklarında emoji kullan
- Raporun sonunda MUTLAKA kullanıcıya dua et

${dataContextInstructions}
`;

  if (type === 'daily') {
    if (hasNoData) {
      return `
Sen Hayırhah uygulamasının samimi asistanısın.

${commonRules}

TARİH: ${turkishDays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}

DURUM: Bugün için HİÇ namaz kaydı yok. Kullanıcı henüz veri girmemiş.

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra:

🌟 YENİ BAŞLANGIÇ
- Henüz bugün için kayıt olmadığını nazikçe belirt
- Uygulamayı kullanmaya teşvik et
- Kayıt yapmanın neden faydalı olduğunu kısaca anlat

🤲 DUA
- İçten bir dua ile kapanış

NOT: Maksimum 100 kelime. Sıcak ve davetkar ol. Olmayan başarıları uydurmayarak - veri yok!
`;
    }

    return `
Sen Hayırhah uygulamasının samimi ve destekleyici asistanısın.

${commonRules}

TARİH: ${turkishDays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}

GÜNLÜK VERİLER:
- Farz Namaz: ${data.completedFard}/5 (%${Math.round((data.completedFard / 5) * 100)})
- Sünnet: ${data.completedSunnet}/5
- Tesbihat: ${data.completedTesbihat}/5
- Kaza Namazı: ${data.totalKaza} adet
- Kur'an Okuma: ${data.totalQuranPages} sayfa
- Teheccüd: ${data.teheccudCount > 0 ? 'Evet' : 'Hayır'}
- Duha: ${data.duhaCount > 0 ? 'Evet' : 'Hayır'}

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra duruma göre:

${data.completedFard > 0 ? `
💪 GÜÇLÜ YÖNLERİN
- Bugünkü GERÇEK başarılarını vurgula (sadece veriye dayalı!)
${data.totalQuranPages > 0 ? `- Kur'an okuma alışkanlığını takdir et (${data.totalQuranPages} sayfa)` : ''}
` : `
🌱 YENİ BAŞLANGIÇ
- Kayıt var ama henüz namaz işaretlenmediğini nazikçe belirt
- Küçük adımlarla başlamayı teşvik et
`}

🌱 GELİŞTİRİLECEK YÖNLER
- Nazikçe ve teşvik edici önerilerde bulun
${data.totalQuranPages === 0 ? `- Kur'an okuma alışkanlığı kazanmanın öneminden bahset` : ''}

🤲 DUA
- İçten bir dua ile kapanış

NOT: Maksimum 150 kelime. Gerçekçi ol!
`;
  } else if (type === 'weekly') {
    if (hasNoData) {
      return `
Sen Hayırhah uygulamasının samimi asistanısın.

${commonRules}

HAFTA: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} haftası

DURUM: Bu hafta için HİÇ kayıt yok.

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra:

🌟 YENİ BİR HAFTA
- Henüz kayıt olmadığını nazikçe belirt
- Bu haftayı değerlendirmeye davet et
- Düzenli kayıt tutmanın faydalarını anlat

🎯 ÖNERİ
- Günde bir vakit ile başlamayı öner

🤲 DUA
- İçten bir dua

NOT: Maksimum 120 kelime. Yargılamadan cesaretlendir. Olmayan başarıları uydurmayarak!
`;
    }

    return `
Sen Hayırhah uygulamasının samimi ve destekleyici asistanısın.

${commonRules}

HAFTA: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} haftası

HAFTALIK VERİLER:
- Kayıtlı Gün: ${data.totalDays}
- Farz Namaz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Düzenli Vakit: ${data.leastMissedPrayer}
- En Zorlandığı Vakit: ${data.mostMissedPrayer}
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR:
- Teheccüd: ${data.teheccudCount} gün
- Duha: ${data.duhaCount} gün
- Evvabin: ${data.evvabinCount} gün
- Tesbih Namazı: ${data.tespihCount} gün
- Kaza: ${data.totalKaza} adet

KUR'AN OKUMA:
- Toplam Sayfa: ${data.totalQuranPages} sayfa
- Okuma Yapılan Gün: ${data.daysWithQuranReading} gün
- Günlük Ortalama: ${data.averageQuranPagesPerDay} sayfa

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra:

${data.completedFard > 0 ? `
💪 GÜÇLÜ YÖNLERİN
- Bu haftaki GERÇEK başarıları vurgula (veriye dayalı!)
${data.totalQuranPages > 0 ? `- Kur'an okuma alışkanlığını takdir et (${data.totalQuranPages} sayfa, ${data.daysWithQuranReading} gün)` : ''}
` : `
🌱 BAŞLANGIÇ NOKTASI
- Kayıt olduğunu ama henüz namaz işaretlenmediğini belirt
- Cesaretlendir ama gerçekçi kal
`}

🌱 GELİŞTİRİLECEK YÖNLER
- Nazikçe öneriler
${data.totalQuranPages === 0 ? `- Kur'an okuma alışkanlığı kazanmanın öneminden bahset` : data.averageQuranPagesPerDay < 1 ? `- Kur'an okuma sıklığını artırmayı teşvik et` : ''}

🤲 DUA
- İçten bir dua ile kapanış

NOT: Maksimum 180 kelime. Veriye dayalı konuş!
`;
  } else {
    // monthly
    if (hasNoData) {
      return `
Sen Hayırhah uygulamasının samimi asistanısın.

${commonRules}

AY: ${turkishMonths[date.getMonth()]} ${date.getFullYear()}

DURUM: Bu ay için HİÇ kayıt yok.

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra:

🌙 YENİ AY, YENİ FIRSATLAR
- Henüz kayıt olmadığını nazikçe belirt
- Bu ayı değerlendirmeye davet et
- Aylık hedef koymanın faydalarını anlat

🎯 ÖNERİ
- Küçük ve ulaşılabilir bir aylık hedef öner

🤲 DUA
- İçten bir dua

NOT: Maksimum 120 kelime. Motive edici ol ama gerçekçi kal. Olmayan başarıları uydurmayarak!
`;
    }

    return `
Sen Hayırhah uygulamasının samimi ve destekleyici asistanısın.

${commonRules}

AY: ${turkishMonths[date.getMonth()]} ${date.getFullYear()}

AYLIK VERİLER:
- Kayıtlı Gün: ${data.totalDays}
- Farz Namaz: ${data.completedFard}/${data.totalFard} (%${data.fardCompletionRate})
- En Düzenli Vakit: ${data.leastMissedPrayer}
- En Zorlandığı Vakit: ${data.mostMissedPrayer}
- Sünnet Oranı: %${data.sunnetRate}
- Tesbihat Oranı: %${data.tesbihatRate}

NAFİLE NAMAZLAR:
- Teheccüd: ${data.teheccudCount} gün
- Duha: ${data.duhaCount} gün
- Evvabin: ${data.evvabinCount} gün
- Tesbih Namazı: ${data.tespihCount} gün
- Toplam Kaza: ${data.totalKaza} adet

KUR'AN OKUMA:
- Toplam Sayfa: ${data.totalQuranPages} sayfa
- Okuma Yapılan Gün: ${data.daysWithQuranReading} gün
- Günlük Ortalama: ${data.averageQuranPagesPerDay} sayfa

RAPOR FORMATI:

Merhaba kardeşim! ile başla, sonra:

${data.completedFard > 0 ? `
💪 GÜÇLÜ YÖNLERİN
- Bu ayki GERÇEK başarıları vurgula (veriye dayalı!)
${data.totalQuranPages > 0 ? `- Kur'an okuma alışkanlığını takdir et (${data.totalQuranPages} sayfa, ${data.daysWithQuranReading} gün)` : ''}
` : `
🌱 YENİ BAŞLANGIÇ
- Kayıt olduğunu ama henüz namaz işaretlenmediğini belirt
- Cesaretlendir, yargılama
`}

🌱 GELİŞTİRİLECEK YÖNLER
- Nazikçe öneriler
${data.totalQuranPages === 0 ? `- Kur'an okuma alışkanlığı kazanmanın öneminden bahset` : data.averageQuranPagesPerDay < 1 ? `- Kur'an okuma sıklığını artırmayı teşvik et` : ''}

📈 GELECEK AY İÇİN HEDEFLER
- 1-2 küçük ve ulaşılabilir hedef öner
${data.totalQuranPages === 0 ? `- Kur'an okuma hedefi ekle (örn: günde 1 sayfa)` : ''}

🤲 DUA
- İçten bir dua ile kapanış

NOT: Maksimum 220 kelime. Gerçekçi ol!
`;
  }
}
