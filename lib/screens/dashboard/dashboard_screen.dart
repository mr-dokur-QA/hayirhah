import 'package:flutter/material.dart';
import '../group/create_group_screen.dart';
import '../group/my_groups_screen.dart';
import '../invite/join_group_screen.dart';
import '../qibla/qibla_finder_screen.dart';
import '../settings/settings_screen.dart';
import '../prayer/prayer_times_screen.dart';
import '../prayer_tracking/ibadet_takip_screen.dart';
import '../ai_report/ai_report_screen.dart';
import '../../services/prayer_times_service.dart';
import '../../services/prayer_tracking_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _prayerService = PrayerTimesService();
  final _trackingService = PrayerTrackingService();

  @override
  void initState() {
    super.initState();
    _loadPrayerTimes();
    _initializeTracking();
  }

  Future<void> _loadPrayerTimes() async {
    await _prayerService.loadPrayerTimes();
    if (mounted) setState(() {});
  }

  Future<void> _initializeTracking() async {
    await _trackingService.initialize();
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'Hayırhah',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        centerTitle: true,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => _navigateToSettings(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.mosque,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Hoşgeldiniz',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Dua ve ibadet arkadaşlarınızla birlikte manevi yolculuğunuza devam edin',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Next prayer time notification (compact)
              if (_prayerService.nextPrayer != null && !_prayerService.isLoading)
                _buildNextPrayerNotification(),

              const SizedBox(height: 16),

              // Main features (moved right after welcome)
              Text(
                'Ana Özellikler',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 16),

              // Prayer tracking button (moved to top)
              _buildMainFeatureButton(
                context,
                title: 'İbadet Takip',
                subtitle: 'Günlük namaz takibinizi yapın, kaza namazları ve sağlık takibi',
                icon: Icons.checklist,
                color: Colors.purple,
                onTap: () => _navigateToIbadetTakip(context),
              ),

              const SizedBox(height: 16),

              // Create Activity button
              _buildMainFeatureButton(
                context,
                title: 'Etkinlik Oluştur',
                subtitle: 'Dua grubu oluşturun ve arkadaşlarınızı davet edin',
                icon: Icons.volunteer_activism,
                color: Colors.blue,
                onTap: () => _navigateToCreateGroup(context),
              ),

              const SizedBox(height: 16),

              // Join Activity button
              _buildMainFeatureButton(
                context,
                title: 'Etkinliğe Katıl',
                subtitle: 'Davet koduyla mevcut bir etkinliğe katılın',
                icon: Icons.group_add,
                color: Colors.orange,
                onTap: () => _navigateToJoinGroup(context),
              ),

              const SizedBox(height: 16),

              // Qibla finder button (removed "Bulucu" word)
              _buildMainFeatureButton(
                context,
                title: 'Kıble',
                subtitle: 'Namaz kılmak için doğru yönü bulun',
                icon: Icons.navigation,
                color: Colors.green,
                onTap: () => _navigateToQibla(context),
              ),

              const SizedBox(height: 32),

              // Other features
              Text(
                'Diğer Özellikler',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 16),

              // My Activities button
              _buildSecondaryButton(
                context,
                title: 'Etkinliklerim',
                subtitle: 'Oluşturduğunuz ve katıldığınız etkinlikleri görün',
                icon: Icons.list_alt,
                color: Theme.of(context).colorScheme.primary,
                onTap: () => _navigateToMyGroups(context),
              ),

              const SizedBox(height: 12),

              // Prayer Times button
              _buildSecondaryButton(
                context,
                title: 'Namaz Vakitleri',
                subtitle: 'Günlük namaz vakitlerini görüntüleyin',
                icon: Icons.access_time,
                color: Theme.of(context).colorScheme.primary,
                onTap: () => _navigateToPrayerTimes(context),
              ),

              const SizedBox(height: 12),

              // AI Prayer Report button
              _buildSecondaryButton(
                context,
                title: 'Namaz Raporu',
                subtitle: 'Hesaba çekilmeden kendimizi hesaba çekelim',
                icon: Icons.auto_awesome,
                color: Colors.amber.shade700,
                onTap: () => _navigateToAIReport(context),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainFeatureButton(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      width: double.infinity,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withOpacity(0.2),
                  color.withOpacity(0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    size: 32,
                    color: color,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: color,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: Theme.of(context).textTheme.bodyMedium?.color,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: color,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSecondaryButton(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: color,
              size: 40,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: color,
            ),
          ],
        ),
      ),
    );
  }



  void _navigateToCreateGroup(BuildContext context) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CreateGroupScreen()),
    );
    // If a group was created, refresh the groups list
    if (result == true) {
      // No need to call _loadUserGroups() as user groups are removed
    }
  }

  void _navigateToJoinGroup(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const JoinGroupScreen()),
    );
  }



  void _navigateToQibla(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const QiblaFinderScreen()),
    );
  }

  void _navigateToMyGroups(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const MyGroupsScreen()),
    );
    // Refresh groups when returning from my groups screen
    // No need to call _loadUserGroups() as user groups are removed
  }

  void _navigateToSettings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SettingsScreen()),
    );
  }

  void _navigateToPrayerTimes(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const PrayerTimesScreen()),
    );
  }

  void _navigateToIbadetTakip(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const IbadetTakipScreen()),
    );
  }

  void _navigateToAIReport(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AIReportScreen()),
    );
  }

  Widget _buildNextPrayerNotification() {
    final now = DateTime.now();
    var nextPrayerTime = _prayerService.nextPrayer!.time;
    
    // Eğer namaz vakti geçmişse (özellikle İmsak için), yarının aynı vaktini hesapla
    if (nextPrayerTime.isBefore(now)) {
      nextPrayerTime = nextPrayerTime.add(const Duration(days: 1));
    }
    
    final timeUntil = nextPrayerTime.difference(now);
    
    String timeRemaining;
    if (timeUntil.inDays > 0) {
      timeRemaining = 'Yarın ${timeUntil.inHours.remainder(24)}s ${timeUntil.inMinutes.remainder(60)}dk';
    } else if (timeUntil.inHours > 0) {
      timeRemaining = 'Kalan süre: ${timeUntil.inHours}s ${timeUntil.inMinutes.remainder(60)}dk';
    } else if (timeUntil.inMinutes > 0) {
      timeRemaining = 'Kalan süre: ${timeUntil.inMinutes}dk';
    } else if (timeUntil.inSeconds > 0) {
      timeRemaining = 'Kalan süre: ${timeUntil.inSeconds}sn';
    } else {
      timeRemaining = 'Şimdi';
    }
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.amber.withOpacity(0.2),
            Colors.orange.withOpacity(0.1),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.orange.withOpacity(0.4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.15),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getPrayerIcon(_prayerService.nextPrayer!.name),
              size: 20,
              color: Colors.orange.shade700,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _prayerService.nextPrayer!.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.orange.shade200
                        : Colors.orange.shade800,
                  ),
                ),
                Text(
                  _prayerService.locationName,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.orange.shade300
                        : Colors.orange.shade700,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark 
                      ? Colors.orange.shade600
                      : Colors.orange.shade700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  timeRemaining,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getPrayerIcon(String prayerName) {
    switch (prayerName) {
      case 'İmsak':
        return Icons.nights_stay;
      case 'Güneş':
        return Icons.wb_sunny;
      case 'Öğle':
        return Icons.light_mode;
      case 'İkindi':
        return Icons.wb_twilight;
      case 'Akşam':
        return Icons.wb_sunny;
      case 'Yatsı':
        return Icons.bedtime;
      default:
        return Icons.access_time;
    }
  }
} 