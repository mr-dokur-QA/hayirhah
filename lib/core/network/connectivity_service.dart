import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Connectivity status enum
enum ConnectionStatus {
  online,
  offline,
  unknown,
}

/// Service to monitor network connectivity
class ConnectivityService extends ChangeNotifier {
  static ConnectivityService? _instance;
  
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _subscription;
  
  ConnectionStatus _status = ConnectionStatus.unknown;
  ConnectivityResult _connectionType = ConnectivityResult.none;

  // Singleton pattern
  static ConnectivityService get instance {
    _instance ??= ConnectivityService._internal();
    return _instance!;
  }

  ConnectivityService._internal();

  factory ConnectivityService() => instance;

  /// Current connection status
  ConnectionStatus get status => _status;

  /// Whether the device is online
  bool get isOnline => _status == ConnectionStatus.online;

  /// Whether the device is offline
  bool get isOffline => _status == ConnectionStatus.offline;

  /// Current connection type (wifi, mobile, etc.)
  ConnectivityResult get connectionType => _connectionType;

  /// Initialize and start listening to connectivity changes
  Future<void> initialize() async {
    // Get initial status
    await _checkConnectivity();

    // Listen to changes
    _subscription = _connectivity.onConnectivityChanged.listen(_onConnectivityChanged);
  }

  /// Check current connectivity
  Future<void> _checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _updateStatus(result);
    } catch (e) {
      debugPrint('❌ Connectivity check failed: $e');
      _status = ConnectionStatus.unknown;
      notifyListeners();
    }
  }

  /// Handle connectivity changes
  void _onConnectivityChanged(ConnectivityResult result) {
    _updateStatus(result);
  }

  /// Update status based on connectivity result
  void _updateStatus(ConnectivityResult result) {
    _connectionType = result;
    
    final previousStatus = _status;
    
    if (result == ConnectivityResult.none) {
      _status = ConnectionStatus.offline;
    } else {
      _status = ConnectionStatus.online;
    }

    if (previousStatus != _status) {
      debugPrint('📶 Connectivity changed: $_status (${result.name})');
      notifyListeners();
    }
  }

  /// Get connection type as string
  String get connectionTypeString {
    switch (_connectionType) {
      case ConnectivityResult.wifi:
        return 'WiFi';
      case ConnectivityResult.mobile:
        return 'Mobil Veri';
      case ConnectivityResult.ethernet:
        return 'Ethernet';
      case ConnectivityResult.vpn:
        return 'VPN';
      case ConnectivityResult.bluetooth:
        return 'Bluetooth';
      case ConnectivityResult.other:
        return 'Diğer';
      case ConnectivityResult.none:
        return 'Çevrimdışı';
    }
  }

  /// Dispose subscription
  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

