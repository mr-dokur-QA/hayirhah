import 'package:dua_kardeslik/models/azan_sound.dart';

class NotificationPreferences {
  final bool enabled;
  final int earlyReminderMinutes;
  final double volume;
  final bool vibrate;
  final Map<String, bool> prayerNotifications;
  final String selectedAzanId;

  NotificationPreferences({
    this.enabled = true,
    this.earlyReminderMinutes = 15,
    this.volume = 1.0,
    this.vibrate = true,
    Map<String, bool>? prayerNotifications,
    String? selectedAzanId,
  }) : prayerNotifications = prayerNotifications ?? {
          'fajr': true,
          'dhuhr': true,
          'asr': true,
          'maghrib': true,
          'isha': true,
        },
        selectedAzanId = selectedAzanId ?? AzanSound.getDefaultSound().id;

  NotificationPreferences copyWith({
    bool? enabled,
    int? earlyReminderMinutes,
    double? volume,
    bool? vibrate,
    Map<String, bool>? prayerNotifications,
    String? selectedAzanId,
  }) {
    return NotificationPreferences(
      enabled: enabled ?? this.enabled,
      earlyReminderMinutes: earlyReminderMinutes ?? this.earlyReminderMinutes,
      volume: volume ?? this.volume,
      vibrate: vibrate ?? this.vibrate,
      prayerNotifications: prayerNotifications ?? Map.from(this.prayerNotifications),
      selectedAzanId: selectedAzanId ?? this.selectedAzanId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'earlyReminderMinutes': earlyReminderMinutes,
      'volume': volume,
      'vibrate': vibrate,
      'prayerNotifications': prayerNotifications,
      'selectedAzanId': selectedAzanId,
    };
  }

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      enabled: json['enabled'] ?? true,
      earlyReminderMinutes: json['earlyReminderMinutes'] ?? 15,
      volume: (json['volume'] ?? 1.0).toDouble(),
      vibrate: json['vibrate'] ?? true,
      prayerNotifications: Map<String, bool>.from(json['prayerNotifications'] ?? {}),
      selectedAzanId: json['selectedAzanId'] ?? AzanSound.getDefaultSound().id,
    );
  }

  AzanSound get selectedAzanSound => 
      AzanSound.findById(selectedAzanId) ?? AzanSound.getDefaultSound();
} 