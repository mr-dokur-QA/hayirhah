import 'package:flutter/foundation.dart';
import '../models/prayer_tracking.dart';
import '../core/network/dio_client.dart';
import 'prayer_tracking_service.dart';
import 'storage_service.dart';

/// AI Report Service - connects to backend for AI-powered prayer reports
class AIReportService {
  static final AIReportService _instance = AIReportService._internal();
  factory AIReportService() => _instance;
  AIReportService._internal();

  final DioClient _client = DioClient();
  final PrayerTrackingService _trackingService = PrayerTrackingService();
  final StorageService _storageService = StorageService();

  /// Generate daily report via backend
  Future<AIReport> generateDailyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    return _generateReport('daily', targetDate);
  }

  /// Generate weekly report via backend
  Future<AIReport> generateWeeklyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    return _generateReport('weekly', targetDate);
  }

  /// Generate monthly report via backend
  Future<AIReport> generateMonthlyReport([DateTime? date]) async {
    final targetDate = date ?? DateTime.now();
    return _generateReport('monthly', targetDate);
  }

  /// Call backend AI report endpoint
  Future<AIReport> _generateReport(String type, DateTime date) async {
    try {
      // Ensure auth token is set
      final token = await _storageService.getAuthToken();
      if (token != null) {
        _client.setAuthToken(token);
      }

      // First sync local data to backend
      await _syncLocalDataToBackend(date, type);

      final response = await _client.post(
        '/ai-report/generate',
        data: {
          'type': type,
          'startDate': date.toIso8601String(),
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final reportData = response.data['report'];
        return AIReport(
          type: _getReportType(type),
          date: date,
          content: reportData['content'] ?? 'Rapor oluşturulamadı.',
          generatedAt: DateTime.tryParse(reportData['generatedAt'] ?? '') ?? DateTime.now(),
        );
      } else {
        throw Exception(response.data['error'] ?? 'Unknown error');
      }
    } catch (e) {
      debugPrint('AI Report error: $e');
      
      // If backend fails, try local fallback
      return _generateLocalFallback(type, date, e.toString());
    }
  }

  /// Sync local prayer data to backend before generating report
  Future<void> _syncLocalDataToBackend(DateTime date, String type) async {
    try {
      if (type == 'daily') {
        await _trackingService.saveDayRecordToApi(date);
      } else if (type == 'weekly') {
        // Sync last 7 days
        for (int i = 0; i < 7; i++) {
          final day = date.subtract(Duration(days: i));
          await _trackingService.saveDayRecordToApi(day);
        }
      } else {
        // Monthly - sync current month (last 30 days for simplicity)
        for (int i = 0; i < 30; i++) {
          final day = date.subtract(Duration(days: i));
          await _trackingService.saveDayRecordToApi(day);
        }
      }
    } catch (e) {
      debugPrint('Sync error (non-fatal): $e');
      // Continue even if sync fails - backend might have old data
    }
  }

  /// Generate local fallback report when backend is unavailable
  AIReport _generateLocalFallback(String type, DateTime date, String error) {
    String content;
    
    if (error.contains('401') || error.contains('Authentication')) {
      content = '🔐 Lütfen önce giriş yapın.\n\nAI raporları için oturum açmanız gerekmektedir.';
    } else if (error.contains('AI service not configured')) {
      content = '⚠️ AI servisi henüz yapılandırılmamış.\n\nLütfen daha sonra tekrar deneyin.';
    } else if (error.contains('Connection') || error.contains('timeout')) {
      // Generate basic local stats
      content = _generateBasicLocalReport(type, date);
    } else {
      content = '❌ Rapor oluşturulurken bir hata oluştu.\n\nHata: $error\n\nLütfen daha sonra tekrar deneyin.';
    }
    
    return AIReport(
      type: _getReportType(type),
      date: date,
      content: content,
      isError: true,
    );
  }

  /// Generate basic local report (without AI)
  String _generateBasicLocalReport(String type, DateTime date) {
    if (type == 'daily') {
      final dayRecord = _trackingService.getDayRecord(date);
      if (dayRecord == null) {
        return '📊 Bugün için namaz kaydı bulunamadı.';
      }
      
      final fardCount = dayRecord.completedFardCount;
      final fardTotal = dayRecord.fardPrayerCount;
      final rate = fardTotal > 0 ? (fardCount / fardTotal * 100).toStringAsFixed(0) : '0';
      
      return '''
📊 Günlük Özet (${date.day}/${date.month}/${date.year})

✅ Farz Namaz: $fardCount/$fardTotal (%$rate)

⚠️ AI raporu şu an kullanılamıyor (internet bağlantısını kontrol edin).

Bu basit bir özettir. Detaylı AI analizi için bağlantınızı kontrol edip tekrar deneyin.
''';
    } else if (type == 'weekly') {
      final stats = _trackingService.getWeeklyStats(date);
      final rate = (stats.weeklyFardCompletionRate * 100).toStringAsFixed(0);
      
      return '''
📊 Haftalık Özet

✅ Farz Namaz: ${stats.completedFardCount}/${stats.totalFardCount} (%$rate)
📅 Toplam Gün: ${stats.dailyRecords.length}

⚠️ AI raporu şu an kullanılamıyor (internet bağlantısını kontrol edin).

Bu basit bir özettir. Detaylı AI analizi için bağlantınızı kontrol edip tekrar deneyin.
''';
    } else {
      final stats = _trackingService.getMonthlyStats(date);
      final rate = ((stats['fardCompletionRate'] as double) * 100).toStringAsFixed(0);
      
      return '''
📊 Aylık Özet (${date.month}/${date.year})

✅ Farz Namaz: ${stats['completedFard']}/${stats['totalFard']} (%$rate)

⚠️ AI raporu şu an kullanılamıyor (internet bağlantısını kontrol edin).

Bu basit bir özettir. Detaylı AI analizi için bağlantınızı kontrol edip tekrar deneyin.
''';
    }
  }

  ReportType _getReportType(String type) {
    switch (type) {
      case 'daily':
        return ReportType.daily;
      case 'weekly':
        return ReportType.weekly;
      case 'monthly':
        return ReportType.monthly;
      default:
        return ReportType.daily;
    }
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
