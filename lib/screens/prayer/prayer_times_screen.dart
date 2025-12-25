import 'package:flutter/material.dart';
import '../../services/prayer_times_service.dart';
import 'package:intl/intl.dart';

class PrayerTimesScreen extends StatefulWidget {
  const PrayerTimesScreen({Key? key}) : super(key: key);

  @override
  State<PrayerTimesScreen> createState() => _PrayerTimesScreenState();
}

class _PrayerTimesScreenState extends State<PrayerTimesScreen> with TickerProviderStateMixin {
  final _prayerService = PrayerTimesService();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _loadPrayerTimes();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadPrayerTimes() async {
    await _prayerService.loadPrayerTimes();
    if (mounted) {
      setState(() {});
      _animationController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              _getTimeBasedGradientColors()[0],
              _getTimeBasedGradientColors()[1],
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildCustomAppBar(),
              Expanded(
                child: _buildBody(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Color> _getTimeBasedGradientColors() {
    final hour = DateTime.now().hour;
    
    if (hour >= 5 && hour < 12) {
      // Morning - Sunrise colors
      return [const Color(0xFFFFE0B2), const Color(0xFFFFCC80)];
    } else if (hour >= 12 && hour < 17) {
      // Afternoon - Bright blue
      return [const Color(0xFFE3F2FD), const Color(0xFFBBDEFB)];
    } else if (hour >= 17 && hour < 20) {
      // Evening - Sunset colors
      return [const Color(0xFFFFE0B2), const Color(0xFFFFAB91)];
    } else {
      // Night - Deep blue/purple
      return [const Color(0xFF1A237E), const Color(0xFF3949AB)];
    }
  }

  Widget _buildCustomAppBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back, color: Colors.white),
            ),
          ),
          const Spacer(),
          Column(
            children: [
              Text(
                'Namaz Vakitleri',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  shadows: [
                    Shadow(
                      offset: const Offset(0, 2),
                      blurRadius: 4,
                      color: Colors.black.withOpacity(0.3),
                    ),
                  ],
                ),
              ),
              Text(
                DateFormat('d MMMM yyyy, EEEE', 'tr_TR').format(DateTime.now()),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.9),
                ),
              ),
            ],
          ),
          const Spacer(),
          IconButton(
            onPressed: _loadPrayerTimes,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.refresh, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_prayerService.isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white.withOpacity(0.8)),
            ),
            const SizedBox(height: 16),
            Text(
              'Namaz vakitleri yükleniyor...',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    if (_prayerService.error != null) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.location_off,
                size: 64,
                color: Colors.orange[600],
              ),
              const SizedBox(height: 16),
              Text(
                'Konum Bulunamadı',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Namaz vakitlerini gösterebilmek için konum iznine ihtiyacımız var.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadPrayerTimes,
                icon: const Icon(Icons.location_on),
                label: const Text('Konumu Etkinleştir'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: RefreshIndicator(
        onRefresh: _loadPrayerTimes,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              _buildLocationCard(),
              const SizedBox(height: 20),
              _buildNextPrayerCard(),
              const SizedBox(height: 20),
              _buildPrayerTimesList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.location_on,
              color: Colors.blue,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _prayerService.locationName ?? 'Bilinmeyen Konum',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Mevcut konumunuz',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextPrayerCard() {
    final nextPrayer = _prayerService.nextPrayer;
    
    if (nextPrayer == null) {
      return const SizedBox.shrink();
    }

    final now = DateTime.now();
    final difference = nextPrayer.time.difference(now);
    final hours = difference.inHours;
    final minutes = difference.inMinutes % 60;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF667EEA),
            Color(0xFF764BA2),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667EEA).withOpacity(0.3),
            blurRadius: 15,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(
                  _getPrayerIcon(nextPrayer.name),
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sonraki Namaz',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        nextPrayer.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      DateFormat('HH:mm').format(nextPrayer.time),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${hours}s ${minutes}dk kaldı',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrayerTimesList() {
    final prayerTimes = _prayerService.prayerTimes;
    if (prayerTimes.isEmpty) return const SizedBox.shrink();

    return Column(
      children: prayerTimes.map((prayer) {
        final isNext = _prayerService.nextPrayer?.name == prayer.name;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: isNext 
                ? Colors.green.withOpacity(0.1)
                : Colors.white.withOpacity(0.95),
            borderRadius: BorderRadius.circular(16),
            border: isNext 
                ? Border.all(color: Colors.green, width: 2)
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                spreadRadius: 1,
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isNext 
                    ? Colors.green.withOpacity(0.2)
                    : _getPrayerColor(prayer.name).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getPrayerIcon(prayer.name),
                color: isNext 
                    ? Colors.green
                    : _getPrayerColor(prayer.name),
                size: 24,
              ),
            ),
            title: Text(
              prayer.name,
              style: TextStyle(
                fontSize: 18,
                fontWeight: isNext ? FontWeight.bold : FontWeight.w600,
                color: isNext ? Colors.green[700] : const Color(0xFF2D3748),
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  DateFormat('HH:mm').format(prayer.time),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isNext ? Colors.green[700] : const Color(0xFF2D3748),
                  ),
                ),
                if (isNext)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Sonraki',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _getPrayerColor(String prayerName) {
    switch (prayerName) {
      case 'İmsak':
        return const Color(0xFF1A202C);
      case 'Sabah':
        return const Color(0xFFE53E3E);
      case 'Güneş':
        return const Color(0xFFD69E2E);
      case 'Öğle':
        return const Color(0xFF38B2AC);
      case 'İkindi':
        return const Color(0xFF3182CE);
      case 'Akşam':
        return const Color(0xFFE53E3E);
      case 'Yatsı':
        return const Color(0xFF553C9A);
      default:
        return Colors.grey;
    }
  }

  IconData _getPrayerIcon(String prayerName) {
    switch (prayerName) {
      case 'İmsak':
        return Icons.nightlight;
      case 'Sabah':
        return Icons.wb_twilight;
      case 'Güneş':
        return Icons.wb_sunny;
      case 'Öğle':
        return Icons.wb_sunny;
      case 'İkindi':
        return Icons.sunny;
      case 'Akşam':
        return Icons.wb_twilight;
      case 'Yatsı':
        return Icons.bedtime;
      default:
        return Icons.access_time;
    }
  }


} 