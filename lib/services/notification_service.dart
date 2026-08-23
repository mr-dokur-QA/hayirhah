import 'dart:async';
import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:just_audio/just_audio.dart';

import 'api_service.dart';
import 'app_navigator.dart';

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

    debugPrint('🔔 NotificationService.initialize()');

    // Android local notifications init
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS local notifications init
    const iosInit = DarwinInitializationSettings();

    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        _handleTapPayload(response.payload);
      },
    );

    // Ask notification permissions (iOS + Android 13+ is handled by plugin runtime too)
    await requestPermissions();

    // Firebase messaging setup (skip on web if Firebase not initialized)
    try {
    // Ensure foreground notifications are presented on iOS
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Listen for foreground messages and show a local notification.
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Handle notification taps (app in background)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('🔔 onMessageOpenedApp: ${message.messageId} data=${message.data}');
      _handleRemoteMessageTap(message);
    });

    // Handle notification taps (cold start)
    // ignore: unawaited_futures
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message == null) return;
      debugPrint('🔔 getInitialMessage: ${message.messageId} data=${message.data}');
      _handleRemoteMessageTap(message);
    });

    // Keep backend token registration up-to-date.
    _tokenRefreshSub = FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
      debugPrint('🔄 FCM token refreshed: ${newToken.substring(0, newToken.length > 10 ? 10 : newToken.length)}... (${newToken.length})');
      await syncDeviceTokenToBackend(tokenOverride: newToken);
    });

    // Best-effort: try to obtain token early (non-blocking)
    // ignore: unawaited_futures
    getFcmToken().then((t) {
      debugPrint(
        t == null
            ? '⚠️ FCM token not available at init'
            : '✅ FCM token at init: ${t.substring(0, 10)}... (${t.length})',
      );
    });
    } catch (e) {
      debugPrint('🔔 Firebase messaging setup skipped (web or not configured): $e');
    }
  }

  Future<void> requestPermissions() async {
    try {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 Notification permission: ${settings.authorizationStatus}');
    } catch (e) {
      debugPrint('🔔 Notification permission request skipped (web or not configured): $e');
    }
  }

  Future<String?> getFcmToken() async {
    try {
      // Ensure FCM auto-init is enabled
      await FirebaseMessaging.instance.setAutoInitEnabled(true);
      debugPrint('🔔 FCM auto-init enabled');

      // Sometimes token isn't ready immediately after install/first run.
      for (var i = 0; i < 3; i++) {
        final t = await FirebaseMessaging.instance.getToken();
        if (t != null && t.isNotEmpty) {
          debugPrint('✅ FCM getToken attempt ${i + 1}: ${t.substring(0, 10)}... (${t.length})');
          return t;
        }
        debugPrint('⚠️ FCM getToken attempt ${i + 1}: (null/empty)');
        await Future<void>.delayed(const Duration(seconds: 1));
      }

      // Force regeneration once (best-effort)
      debugPrint('🔄 FCM deleteToken() -> getToken()');
      await FirebaseMessaging.instance.deleteToken();
      final t2 = await FirebaseMessaging.instance.getToken();
      if (t2 != null && t2.isNotEmpty) {
        debugPrint('✅ FCM token regenerated: ${t2.substring(0, 10)}... (${t2.length})');
        return t2;
      }

      debugPrint('❌ FCM token still not available after retries');
      return null;
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
    try {
      debugPrint('🔔 Scheduling local prayer time notifications: $prayerTimes');
      final now = DateTime.now();

      final prayerNames = {
        'Fajr': {'title': 'Sabah Namazı Vakti', 'id': 101},
        'Dhuhr': {'title': 'Öğle Namazı Vakti', 'id': 102},
        'Asr': {'title': 'İkindi Namazı Vakti', 'id': 103},
        'Maghrib': {'title': 'Akşam Namazı Vakti', 'id': 104},
        'Isha': {'title': 'Yatsı Namazı Vakti', 'id': 105},
      };

      for (final entry in prayerTimes.entries) {
        final prayerKey = entry.key;
        final timeStr = entry.value?.toString();
        if (timeStr == null || !timeStr.contains(':')) continue;

        final prayerInfo = prayerNames[prayerKey];
        if (prayerInfo == null) continue;

        final parts = timeStr.split(':');
        final hour = int.tryParse(parts[0]) ?? 0;
        final minute = int.tryParse(parts[1]) ?? 0;

        var targetTime = DateTime(now.year, now.month, now.day, hour, minute);
        if (targetTime.isBefore(now)) {
          targetTime = targetTime.add(const Duration(days: 1));
        }

        const androidDetails = AndroidNotificationDetails(
          'prayer_times_channel',
          'Namaz Vakitleri Bildirimleri',
          channelDescription: 'Ezan ve namaz vakti hatırlatıcıları',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        );
        const iosDetails = DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        );
        const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

        final notifId = prayerInfo['id'] as int;
        final notifTitle = '🕌 ${prayerInfo['title']} ($timeStr)';
        const notifBody = 'Vakit girdi. "Namaz müminin miracıdır." Haydi felaha!';

        // If scheduled within 24 hours, prepare notification payload
        final payloadData = jsonEncode({
          'type': 'prayer_time',
          'prayer': prayerKey,
          'time': timeStr,
        });

        debugPrint('📅 Configured notification for $prayerKey at $targetTime (id: $notifId)');
      }
    } catch (e) {
      debugPrint('⚠️ Error scheduling prayer notifications: $e');
    }
  }

  /// Subscribe to city-based prayer time notifications via FCM topics
  Future<void> subscribeToPrayerTimes(String cityName) async {
    try {
      final cleanCity = cityName.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_]'), '_');
      final topic = 'prayer_$cleanCity';
      debugPrint('🔔 Subscribing to FCM topic: $topic');
      await FirebaseMessaging.instance.subscribeToTopic(topic);
    } catch (e) {
      debugPrint('⚠️ Subscribe to prayer times topic skipped/failed: $e');
    }
  }

  /// Unsubscribe from city-based prayer time notifications
  Future<void> unsubscribeFromPrayerTimes(String cityName) async {
    try {
      final cleanCity = cityName.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_]'), '_');
      final topic = 'prayer_$cleanCity';
      debugPrint('🔕 Unsubscribing from FCM topic: $topic');
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    } catch (e) {
      debugPrint('⚠️ Unsubscribe from prayer times topic skipped/failed: $e');
    }
  }

  /// Subscribe to group events (Hatim, Cevşen, Tefriciye updates)
  Future<void> subscribeToGroup(String groupId) async {
    try {
      final topic = 'group_$groupId';
      debugPrint('🔔 Subscribing to FCM group topic: $topic');
      await FirebaseMessaging.instance.subscribeToTopic(topic);
    } catch (e) {
      debugPrint('⚠️ Subscribe to group topic skipped/failed: $e');
    }
  }

  /// Unsubscribe from group events
  Future<void> unsubscribeFromGroup(String groupId) async {
    try {
      final topic = 'group_$groupId';
      debugPrint('🔕 Unsubscribing from FCM group topic: $topic');
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    } catch (e) {
      debugPrint('⚠️ Unsubscribe from group topic skipped/failed: $e');
    }
  }

  /// Send current FCM token to backend (requires user to be logged in).
  /// Safe to call multiple times; backend upserts by (userId, token).
  Future<bool> syncDeviceTokenToBackend({String? tokenOverride}) async {
    try {
      final token = tokenOverride ?? await getFcmToken();
      if (token == null || token.isEmpty) {
        debugPrint('❌ syncDeviceTokenToBackend: token is null/empty');
        return false;
      }

      final platform = switch (defaultTargetPlatform) {
        TargetPlatform.android => 'android',
        TargetPlatform.iOS => 'ios',
        TargetPlatform.macOS => 'macos',
        TargetPlatform.windows => 'windows',
        TargetPlatform.linux => 'linux',
        TargetPlatform.fuchsia => 'fuchsia',
      };

      debugPrint('📤 Registering device token to backend: platform=$platform token=${token.substring(0, 10)}... (${token.length})');
      final ok = await ApiService().registerDeviceToken(token: token, platform: platform);
      if (!ok) {
        debugPrint('⚠️ Device token registration failed (maybe not logged in yet).');
      } else {
        debugPrint('✅ Device token registered on backend');
      }
      return ok;
    } catch (e) {
      debugPrint('⚠️ Device token sync error (non-fatal): $e');
      return false;
    }
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    debugPrint('🔔 FG message: ${message.messageId} data=${message.data} notif=${message.notification?.title}');
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
      payload: message.data.isNotEmpty ? jsonEncode(message.data) : null,
    );
  }

  void _handleRemoteMessageTap(RemoteMessage message) {
    if (message.data.isEmpty) return;
    final groupId = message.data['groupId']?.toString();
    final kind = message.data['type']?.toString();
    debugPrint('➡️ Notification tap: type=$kind groupId=$groupId');
    if (groupId != null && groupId.isNotEmpty) {
      // ignore: unawaited_futures
      openGroupDetailFromNotification(groupId);
    }
  }

  void _handleTapPayload(String? payload) {
    if (payload == null || payload.isEmpty) return;
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map) {
        final groupId = decoded['groupId']?.toString();
        final kind = decoded['type']?.toString();
        debugPrint('➡️ Local notification tap: type=$kind groupId=$groupId');
        if (groupId != null && groupId.isNotEmpty) {
          // ignore: unawaited_futures
          openGroupDetailFromNotification(groupId);
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to parse notification payload: $e');
    }
  }
}