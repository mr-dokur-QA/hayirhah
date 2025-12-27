import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:just_audio/just_audio.dart';

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
  NotificationService._internal();
  static final NotificationService instance = NotificationService._internal();
  factory NotificationService() => instance;

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  final AudioPlayer _audioPlayer = AudioPlayer();
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
    await requestPermissions();

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

  Future<void> requestPermissions() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 Notification permission: ${settings.authorizationStatus}');
  }

  Future<String?> getFcmToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (e) {
      debugPrint('⚠️ getToken error: $e');
      return null;
    }
  }

  // ---- Existing app API surface (used by settings/prayer services) ----

  Future<void> playAzanPreview(String azanId) async {
    try {
      await _audioPlayer.setAsset('assets/sounds/azan_$azanId.mp3');
      await _audioPlayer.play();
    } catch (e) {
      debugPrint('Error playing azan preview: $e');
    }
  }

  Future<void> stopAzanPreview() async {
    try {
      await _audioPlayer.stop();
    } catch (e) {
      debugPrint('Error stopping azan preview: $e');
    }
  }

  Future<void> cancelAllNotifications() async {
    await _local.cancelAll();
  }

  Future<void> schedulePrayerTimeNotifications(Map<String, dynamic> prayerTimes) async {
    // Not implemented yet (future feature).
    debugPrint('Prayer time notifications not yet implemented');
  }

  /// Send current FCM token to backend (requires user to be logged in).
  /// Safe to call multiple times; backend upserts by (userId, token).
  Future<bool> syncDeviceTokenToBackend({String? tokenOverride}) async {
    try {
      final token = tokenOverride ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return false;

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
      return ok;
    } catch (e) {
      debugPrint('⚠️ Device token sync error (non-fatal): $e');
      return false;
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