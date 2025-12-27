import 'package:flutter/material.dart';
import '../../models/notification_preferences.dart';
import '../../models/azan_sound.dart';
import '../../services/notification_service.dart';
import '../../services/storage_service.dart';
import '../../services/theme_service.dart';
import '../../services/prayer_times_service.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final StorageService _storage = StorageService();
  final NotificationService _notificationService = NotificationService();
  final ThemeService _themeService = ThemeService();
  final LocationService _locationService = LocationService();
  final ApiService _apiService = ApiService();
  late NotificationPreferences _preferences;
  bool _isLoading = true;
  bool _isPlayingPreview = false;
  TurkishCity? _selectedCity;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await _storage.getNotificationPreferences();
    setState(() {
      _preferences = prefs;
      _selectedCity = _locationService.selectedCity;
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
        // PERFORMANCE: cacheExtent improves scroll performance
        cacheExtent: 300,
        children: [
          _buildLocationSection(),
          const SizedBox(height: 24),
          _buildThemeSection(),
          const SizedBox(height: 24),
          _buildNotificationSection(),
          const SizedBox(height: 24),
          _buildAzanSection(),
          const SizedBox(height: 24),
          _buildPrayerNotificationsSection(),
          const SizedBox(height: 24),
          _buildAccountSection(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildAccountSection() {
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
                Icons.person,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Hesap',
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
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.logout,
                color: Colors.red,
              ),
            ),
            title: const Text('Çıkış Yap'),
            subtitle: const Text('Hesabınızdan güvenli çıkış yapın'),
            onTap: _confirmLogout,
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çıkış Yap'),
        content: const Text('Çıkış yapmak istediğinize emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Çıkış Yap'),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      await _logout();
    }
  }

  Future<void> _logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _apiService.logout(refreshToken);
      }
    } catch (_) {
      // ignore - still clear local session
    } finally {
      await _storage.clearAuthTokens();
      _storage.logout();
      _apiService.clearAuthToken();

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Widget _buildLocationSection() {
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
                Icons.location_on,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Konum Ayarları',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Konum izni vermek istemiyorsanız, namaz vakitleri için şehrinizi manuel olarak seçebilirsiniz.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 16),
          // Current selection display
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _selectedCity != null 
                  ? Colors.green.withOpacity(0.1)
                  : Theme.of(context).colorScheme.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _selectedCity != null 
                    ? Colors.green.withOpacity(0.3)
                    : Theme.of(context).colorScheme.primary.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _selectedCity != null ? Icons.check_circle : Icons.gps_fixed,
                  color: _selectedCity != null ? Colors.green : Theme.of(context).colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedCity != null ? 'Manuel Şehir Seçili' : 'GPS Kullanılıyor',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _selectedCity != null ? Colors.green : Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      Text(
                        _selectedCity?.name ?? 'Konum otomatik olarak belirleniyor',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (_selectedCity != null)
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    tooltip: 'GPS\'e Dön',
                    onPressed: () async {
                      await _locationService.clearManualCity();
                      setState(() => _selectedCity = null);
                      // Refresh prayer times
                      PrayerTimesService().loadPrayerTimes(forceRefresh: true);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('GPS konumu kullanılacak'),
                            backgroundColor: Colors.blue,
                          ),
                        );
                      }
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // City selection button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showCitySelectionDialog,
              icon: const Icon(Icons.location_city),
              label: Text(_selectedCity != null ? 'Şehri Değiştir' : 'Şehir Seç'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCitySelectionDialog() {
    final cities = LocationService.turkishCities;
    final searchController = TextEditingController();
    List<TurkishCity> filteredCities = List.from(cities);

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.location_city, color: Colors.blue),
              SizedBox(width: 8),
              Text('Şehir Seçin'),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            height: 400,
            child: Column(
              children: [
                // Search field
                TextField(
                  controller: searchController,
                  decoration: InputDecoration(
                    hintText: 'Şehir ara...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  onChanged: (value) {
                    setDialogState(() {
                      filteredCities = cities
                          .where((city) => city.name.toLowerCase().contains(value.toLowerCase()))
                          .toList();
                    });
                  },
                ),
                const SizedBox(height: 12),
                // City list
                Expanded(
                  child: ListView.builder(
                    itemCount: filteredCities.length,
                    itemBuilder: (context, index) {
                      final city = filteredCities[index];
                      final isSelected = _selectedCity?.name == city.name;
                      
                      return ListTile(
                        leading: Icon(
                          isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: isSelected ? Colors.green : Colors.grey,
                        ),
                        title: Text(
                          city.name,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.green : null,
                          ),
                        ),
                        onTap: () async {
                          await _locationService.setManualCity(city);
                          setState(() => _selectedCity = city);
                          Navigator.pop(context);
                          // Refresh prayer times with new city
                          PrayerTimesService().loadPrayerTimes(forceRefresh: true);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${city.name} seçildi. Namaz vakitleri güncelleniyor...'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('İptal'),
            ),
          ],
        ),
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
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () async {
              final fcmToken = await _notificationService.getFcmToken();
              final saved = await _notificationService.syncDeviceTokenToBackend();
              final result = await _apiService.sendNotificationTest();
              if (!mounted) return;
              if (result == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Test bildirimi gönderilemedi (API hatası).')),
                );
                return;
              }

              final ok = result['ok'] == true;
              final tokenInfo = (fcmToken == null || fcmToken.isEmpty)
                  ? 'FCM token: (yok)'
                  : 'FCM token: ${fcmToken.substring(0, 10)}... (${fcmToken.length})';
              final msg = ok
                  ? '$tokenInfo | Kaydet: ${saved ? 'ok' : 'fail'} | Test: sent=${result['sent']} failed=${result['failed']}'
                  : '$tokenInfo | Kaydet: ${saved ? 'ok' : 'fail'} | Test: ${result['reason'] ?? 'unknown'}';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(msg)),
              );
            },
            icon: const Icon(Icons.bug_report),
            label: const Text('Bildirim Testi'),
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
          // PERFORMANCE: ValueKey for efficient list item updates
          ...AzanSound.allSounds.map((sound) => KeyedSubtree(
            key: ValueKey(sound.id),
            child: ListTile(
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
        // PERFORMANCE: ValueKey for efficient prayer notification switches
        ...prayers.entries.map(
          (entry) => KeyedSubtree(
            key: ValueKey(entry.key),
            child: SwitchListTile(
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
        ),
        ],
      ),
    );
  }
} 