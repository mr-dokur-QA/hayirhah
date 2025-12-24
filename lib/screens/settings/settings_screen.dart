import 'package:flutter/material.dart';
import '../../models/notification_preferences.dart';
import '../../models/azan_sound.dart';
import '../../services/notification_service.dart';
import '../../services/storage_service.dart';
import '../../services/theme_service.dart';
import '../../services/prayer_times_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final StorageService _storage = StorageService();
  final NotificationService _notificationService = NotificationService();
  final ThemeService _themeService = ThemeService();
  late NotificationPreferences _preferences;
  bool _isLoading = true;
  bool _isPlayingPreview = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await _storage.getNotificationPreferences();
    setState(() {
      _preferences = prefs;
      _isLoading = false;
    });
  }

  Future<void> _savePreferences(NotificationPreferences newPrefs) async {
    await _storage.saveNotificationPreferences(newPrefs);
    setState(() => _preferences = newPrefs);
  }

  Future<void> _playAzanPreview(AzanSound sound) async {
    if (_isPlayingPreview) {
      await _notificationService.stopAzanPreview();
    }
    setState(() => _isPlayingPreview = true);
    await _notificationService.playAzanPreview(sound.id);
  }

  Future<void> _stopAzanPreview() async {
    await _notificationService.stopAzanPreview();
    setState(() => _isPlayingPreview = false);
  }

  @override
  void dispose() {
    _stopAzanPreview();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayarlar'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildThemeSection(),
          const SizedBox(height: 24),
          _buildNotificationSection(),
          const SizedBox(height: 24),
          _buildAzanSection(),
          const SizedBox(height: 24),
          _buildPrayerNotificationsSection(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildThemeSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.palette,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Görünüm',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _themeService.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            title: const Text('Karanlık Mod'),
            subtitle: Text(
              _themeService.isDarkMode ? 'Karanlık tema etkin' : 'Aydınlık tema etkin',
            ),
            trailing: Switch(
              value: _themeService.isDarkMode,
              onChanged: (value) {
                _themeService.toggleTheme();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.notifications,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Bildirimler',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.notifications_active,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            title: const Text('Bildirimleri Etkinleştir'),
            subtitle: Text(
              _preferences.enabled ? 'Bildirimler etkin' : 'Bildirimler kapalı',
            ),
            trailing: Switch(
              value: _preferences.enabled,
              onChanged: (value) {
                _savePreferences(_preferences.copyWith(enabled: value));
              },
            ),
          ),
        if (_preferences.enabled) ...[
          ListTile(
            title: const Text('Erken Hatırlatma'),
            subtitle: Text('${_preferences.earlyReminderMinutes} dakika önce'),
            trailing: DropdownButton<int>(
              value: _preferences.earlyReminderMinutes,
              items: [0, 5, 10, 15, 20, 30]
                  .map((minutes) => DropdownMenuItem(
                        value: minutes,
                        child: Text('$minutes dk'),
                      ))
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  _savePreferences(
                    _preferences.copyWith(earlyReminderMinutes: value),
                  );
                }
              },
            ),
          ),
          ListTile(
            title: const Text('Ses Seviyesi'),
            subtitle: Slider(
              value: _preferences.volume,
              min: 0.0,
              max: 1.0,
              divisions: 10,
              label: '${(_preferences.volume * 100).round()}%',
              onChanged: (value) {
                _savePreferences(_preferences.copyWith(volume: value));
              },
            ),
          ),
          ListTile(
            title: const Text('Titreşim'),
            trailing: Switch(
              value: _preferences.vibrate,
              onChanged: (value) {
                _savePreferences(_preferences.copyWith(vibrate: value));
              },
            ),
          ),
        ],
        ],
      ),
    );
  }

  Widget _buildAzanSection() {
    if (!_preferences.enabled) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.volume_up,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Ezan Sesi',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...AzanSound.allSounds.map((sound) => ListTile(
              title: Text(sound.name),
              subtitle: Text(sound.reciter),
              leading: Radio<String>(
                value: sound.id,
                groupValue: _preferences.selectedAzanId,
                onChanged: (value) {
                  if (value != null) {
                    _savePreferences(
                      _preferences.copyWith(selectedAzanId: value),
                    );
                  }
                },
              ),
              trailing: IconButton(
                icon: Icon(_isPlayingPreview ? Icons.stop : Icons.play_arrow),
                onPressed: () {
                  if (_isPlayingPreview) {
                    _stopAzanPreview();
                  } else {
                    _playAzanPreview(sound);
                  }
                },
              ),
            )),
        ],
      ),
    );
  }

  Widget _buildPrayerNotificationsSection() {
    if (!_preferences.enabled) return const SizedBox.shrink();

    final prayers = {
      'fajr': 'Sabah',
      'dhuhr': 'Öğle',
      'asr': 'İkindi',
      'maghrib': 'Akşam',
      'isha': 'Yatsı',
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.access_time,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Namaz Bildirimleri',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ...prayers.entries.map(
          (entry) => SwitchListTile(
            title: Text(entry.value),
            value: _preferences.prayerNotifications[entry.key] ?? false,
            onChanged: (bool value) {
              final newPrefs = Map<String, bool>.from(_preferences.prayerNotifications);
              newPrefs[entry.key] = value;
              PrayerTimesService().toggleNotification(entry.value, value);
              _savePreferences(
                _preferences.copyWith(prayerNotifications: newPrefs),
              );
            },
          ),
        ),
        ],
      ),
    );
  }
} 