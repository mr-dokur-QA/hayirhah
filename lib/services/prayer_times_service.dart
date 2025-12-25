import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter/material.dart';
import 'notification_service.dart';
import 'storage_service.dart';
import '../models/notification_preferences.dart';

class PrayerTime {
  final DateTime time;
  final String name;
  final String arabicName;

  const PrayerTime({
    required this.time,
    required this.name,
    required this.arabicName,
  });

  factory PrayerTime.fromJson(String name, String timeStr, String arabicName) {
    final now = DateTime.now();
    final timeParts = timeStr.split(':');
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);
    
    return PrayerTime(
      time: DateTime(now.year, now.month, now.day, hour, minute),
      name: name,
      arabicName: arabicName,
    );
  }

  bool get isPassed => DateTime.now().isAfter(time);
}

class PrayerTimesService extends ChangeNotifier {
  static final PrayerTimesService _instance = PrayerTimesService._internal();
  factory PrayerTimesService() => _instance;
  PrayerTimesService._internal();

  final NotificationService _notificationService = NotificationService();
  final StorageService _storageService = StorageService();
  
  List<PrayerTime> _prayerTimes = [];
  String _cityName = '';
  String _countryName = '';
  bool _isLoading = false;
  String? _error;
  NotificationPreferences _notificationPrefs = NotificationPreferences(enabled: true);
  
  // Cache tracking
  bool _isLoadedFromCache = false;

  List<PrayerTime> get prayerTimes => _prayerTimes;
  String get locationName => '$_cityName, $_countryName';
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoadedFromCache => _isLoadedFromCache;

  bool getNotificationStatus(String prayerName) {
    final key = _getPrayerKey(prayerName);
    return _notificationPrefs.prayerNotifications[key] ?? false;
  }

  void toggleNotification(String prayerName, bool value) {
    final key = _getPrayerKey(prayerName);
    final newPrefs = Map<String, bool>.from(_notificationPrefs.prayerNotifications);
    newPrefs[key] = value;
    _notificationPrefs = _notificationPrefs.copyWith(prayerNotifications: newPrefs);
    // Save to storage
    StorageService().saveNotificationPreferences(_notificationPrefs);
    notifyListeners();
  }

  String _getPrayerKey(String prayerName) {
    switch (prayerName) {
      case 'İmsak': return 'fajr';
      case 'Öğle': return 'dhuhr';
      case 'İkindi': return 'asr';
      case 'Akşam': return 'maghrib';
      case 'Yatsı': return 'isha';
      default: return '';
    }
  }

  PrayerTime? get nextPrayer {
    if (_prayerTimes.isEmpty) return null;
    
    final now = DateTime.now();
    try {
      return _prayerTimes.firstWhere(
        (prayer) => prayer.time.isAfter(now),
        orElse: () => _prayerTimes.first,
      );
    } catch (e) {
      return null;
    }
  }

  Future<void> loadPrayerTimes({bool forceRefresh = false}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // PERFORMANCE: Try to load from cache first (unless force refresh)
      if (!forceRefresh && await _tryLoadFromCache()) {
        _isLoadedFromCache = true;
        _isLoading = false;
        notifyListeners();
        return;
      }

      // Get current location (try cache first)
      Position? position;
      final cachedLocation = await _storageService.getCachedLocation();
      
      if (cachedLocation != null && !forceRefresh) {
        // Use cached location
        position = Position(
          latitude: cachedLocation['latitude']!,
          longitude: cachedLocation['longitude']!,
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          heading: 0,
          speed: 0,
          speedAccuracy: 0,
          altitudeAccuracy: 0,
          headingAccuracy: 0,
        );
      } else {
        // Get fresh location
        position = await _getCurrentLocation();
        if (position != null) {
          // Cache the new location
          await _storageService.saveLocation(position.latitude, position.longitude);
        }
      }

      if (position == null) {
        _error = 'Konum alınamadı. Lütfen konum izni verin.';
        return;
      }

      // Get location name
      await _getLocationName(position);

      // Fetch prayer times with retry logic
      final response = await _fetchPrayerTimesWithRetry(position);
      
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        final timings = data['data']['timings'];

        _prayerTimes = [
          PrayerTime.fromJson('İmsak', timings['Fajr'], ''),
          PrayerTime.fromJson('Güneş', timings['Sunrise'], ''),
          PrayerTime.fromJson('Öğle', timings['Dhuhr'], ''),
          PrayerTime.fromJson('İkindi', timings['Asr'], ''),
          PrayerTime.fromJson('Akşam', timings['Maghrib'], ''),
          PrayerTime.fromJson('Yatsı', timings['Isha'], ''),
        ];

        // PERFORMANCE: Save to cache for next time
        await _storageService.savePrayerTimes({
          'timings': timings,
          'locationName': '$_cityName, $_countryName',
        });
        _isLoadedFromCache = false;

        // Schedule notifications
        final prayerTimesMap = {
          'Fajr': timings['Fajr'],
          'Dhuhr': timings['Dhuhr'],
          'Asr': timings['Asr'],
          'Maghrib': timings['Maghrib'],
          'Isha': timings['Isha'],
        };
        await _notificationService.schedulePrayerTimeNotifications(prayerTimesMap);

        _error = null;
      } else {
        // PERFORMANCE: Try to use stale cache as fallback
        if (await _tryLoadFromCache(ignoreExpiry: true)) {
          _error = null; // Clear error since we have data
        } else {
          _error = 'Namaz vakitleri alınamadı. İnternet bağlantınızı kontrol edin.';
        }
      }
    } catch (e) {
      _error = 'Bir hata oluştu: $e';
      // Try stale cache as last resort
      await _tryLoadFromCache(ignoreExpiry: true);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Try to load prayer times from cache
  /// Returns true if successfully loaded from cache
  Future<bool> _tryLoadFromCache({bool ignoreExpiry = false}) async {
    try {
      final isCacheValid = await _storageService.isPrayerTimesCacheValid();
      
      if (!isCacheValid && !ignoreExpiry) {
        return false;
      }

      final cachedData = await _storageService.getPrayerTimes();
      if (cachedData == null) {
        return false;
      }

      final timings = cachedData['timings'];
      if (timings == null) {
        return false;
      }

      _prayerTimes = [
        PrayerTime.fromJson('İmsak', timings['Fajr'], ''),
        PrayerTime.fromJson('Güneş', timings['Sunrise'], ''),
        PrayerTime.fromJson('Öğle', timings['Dhuhr'], ''),
        PrayerTime.fromJson('İkindi', timings['Asr'], ''),
        PrayerTime.fromJson('Akşam', timings['Maghrib'], ''),
        PrayerTime.fromJson('Yatsı', timings['Isha'], ''),
      ];

      // Restore location name from cache
      final locationName = cachedData['locationName'] as String?;
      if (locationName != null && locationName.contains(',')) {
        final parts = locationName.split(',');
        _cityName = parts[0].trim();
        _countryName = parts.length > 1 ? parts[1].trim() : '';
      }

      return true;
    } catch (e) {
      print('Error loading from cache: $e');
      return false;
    }
  }

  // Test method for prayer times without location
  Future<void> loadPrayerTimesForLocation(double latitude, double longitude) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final position = Position(
        latitude: latitude,
        longitude: longitude,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );

      // Get location name
      await _getLocationName(position);

      // Fetch prayer times with retry logic
      final response = await _fetchPrayerTimesWithRetry(position);
      
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        final timings = data['data']['timings'];

        _prayerTimes = [
          PrayerTime.fromJson('İmsak', timings['Fajr'], ''),
          PrayerTime.fromJson('Güneş', timings['Sunrise'], ''),
          PrayerTime.fromJson('Öğle', timings['Dhuhr'], ''),
          PrayerTime.fromJson('İkindi', timings['Asr'], ''),
          PrayerTime.fromJson('Akşam', timings['Maghrib'], ''),
          PrayerTime.fromJson('Yatsı', timings['Isha'], ''),
        ];

        _error = null;
      } else {
        _error = 'Namaz vakitleri alınamadı. İnternet bağlantınızı kontrol edin.';
      }
    } catch (e) {
      _error = 'Bir hata oluştu: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<http.Response?> _fetchPrayerTimesWithRetry(Position position) async {
    int retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        final response = await http.get(
          Uri.parse(
            'https://api.aladhan.com/v1/timings/'
            '${DateTime.now().millisecondsSinceEpoch ~/ 1000}'
            '?latitude=${position.latitude}'
            '&longitude=${position.longitude}'
            '&method=13' // Turkish Diyanet method
          ),
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DuaKardeslik/1.0',
          },
        ).timeout(const Duration(seconds: 10));
        
        if (response.statusCode == 200) {
          return response;
        }
      } catch (e) {
        print('Prayer times fetch attempt ${retryCount + 1} failed: $e');
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        await Future.delayed(Duration(seconds: retryCount * 2));
      }
    }
    
    return null;
  }

  Future<Position?> _getCurrentLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        print('Location services are disabled');
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          print('Location permissions are denied');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        print('Location permissions are permanently denied');
        return null;
      }

      // Get current position with timeout
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  Future<void> _getLocationName(Position position) async {
    try {
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        _cityName = place.locality ?? place.subAdministrativeArea ?? place.administrativeArea ?? '';
        _countryName = place.country ?? '';
      }
    } catch (e) {
      _cityName = '';
      _countryName = '';
    }
  }
} 