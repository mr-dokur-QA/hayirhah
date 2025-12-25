import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/prayer_tracking.dart';
import 'storage_service.dart';
import 'api_service.dart';

class PrayerTrackingService extends ChangeNotifier {
  static final PrayerTrackingService _instance = PrayerTrackingService._internal();
  factory PrayerTrackingService() => _instance;
  PrayerTrackingService._internal();

  final StorageService _storageService = StorageService();
  final ApiService _apiService = ApiService();
  
  // In-memory cache
  final Map<String, DailyPrayerTracking> _dailyRecords = {};
  
  // Keys for SharedPreferences
  static const String _prayerTrackingKey = 'prayer_tracking_data';
  
  // Current user's prayer records
  List<DailyPrayerTracking> get userPrayerRecords {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return [];
    
    return _dailyRecords.values
        .where((record) => record.userId == currentUser.id)
        .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
  }

  // Get today's prayer record
  DailyPrayerTracking? getTodayRecord() {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return null;
    
    final today = DateTime.now();
    final todayKey = _getDayKey(currentUser.id, today);
    
    return _dailyRecords[todayKey] ?? _createDefaultDayRecord(currentUser.id, today);
  }

  // Get specific day's record
  DailyPrayerTracking? getDayRecord(DateTime date) {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return null;
    
    final dayKey = _getDayKey(currentUser.id, date);
    return _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
  }

  // Get records for a date range
  List<DailyPrayerTracking> getRecordsForRange(DateTime start, DateTime end) {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return [];
    
    final records = <DailyPrayerTracking>[];
    var current = DateTime(start.year, start.month, start.day);
    final endDate = DateTime(end.year, end.month, end.day);
    
    while (current.isBefore(endDate) || current.isAtSameMomentAs(endDate)) {
      final dayKey = _getDayKey(currentUser.id, current);
      final record = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, current);
      records.add(record);
      current = current.add(const Duration(days: 1));
    }
    
    return records;
  }

  // Get weekly statistics
  WeeklyPrayerStats getWeeklyStats([DateTime? date]) {
    final targetDate = date ?? DateTime.now();
    final weekStart = _getWeekStart(targetDate);
    final weekEnd = weekStart.add(const Duration(days: 6));
    
    final dailyRecords = getRecordsForRange(weekStart, weekEnd);
    
    return WeeklyPrayerStats(
      weekStart: weekStart,
      weekEnd: weekEnd,
      dailyRecords: dailyRecords,
    );
  }

  // Toggle prayer completion
  Future<void> togglePrayerCompletion(String prayerId, DateTime date) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;

    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);

    final prayerIndex = dayRecord.prayers.indexWhere((p) => p.id == prayerId);
    if (prayerIndex == -1) return;

    final prayer = dayRecord.prayers[prayerIndex];
    final updatedPrayer = prayer.copyWith(
      isCompleted: !prayer.isCompleted,
      completedAt: !prayer.isCompleted ? DateTime.now() : null,
    );

    final updatedPrayers = List<PrayerRecord>.from(dayRecord.prayers);
    updatedPrayers[prayerIndex] = updatedPrayer;

    final updatedDayRecord = dayRecord.copyWith(prayers: updatedPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;

    await _saveToStorage();

    // Try to sync with API
    try {
      final dateStr = date.toIso8601String().split('T')[0];
      final apiData = updatedDayRecord.toApiFormat();
      await _apiService.updateDailyPrayerRecord(dateStr, apiData);
    } catch (e) {
      print('Failed to sync prayer completion with API: $e');
    }

    notifyListeners();
  }

  // Toggle sünnet completion for a prayer
  Future<void> togglePrayerSunnet(String prayerId, DateTime date) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    final prayerIndex = dayRecord.prayers.indexWhere((p) => p.id == prayerId);
    if (prayerIndex == -1) return;
    
    final prayer = dayRecord.prayers[prayerIndex];
    final updatedPrayer = prayer.copyWith(
      completedSunnet: !prayer.completedSunnet,
    );
    
    final updatedPrayers = List<PrayerRecord>.from(dayRecord.prayers);
    updatedPrayers[prayerIndex] = updatedPrayer;
    
    final updatedDayRecord = dayRecord.copyWith(prayers: updatedPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Toggle tesbihat completion for a prayer
  Future<void> togglePrayerTesbihat(String prayerId, DateTime date) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    final prayerIndex = dayRecord.prayers.indexWhere((p) => p.id == prayerId);
    if (prayerIndex == -1) return;
    
    final prayer = dayRecord.prayers[prayerIndex];
    final updatedPrayer = prayer.copyWith(
      completedTesbihat: !prayer.completedTesbihat,
    );
    
    final updatedPrayers = List<PrayerRecord>.from(dayRecord.prayers);
    updatedPrayers[prayerIndex] = updatedPrayer;
    
    final updatedDayRecord = dayRecord.copyWith(prayers: updatedPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Update additional prayers tracking
  Future<void> updateAdditionalPrayers(DateTime date, AdditionalPrayersTracking additionalPrayers) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    final updatedDayRecord = dayRecord.copyWith(additionalPrayers: additionalPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Update specific additional prayer status
  Future<void> toggleAdditionalPrayer(DateTime date, String prayerType, bool value) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    AdditionalPrayersTracking updatedAdditional;
    switch (prayerType) {
      case 'teheccud':
        updatedAdditional = dayRecord.additionalPrayers.copyWith(teheccud: value);
        break;
      case 'duha':
        updatedAdditional = dayRecord.additionalPrayers.copyWith(duha: value);
        break;
      case 'evvabin':
        updatedAdditional = dayRecord.additionalPrayers.copyWith(evvabin: value);
        break;
      case 'tespih':
        updatedAdditional = dayRecord.additionalPrayers.copyWith(tespih: value);
        break;
      default:
        return;
    }
    
    final updatedDayRecord = dayRecord.copyWith(additionalPrayers: updatedAdditional);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Update kaza prayer count
  Future<void> updateKazaPrayer(DateTime date, String prayerName, int count) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    final newKazaPrayers = Map<String, int>.from(dayRecord.additionalPrayers.kazaPrayers);
    newKazaPrayers[prayerName] = count;
    
    final updatedAdditional = dayRecord.additionalPrayers.copyWith(kazaPrayers: newKazaPrayers);
    final updatedDayRecord = dayRecord.copyWith(additionalPrayers: updatedAdditional);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Add custom prayer (sunnah, nafile, etc.)
  Future<void> addCustomPrayer({
    required DateTime date,
    required String prayerName,
    required PrayerType type,
  }) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey] ?? _createDefaultDayRecord(currentUser.id, date);
    
    final dateStr = date.toIso8601String().split('T')[0];
    final prayerId = '${prayerName.toLowerCase()}_${type.name}_${dateStr}_${DateTime.now().millisecondsSinceEpoch}';
    
    final newPrayer = PrayerRecord(
      id: prayerId,
      prayerName: prayerName,
      type: type,
      isAdded: true,
    );
    
    final updatedPrayers = List<PrayerRecord>.from(dayRecord.prayers)..add(newPrayer);
    final updatedDayRecord = dayRecord.copyWith(prayers: updatedPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Remove custom prayer
  Future<void> removeCustomPrayer(String prayerId, DateTime date) async {
    final currentUser = _storageService.currentUser;
    if (currentUser == null) return;
    
    final dayKey = _getDayKey(currentUser.id, date);
    var dayRecord = _dailyRecords[dayKey];
    if (dayRecord == null) return;
    
    final updatedPrayers = dayRecord.prayers.where((p) => p.id != prayerId).toList();
    final updatedDayRecord = dayRecord.copyWith(prayers: updatedPrayers);
    _dailyRecords[dayKey] = updatedDayRecord;
    
    await _saveToStorage();
    notifyListeners();
  }

  // Load data from storage - PERFORMANCE: Uses cached SharedPreferences
  Future<void> loadFromStorage() async {
    try {
      // Ensure StorageService is initialized first
      await StorageService.initialize();
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_prayerTrackingKey);
      
      if (jsonString != null) {
        final Map<String, dynamic> data = jsonDecode(jsonString);
        _dailyRecords.clear();
        
        data.forEach((key, value) {
          _dailyRecords[key] = DailyPrayerTracking.fromMap(value);
        });
      }
    } catch (e) {
      print('Error loading prayer tracking data: $e');
    }
  }

  // Save data to storage - PERFORMANCE: Uses cached SharedPreferences
  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = <String, dynamic>{};
      
      _dailyRecords.forEach((key, value) {
        data[key] = value.toMap();
      });
      
      await prefs.setString(_prayerTrackingKey, jsonEncode(data));
    } catch (e) {
      print('Error saving prayer tracking data: $e');
    }
  }

  // Helper methods
  String _getDayKey(String userId, DateTime date) {
    final dateStr = date.toIso8601String().split('T')[0];
    return '${userId}_$dateStr';
  }

  DailyPrayerTracking _createDefaultDayRecord(String userId, DateTime date) {
    final record = DailyPrayerTracking.createDefault(userId: userId, date: date);
    final dayKey = _getDayKey(userId, date);
    _dailyRecords[dayKey] = record;
    return record;
  }

  DateTime _getWeekStart(DateTime date) {
    final weekday = date.weekday;
    final daysToSubtract = weekday == 7 ? 0 : weekday; // Monday = 1, Sunday = 7
    return DateTime(date.year, date.month, date.day).subtract(Duration(days: daysToSubtract));
  }

  // Get last 7 days statistics
  Map<String, dynamic> getLastSevenDaysStats() {
    final today = DateTime.now();
    final sevenDaysAgo = today.subtract(const Duration(days: 6));
    final records = getRecordsForRange(sevenDaysAgo, today);
    
    final totalFard = records.fold(0, (sum, day) => sum + day.fardPrayerCount);
    final completedFard = records.fold(0, (sum, day) => sum + day.completedFardCount);
    final totalPrayers = records.fold(0, (sum, day) => sum + day.totalPrayerCount);
    final completedPrayers = records.fold(0, (sum, day) => sum + day.completedPrayerCount);
    
    return {
      'totalFard': totalFard,
      'completedFard': completedFard,
      'totalPrayers': totalPrayers,
      'completedPrayers': completedPrayers,
      'fardCompletionRate': totalFard > 0 ? completedFard / totalFard : 0.0,
      'overallCompletionRate': totalPrayers > 0 ? completedPrayers / totalPrayers : 0.0,
      'records': records,
    };
  }

  // Get monthly statistics
  Map<String, dynamic> getMonthlyStats([DateTime? date]) {
    final targetDate = date ?? DateTime.now();
    final monthStart = DateTime(targetDate.year, targetDate.month, 1);
    final monthEnd = DateTime(targetDate.year, targetDate.month + 1, 0);
    
    final records = getRecordsForRange(monthStart, monthEnd);
    
    final totalFard = records.fold(0, (sum, day) => sum + day.fardPrayerCount);
    final completedFard = records.fold(0, (sum, day) => sum + day.completedFardCount);
    final totalPrayers = records.fold(0, (sum, day) => sum + day.totalPrayerCount);
    final completedPrayers = records.fold(0, (sum, day) => sum + day.completedPrayerCount);
    
    return {
      'month': targetDate.month,
      'year': targetDate.year,
      'totalFard': totalFard,
      'completedFard': completedFard,
      'totalPrayers': totalPrayers,
      'completedPrayers': completedPrayers,
      'fardCompletionRate': totalFard > 0 ? completedFard / totalFard : 0.0,
      'overallCompletionRate': totalPrayers > 0 ? completedPrayers / totalPrayers : 0.0,
      'records': records,
    };
  }

  // Initialize service
  Future<void> initialize() async {
    await loadFromStorage();
  }
} 