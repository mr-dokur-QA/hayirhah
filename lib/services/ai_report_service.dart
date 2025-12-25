import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/prayer_tracking.dart';
import 'prayer_tracking_service.dart';

/// AI Report Service using Groq API (Llama 3.3 70B)
/// Generates personalized prayer tracking reports in Turkish
class AIReportService {
  static final AIReportService _instance = AIReportService._internal();
  factory AIReportService() => _instance;
  AIReportService._internal();

  final PrayerTrackingService _trackingService = PrayerTrackingService();
  
  // Groq API configuration
  static const String _groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  static const String _model = 'llama-3.3-70b-versatile';
  
  // API Key - should be stored securely in production
  String? _apiKey;
  
  /// Set API key
  void setApiKey(String key) {
    _apiKey = key;
  }

  /// Check if API key is configured
  bool get isConfigured => _apiKey != null && _apiKey!.isNotEmpty;

  /// Generate daily report
  Future<AIReport> generateDailyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    final dayRecord = _trackingService.getDayRecord(targetDate);
    
    if (dayRecord == null) {
      return AIReport(
        type: ReportType.daily,
        date: targetDate,
        content: 'Bu gün için namaz kaydı bulunamadı.',
        isError: true,
      );
    }

    final analysisData = _analyzeDailyData(dayRecord);
    final prompt = _buildDailyPrompt(analysisData, targetDate);
    
    return _callGroqAPI(prompt, ReportType.daily, targetDate);
  }

  /// Generate weekly report
  Future<AIReport> generateWeeklyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    final stats = _trackingService.getWeeklyStats(targetDate);
    final lastSevenDays = _trackingService.getLastSevenDaysStats();
    
    final analysisData = _analyzeWeeklyData(stats, lastSevenDays);
    final prompt = _buildWeeklyPrompt(analysisData, targetDate);
    
    return _callGroqAPI(prompt, ReportType.weekly, targetDate);
  }

  /// Generate monthly report
  Future<AIReport> generateMonthlyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    final monthlyStats = _trackingService.getMonthlyStats(targetDate);
    
    final analysisData = _analyzeMonthlyData(monthlyStats);
    final prompt = _buildMonthlyPrompt(analysisData, targetDate);
    
    return _callGroqAPI(prompt, ReportType.monthly, targetDate);
  }

  /// Analyze daily prayer data
  Map<String, dynamic> _analyzeDailyData(DailyPrayerTracking dayRecord) {
    final fardPrayers = dayRecord.prayers.where((p) => p.type == PrayerType.fard).toList();
    
    // Farz namaz analizi
    final completedFard = fardPrayers.where((p) => p.isCompleted).length;
    final missedFard = fardPrayers.where((p) => !p.isCompleted).map((p) => p.prayerName).toList();
    
    // Sünnet analizi
    final completedSunnet = fardPrayers.where((p) => p.completedSunnet).length;
    final missedSunnet = fardPrayers.where((p) => p.isCompleted && !p.completedSunnet)
        .map((p) => p.prayerName).toList();
    
    // Tesbihat analizi
    final completedTesbihat = fardPrayers.where((p) => p.completedTesbihat).length;
    final missedTesbihat = fardPrayers.where((p) => p.isCompleted && !p.completedTesbihat)
        .map((p) => p.prayerName).toList();
    
    // Nafile namazlar
    final additionalPrayers = dayRecord.additionalPrayers;
    final nafilePrayers = <String>[];
    if (additionalPrayers.teheccud) nafilePrayers.add('Teheccüd');
    if (additionalPrayers.duha) nafilePrayers.add('Duha');
    if (additionalPrayers.evvabin) nafilePrayers.add('Evvabin');
    if (additionalPrayers.tespih) nafilePrayers.add('Tesbih Namazı');
    
    // Kaza namazları
    final kazaTotal = additionalPrayers.kazaPrayers.values.fold(0, (a, b) => a + b);
    
    return {
      'totalFard': 5,
      'completedFard': completedFard,
      'missedFard': missedFard,
      'completedSunnet': completedSunnet,
      'missedSunnet': missedSunnet,
      'completedTesbihat': completedTesbihat,
      'missedTesbihat': missedTesbihat,
      'nafilePrayers': nafilePrayers,
      'kazaTotal': kazaTotal,
      'kazaDetails': additionalPrayers.kazaPrayers,
      'fardCompletionRate': (completedFard / 5 * 100).toStringAsFixed(0),
      'sunnetRate': completedFard > 0 ? (completedSunnet / completedFard * 100).toStringAsFixed(0) : '0',
      'tesbihatRate': completedFard > 0 ? (completedTesbihat / completedFard * 100).toStringAsFixed(0) : '0',
    };
  }

  /// Analyze weekly prayer data
  Map<String, dynamic> _analyzeWeeklyData(WeeklyPrayerStats stats, Map<String, dynamic> lastSevenDays) {
    final records = stats.dailyRecords;
    
    // Her namaz için kaçırma sayısı
    final missedByPrayer = <String, int>{
      'Sabah': 0, 'Öğle': 0, 'İkindi': 0, 'Akşam': 0, 'Yatsı': 0
    };
    
    // Tesbihat ve sünnet istatistikleri
    int totalTesbihat = 0;
    int totalSunnet = 0;
    int totalCompleted = 0;
    
    // Nafile namazlar
    int teheccudCount = 0;
    int duhaCount = 0;
    int evvabinCount = 0;
    int tespihCount = 0;
    int totalKaza = 0;
    
    for (final day in records) {
      for (final prayer in day.prayers.where((p) => p.type == PrayerType.fard)) {
        if (!prayer.isCompleted) {
          missedByPrayer[prayer.prayerName] = (missedByPrayer[prayer.prayerName] ?? 0) + 1;
        } else {
          totalCompleted++;
          if (prayer.completedSunnet) totalSunnet++;
          if (prayer.completedTesbihat) totalTesbihat++;
        }
      }
      
      if (day.additionalPrayers.teheccud) teheccudCount++;
      if (day.additionalPrayers.duha) duhaCount++;
      if (day.additionalPrayers.evvabin) evvabinCount++;
      if (day.additionalPrayers.tespih) tespihCount++;
      totalKaza += day.additionalPrayers.kazaPrayers.values.fold(0, (a, b) => a + b);
    }
    
    // En çok kaçırılan namaz
    final mostMissed = missedByPrayer.entries
        .reduce((a, b) => a.value > b.value ? a : b);
    
    // En az kaçırılan namaz
    final leastMissed = missedByPrayer.entries
        .reduce((a, b) => a.value < b.value ? a : b);

    return {
      'totalDays': records.length,
      'totalFard': stats.totalFardCount,
      'completedFard': stats.completedFardCount,
      'fardCompletionRate': (stats.weeklyFardCompletionRate * 100).toStringAsFixed(0),
      'mostMissedPrayer': mostMissed.key,
      'mostMissedCount': mostMissed.value,
      'leastMissedPrayer': leastMissed.key,
      'leastMissedCount': leastMissed.value,
      'missedByPrayer': missedByPrayer,
      'totalSunnet': totalSunnet,
      'totalTesbihat': totalTesbihat,
      'sunnetRate': totalCompleted > 0 ? (totalSunnet / totalCompleted * 100).toStringAsFixed(0) : '0',
      'tesbihatRate': totalCompleted > 0 ? (totalTesbihat / totalCompleted * 100).toStringAsFixed(0) : '0',
      'teheccudCount': teheccudCount,
      'duhaCount': duhaCount,
      'evvabinCount': evvabinCount,
      'tespihCount': tespihCount,
      'totalKaza': totalKaza,
      'bestDay': stats.bestDay?.date,
      'worstDay': stats.worstDay?.date,
    };
  }

  /// Analyze monthly prayer data
  Map<String, dynamic> _analyzeMonthlyData(Map<String, dynamic> monthlyStats) {
    final records = monthlyStats['records'] as List<DailyPrayerTracking>;
    
    // Haftalık trend analizi
    final weeklyTrends = <double>[];
    for (int i = 0; i < records.length; i += 7) {
      final weekRecords = records.skip(i).take(7).toList();
      if (weekRecords.isNotEmpty) {
        final weekCompleted = weekRecords.fold(0, (sum, day) => sum + day.completedFardCount);
        final weekTotal = weekRecords.fold(0, (sum, day) => sum + day.fardPrayerCount);
        weeklyTrends.add(weekTotal > 0 ? weekCompleted / weekTotal : 0);
      }
    }
    
    // Trend yönü
    String trend = 'stabil';
    if (weeklyTrends.length >= 2) {
      final firstHalf = weeklyTrends.take(weeklyTrends.length ~/ 2).fold(0.0, (a, b) => a + b);
      final secondHalf = weeklyTrends.skip(weeklyTrends.length ~/ 2).fold(0.0, (a, b) => a + b);
      if (secondHalf > firstHalf * 1.1) trend = 'yükseliş';
      else if (secondHalf < firstHalf * 0.9) trend = 'düşüş';
    }
    
    // Toplam nafile namazlar
    int totalTeheccud = 0;
    int totalDuha = 0;
    int totalEvvabin = 0;
    int totalTespih = 0;
    int totalKaza = 0;
    int totalSunnet = 0;
    int totalTesbihat = 0;
    
    for (final day in records) {
      if (day.additionalPrayers.teheccud) totalTeheccud++;
      if (day.additionalPrayers.duha) totalDuha++;
      if (day.additionalPrayers.evvabin) totalEvvabin++;
      if (day.additionalPrayers.tespih) totalTespih++;
      totalKaza += day.additionalPrayers.kazaPrayers.values.fold(0, (a, b) => a + b);
      
      for (final prayer in day.prayers.where((p) => p.type == PrayerType.fard && p.isCompleted)) {
        if (prayer.completedSunnet) totalSunnet++;
        if (prayer.completedTesbihat) totalTesbihat++;
      }
    }

    return {
      'month': monthlyStats['month'],
      'year': monthlyStats['year'],
      'totalDays': records.length,
      'totalFard': monthlyStats['totalFard'],
      'completedFard': monthlyStats['completedFard'],
      'fardCompletionRate': ((monthlyStats['fardCompletionRate'] as double) * 100).toStringAsFixed(0),
      'trend': trend,
      'weeklyTrends': weeklyTrends,
      'totalTeheccud': totalTeheccud,
      'totalDuha': totalDuha,
      'totalEvvabin': totalEvvabin,
      'totalTespih': totalTespih,
      'totalKaza': totalKaza,
      'totalSunnet': totalSunnet,
      'totalTesbihat': totalTesbihat,
      'sunnetRate': monthlyStats['completedFard'] > 0 
          ? (totalSunnet / monthlyStats['completedFard'] * 100).toStringAsFixed(0) : '0',
      'tesbihatRate': monthlyStats['completedFard'] > 0 
          ? (totalTesbihat / monthlyStats['completedFard'] * 100).toStringAsFixed(0) : '0',
    };
  }

  /// Build daily prompt
  String _buildDailyPrompt(Map<String, dynamic> data, DateTime date) {
    final dayName = _getTurkishDayName(date.weekday);
    
    return '''
Sen bir İslami ibadet danışmanısın. Kullanıcının günlük namaz verilerini analiz edip Türkçe, samimi ve motive edici bir rapor hazırla.

📅 TARİH: $dayName, ${date.day}/${date.month}/${date.year}

📊 GÜNLÜK VERİLER:
- Farz Namaz: ${data['completedFard']}/5 kılındı (%${data['fardCompletionRate']})
- Kaçırılan Namazlar: ${(data['missedFard'] as List).isEmpty ? 'Yok - Maşallah!' : (data['missedFard'] as List).join(', ')}
- Sünnet Namazlar: ${data['completedSunnet']}/5 (%${data['sunnetRate']})
- Tesbihat: ${data['completedTesbihat']}/5 (%${data['tesbihatRate']})
- Kılınan Nafile Namazlar: ${(data['nafilePrayers'] as List).isEmpty ? 'Yok' : (data['nafilePrayers'] as List).join(', ')}
- Kılınan Kaza Namazı: ${data['kazaTotal']} adet

RAPOR FORMATI:
1. Kısa bir selamlama ve genel değerlendirme (1-2 cümle)
2. ✅ Başarılar (varsa)
3. ⚠️ Dikkat Edilmesi Gerekenler (varsa)
4. 💡 Kısa ve pratik 1-2 öneri
5. Motive edici kapanış cümlesi

NOT: Kısa ve öz tut (maksimum 150 kelime). Emoji kullan. Samimi ol ama saygılı. Dini nasihat değil, pratik öneriler ver.
''';
  }

  /// Build weekly prompt
  String _buildWeeklyPrompt(Map<String, dynamic> data, DateTime date) {
    return '''
Sen bir İslami ibadet danışmanısın. Kullanıcının haftalık namaz verilerini analiz edip Türkçe, detaylı ama okunabilir bir rapor hazırla.

📅 HAFTA: ${date.day}/${date.month}/${date.year} haftası

📊 HAFTALIK VERİLER:
- Toplam Farz: ${data['completedFard']}/${data['totalFard']} (%${data['fardCompletionRate']})
- En Çok Kaçırılan: ${data['mostMissedPrayer']} (${data['mostMissedCount']} gün)
- En Az Kaçırılan: ${data['leastMissedPrayer']} (${data['leastMissedCount']} gün)
- Sünnet Oranı: %${data['sunnetRate']}
- Tesbihat Oranı: %${data['tesbihatRate']}

NAFİLE NAMAZLAR (7 gün içinde):
- Teheccüd: ${data['teheccudCount']} gün
- Duha: ${data['duhaCount']} gün
- Evvabin: ${data['evvabinCount']} gün
- Tesbih Namazı: ${data['tespihCount']} gün
- Kaza Namazı: ${data['totalKaza']} adet

RAPOR FORMATI:
1. Haftalık genel değerlendirme (2-3 cümle)
2. 📈 Güçlü Yönler (en az 2 madde)
3. 📉 Gelişim Alanları (en az 2 madde)
4. 💡 Önümüzdeki Hafta İçin Hedefler (2-3 pratik öneri)
5. Motive edici kapanış

NOT: 200 kelimeyi geçme. Emoji kullan. Samimi ve cesaretlendirici ol.
''';
  }

  /// Build monthly prompt
  String _buildMonthlyPrompt(Map<String, dynamic> data, DateTime date) {
    final monthName = _getTurkishMonthName(data['month'] as int);
    
    return '''
Sen bir İslami ibadet danışmanısın. Kullanıcının aylık namaz verilerini analiz edip Türkçe, kapsamlı bir rapor hazırla.

📅 AY: $monthName ${data['year']}

📊 AYLIK VERİLER:
- Toplam Gün: ${data['totalDays']}
- Farz Namaz: ${data['completedFard']}/${data['totalFard']} (%${data['fardCompletionRate']})
- Trend: ${data['trend']} (ay içinde performans değişimi)
- Sünnet Oranı: %${data['sunnetRate']}
- Tesbihat Oranı: %${data['tesbihatRate']}

NAFİLE NAMAZLAR (ay boyunca):
- Teheccüd: ${data['totalTeheccud']} gün
- Duha: ${data['totalDuha']} gün
- Evvabin: ${data['totalEvvabin']} gün
- Tesbih Namazı: ${data['totalTespih']} gün
- Toplam Kaza: ${data['totalKaza']} adet

RAPOR FORMATI:
1. Aylık genel değerlendirme ve trend analizi (3-4 cümle)
2. 🏆 Ayın Başarıları (en önemli 3 başarı)
3. 🎯 Gelişim Fırsatları (3 alan)
4. 📊 Karşılaştırmalı Analiz (güçlü/zayıf vakitler)
5. 🌟 Gelecek Ay İçin Öneriler (3 hedef)
6. İlham verici kapanış

NOT: 300 kelimeyi geçme. Emoji kullan. Profesyonel ama samimi ol.
''';
  }

  /// Call Groq API
  Future<AIReport> _callGroqAPI(String prompt, ReportType type, DateTime date) async {
    if (!isConfigured) {
      return AIReport(
        type: type,
        date: date,
        content: 'API anahtarı yapılandırılmamış. Ayarlardan Groq API anahtarınızı girin.',
        isError: true,
      );
    }

    try {
      final dio = Dio();
      final response = await dio.post(
        _groqApiUrl,
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {
          'model': _model,
          'messages': [
            {
              'role': 'system',
              'content': 'Sen yardımsever bir İslami ibadet danışmanısın. Türkçe konuşuyorsun ve samimi ama saygılı bir üslubun var.'
            },
            {
              'role': 'user',
              'content': prompt,
            }
          ],
          'temperature': 0.7,
          'max_tokens': 1024,
        },
      );

      if (response.statusCode == 200) {
        final content = response.data['choices'][0]['message']['content'] as String;
        return AIReport(
          type: type,
          date: date,
          content: content.trim(),
          generatedAt: DateTime.now(),
        );
      } else {
        throw Exception('API hatası: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('Groq API error: ${e.message}');
      String errorMessage = 'Rapor oluşturulurken bir hata oluştu.';
      
      if (e.response?.statusCode == 401) {
        errorMessage = 'Geçersiz API anahtarı. Lütfen kontrol edin.';
      } else if (e.response?.statusCode == 429) {
        errorMessage = 'Çok fazla istek. Lütfen biraz bekleyin.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'İnternet bağlantınızı kontrol edin.';
      }
      
      return AIReport(
        type: type,
        date: date,
        content: errorMessage,
        isError: true,
      );
    } catch (e) {
      debugPrint('AI Report error: $e');
      return AIReport(
        type: type,
        date: date,
        content: 'Beklenmeyen bir hata oluştu: $e',
        isError: true,
      );
    }
  }

  String _getTurkishDayName(int weekday) {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    return days[weekday - 1];
  }

  String _getTurkishMonthName(int month) {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return months[month - 1];
  }
}

/// AI Report model
class AIReport {
  final ReportType type;
  final DateTime date;
  final String content;
  final DateTime? generatedAt;
  final bool isError;

  AIReport({
    required this.type,
    required this.date,
    required this.content,
    this.generatedAt,
    this.isError = false,
  });

  String get typeDisplayName {
    switch (type) {
      case ReportType.daily:
        return 'Günlük Rapor';
      case ReportType.weekly:
        return 'Haftalık Rapor';
      case ReportType.monthly:
        return 'Aylık Rapor';
    }
  }
}

enum ReportType {
  daily,
  weekly,
  monthly,
}

