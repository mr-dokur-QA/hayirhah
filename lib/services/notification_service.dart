import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'api_service.dart';

/// Top-level background handler (required by firebase_messaging).
/// Keep this function outside any class.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // We intentionally do not show a local notification here to avoid duplicates.
  // If you want data-only pushes to show notifications even in background,
  // we can add local notification display here later.
  debugPrint('🔔 BG message: ${message.messageId} data=${message.data}');
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  StreamSubscription<String>? _tokenRefreshSub;

  /// Call once after Firebase.initializeApp().
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    // Android local notifications init
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS local notifications init
    const iosInit = DarwinInitializationSettings();

    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _local.initialize(initSettings);

    // Ask notification permissions (iOS + Android 13+ is handled by plugin runtime too)
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 Notification permission: ${settings.authorizationStatus}');

    // Ensure foreground notifications are presented on iOS
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Listen for foreground messages and show a local notification.
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Keep backend token registration up-to-date.
    _tokenRefreshSub = FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
      debugPrint('🔄 FCM token refreshed');
      await syncDeviceTokenToBackend(tokenOverride: newToken);
    });
  }

  /// Send current FCM token to backend (requires user to be logged in).
  /// Safe to call multiple times; backend upserts by (userId, token).
  Future<void> syncDeviceTokenToBackend({String? tokenOverride}) async {
    try {
      final token = tokenOverride ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;

      final platform = switch (defaultTargetPlatform) {
        TargetPlatform.android => 'android',
        TargetPlatform.iOS => 'ios',
        TargetPlatform.macOS => 'macos',
        TargetPlatform.windows => 'windows',
        TargetPlatform.linux => 'linux',
        TargetPlatform.fuchsia => 'fuchsia',
      };

      final ok = await ApiService().registerDeviceToken(token: token, platform: platform);
      if (!ok) {
        debugPrint('⚠️ Device token registration failed (maybe not logged in yet).');
      }
    } catch (e) {
      debugPrint('⚠️ Device token sync error (non-fatal): $e');
    }
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    final title = notification?.title ?? (message.data['title']?.toString() ?? 'Bildirim');
    final body = notification?.body ?? (message.data['body']?.toString() ?? '');

    // Android channel
    const androidDetails = AndroidNotificationDetails(
      'event_updates',
      'Etkinlik Bildirimleri',
      channelDescription: 'Etkinlik ve görev güncellemeleri',
      importance: Importance.high,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _local.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: message.data.isNotEmpty ? message.data.toString() : null,
    );
  }
}

import 'package:just_audio/just_audio.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  
  Future<void> initialize() async {
    // Audio player initialization - notifications will be implemented later
  }

  Future<void> requestPermissions() async {
    // Notification permissions will be implemented when notification system is added
  }

  Future<void> playAzanPreview(String azanId) async {
    try {
      await _audioPlayer.setAsset('assets/sounds/azan_$azanId.mp3');
      await _audioPlayer.play();
    } catch (e) {
      print('Error playing azan preview: $e');
    }
  }

  Future<void> stopAzanPreview() async {
    try {
      await _audioPlayer.stop();
    } catch (e) {
      print('Error stopping azan preview: $e');
    }
  }

  Future<void> cancelAllNotifications() async {
    // Will be implemented when notification system is added
  }

  Future<void> schedulePrayerTimeNotifications(Map<String, dynamic> prayerTimes) async {
    // Prayer time notifications will be implemented when notification system is added
    print('Prayer time notifications not yet implemented');
  }

} 