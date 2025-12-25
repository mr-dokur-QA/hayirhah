import 'package:geolocator/geolocator.dart';
import 'storage_service.dart';

/// Turkish cities with their coordinates for manual selection
class TurkishCity {
  final String name;
  final double latitude;
  final double longitude;

  const TurkishCity({
    required this.name,
    required this.latitude,
    required this.longitude,
  });

  Map<String, dynamic> toMap() => {
    'name': name,
    'latitude': latitude,
    'longitude': longitude,
  };

  factory TurkishCity.fromMap(Map<String, dynamic> map) => TurkishCity(
    name: map['name'] ?? '',
    latitude: map['latitude']?.toDouble() ?? 0.0,
    longitude: map['longitude']?.toDouble() ?? 0.0,
  );
}

/// PERFORMANCE: Location service for centralized location management
/// - Checks permissions at app startup
/// - Provides manual city selection as alternative to GPS
/// - Caches location for performance
class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final StorageService _storageService = StorageService();

  bool _isPermissionGranted = false;
  bool _isServiceEnabled = false;
  TurkishCity? _selectedCity;

  bool get isPermissionGranted => _isPermissionGranted;
  bool get isServiceEnabled => _isServiceEnabled;
  TurkishCity? get selectedCity => _selectedCity;
  bool get useManualLocation => _selectedCity != null;

  /// List of major Turkish cities with coordinates
  static const List<TurkishCity> turkishCities = [
    TurkishCity(name: 'Adana', latitude: 37.0000, longitude: 35.3213),
    TurkishCity(name: 'Adıyaman', latitude: 37.7648, longitude: 38.2786),
    TurkishCity(name: 'Afyon', latitude: 38.7507, longitude: 30.5567),
    TurkishCity(name: 'Ağrı', latitude: 39.7191, longitude: 43.0503),
    TurkishCity(name: 'Aksaray', latitude: 38.3687, longitude: 34.0370),
    TurkishCity(name: 'Amasya', latitude: 40.6499, longitude: 35.8353),
    TurkishCity(name: 'Ankara', latitude: 39.9334, longitude: 32.8597),
    TurkishCity(name: 'Antalya', latitude: 36.8969, longitude: 30.7133),
    TurkishCity(name: 'Artvin', latitude: 41.1828, longitude: 41.8183),
    TurkishCity(name: 'Aydın', latitude: 37.8560, longitude: 27.8416),
    TurkishCity(name: 'Balıkesir', latitude: 39.6484, longitude: 27.8826),
    TurkishCity(name: 'Bartın', latitude: 41.6344, longitude: 32.3375),
    TurkishCity(name: 'Batman', latitude: 37.8812, longitude: 41.1351),
    TurkishCity(name: 'Bayburt', latitude: 40.2552, longitude: 40.2249),
    TurkishCity(name: 'Bilecik', latitude: 40.0567, longitude: 30.0665),
    TurkishCity(name: 'Bingöl', latitude: 38.8854, longitude: 40.4966),
    TurkishCity(name: 'Bitlis', latitude: 38.4004, longitude: 42.1095),
    TurkishCity(name: 'Bolu', latitude: 40.7392, longitude: 31.6089),
    TurkishCity(name: 'Burdur', latitude: 37.7203, longitude: 30.2908),
    TurkishCity(name: 'Bursa', latitude: 40.1885, longitude: 29.0610),
    TurkishCity(name: 'Çanakkale', latitude: 40.1553, longitude: 26.4142),
    TurkishCity(name: 'Çankırı', latitude: 40.6013, longitude: 33.6134),
    TurkishCity(name: 'Çorum', latitude: 40.5506, longitude: 34.9556),
    TurkishCity(name: 'Denizli', latitude: 37.7765, longitude: 29.0864),
    TurkishCity(name: 'Diyarbakır', latitude: 37.9144, longitude: 40.2306),
    TurkishCity(name: 'Düzce', latitude: 40.8438, longitude: 31.1565),
    TurkishCity(name: 'Edirne', latitude: 41.6818, longitude: 26.5623),
    TurkishCity(name: 'Elazığ', latitude: 38.6810, longitude: 39.2264),
    TurkishCity(name: 'Erzincan', latitude: 39.7500, longitude: 39.5000),
    TurkishCity(name: 'Erzurum', latitude: 39.9000, longitude: 41.2700),
    TurkishCity(name: 'Eskişehir', latitude: 39.7667, longitude: 30.5256),
    TurkishCity(name: 'Gaziantep', latitude: 37.0662, longitude: 37.3833),
    TurkishCity(name: 'Giresun', latitude: 40.9128, longitude: 38.3895),
    TurkishCity(name: 'Gümüşhane', latitude: 40.4386, longitude: 39.5086),
    TurkishCity(name: 'Hakkari', latitude: 37.5833, longitude: 43.7333),
    TurkishCity(name: 'Hatay', latitude: 36.4018, longitude: 36.3498),
    TurkishCity(name: 'Iğdır', latitude: 39.9237, longitude: 44.0450),
    TurkishCity(name: 'Isparta', latitude: 37.7648, longitude: 30.5566),
    TurkishCity(name: 'İstanbul', latitude: 41.0082, longitude: 28.9784),
    TurkishCity(name: 'İzmir', latitude: 38.4237, longitude: 27.1428),
    TurkishCity(name: 'Kahramanmaraş', latitude: 37.5753, longitude: 36.9228),
    TurkishCity(name: 'Karabük', latitude: 41.2061, longitude: 32.6204),
    TurkishCity(name: 'Karaman', latitude: 37.1759, longitude: 33.2287),
    TurkishCity(name: 'Kars', latitude: 40.6167, longitude: 43.1000),
    TurkishCity(name: 'Kastamonu', latitude: 41.3887, longitude: 33.7827),
    TurkishCity(name: 'Kayseri', latitude: 38.7312, longitude: 35.4787),
    TurkishCity(name: 'Kırıkkale', latitude: 39.8468, longitude: 33.5153),
    TurkishCity(name: 'Kırklareli', latitude: 41.7333, longitude: 27.2167),
    TurkishCity(name: 'Kırşehir', latitude: 39.1425, longitude: 34.1709),
    TurkishCity(name: 'Kilis', latitude: 36.7184, longitude: 37.1212),
    TurkishCity(name: 'Kocaeli', latitude: 40.8533, longitude: 29.8815),
    TurkishCity(name: 'Konya', latitude: 37.8746, longitude: 32.4932),
    TurkishCity(name: 'Kütahya', latitude: 39.4167, longitude: 29.9833),
    TurkishCity(name: 'Malatya', latitude: 38.3552, longitude: 38.3095),
    TurkishCity(name: 'Manisa', latitude: 38.6191, longitude: 27.4289),
    TurkishCity(name: 'Mardin', latitude: 37.3212, longitude: 40.7245),
    TurkishCity(name: 'Mersin', latitude: 36.8121, longitude: 34.6415),
    TurkishCity(name: 'Muğla', latitude: 37.2153, longitude: 28.3636),
    TurkishCity(name: 'Muş', latitude: 38.9462, longitude: 41.7539),
    TurkishCity(name: 'Nevşehir', latitude: 38.6939, longitude: 34.6857),
    TurkishCity(name: 'Niğde', latitude: 37.9667, longitude: 34.6833),
    TurkishCity(name: 'Ordu', latitude: 40.9839, longitude: 37.8764),
    TurkishCity(name: 'Osmaniye', latitude: 37.0742, longitude: 36.2478),
    TurkishCity(name: 'Rize', latitude: 41.0201, longitude: 40.5234),
    TurkishCity(name: 'Sakarya', latitude: 40.6940, longitude: 30.4358),
    TurkishCity(name: 'Samsun', latitude: 41.2867, longitude: 36.3300),
    TurkishCity(name: 'Siirt', latitude: 37.9333, longitude: 41.9500),
    TurkishCity(name: 'Sinop', latitude: 42.0231, longitude: 35.1531),
    TurkishCity(name: 'Sivas', latitude: 39.7477, longitude: 37.0179),
    TurkishCity(name: 'Şanlıurfa', latitude: 37.1591, longitude: 38.7969),
    TurkishCity(name: 'Şırnak', latitude: 37.5164, longitude: 42.4611),
    TurkishCity(name: 'Tekirdağ', latitude: 40.9833, longitude: 27.5167),
    TurkishCity(name: 'Tokat', latitude: 40.3167, longitude: 36.5500),
    TurkishCity(name: 'Trabzon', latitude: 41.0015, longitude: 39.7178),
    TurkishCity(name: 'Tunceli', latitude: 39.1079, longitude: 39.5401),
    TurkishCity(name: 'Uşak', latitude: 38.6823, longitude: 29.4082),
    TurkishCity(name: 'Van', latitude: 38.4891, longitude: 43.4089),
    TurkishCity(name: 'Yalova', latitude: 40.6500, longitude: 29.2667),
    TurkishCity(name: 'Yozgat', latitude: 39.8181, longitude: 34.8147),
    TurkishCity(name: 'Zonguldak', latitude: 41.4564, longitude: 31.7987),
  ];

  /// PERFORMANCE: Check location permission at app startup
  /// This allows the app to prepare location state before user requests it
  Future<void> initialize() async {
    try {
      // Load saved manual city selection
      await _loadSelectedCity();

      // Check if location services are enabled
      _isServiceEnabled = await Geolocator.isLocationServiceEnabled();
      
      if (!_isServiceEnabled) {
        return;
      }

      // Check current permission status (don't request yet)
      final permission = await Geolocator.checkPermission();
      _isPermissionGranted = permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
    } catch (e) {
      print('LocationService initialization error: $e');
    }
  }

  /// Request location permission if not already granted
  Future<bool> requestPermission() async {
    try {
      if (_isPermissionGranted) return true;

      final permission = await Geolocator.requestPermission();
      _isPermissionGranted = permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
      
      return _isPermissionGranted;
    } catch (e) {
      print('Error requesting permission: $e');
      return false;
    }
  }

  /// Set a manual city selection (for users who don't want to share location)
  Future<void> setManualCity(TurkishCity? city) async {
    _selectedCity = city;
    await _storageService.saveManualCity(city);
  }

  /// Clear manual city selection
  Future<void> clearManualCity() async {
    _selectedCity = null;
    await _storageService.clearManualCity();
  }

  /// Load saved manual city from storage
  Future<void> _loadSelectedCity() async {
    _selectedCity = await _storageService.getManualCity();
  }

  /// Get coordinates - either from manual city or GPS
  Future<Position?> getLocation({bool preferGPS = false}) async {
    // If manual city is set and GPS is not preferred, use manual city
    if (_selectedCity != null && !preferGPS) {
      return Position(
        latitude: _selectedCity!.latitude,
        longitude: _selectedCity!.longitude,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );
    }

    // Try GPS
    if (!_isServiceEnabled) return null;
    if (!_isPermissionGranted) {
      final granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 5),
      );
    } catch (e) {
      print('Error getting GPS location: $e');
      return null;
    }
  }

  /// Get location name for display
  String getLocationName() {
    if (_selectedCity != null) {
      return '${_selectedCity!.name}, Türkiye';
    }
    return '';
  }
}

