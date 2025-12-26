import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/prayer_tracking.dart';
import '../../services/prayer_tracking_service.dart';
import 'dart:async';

/// PERFORMANCE: Helper widget that keeps tab content alive when switching tabs
/// This prevents unnecessary rebuilds when the user switches between tabs
class _KeepAliveWrapper extends StatefulWidget {
  final Widget child;

  const _KeepAliveWrapper({required this.child});

  @override
  State<_KeepAliveWrapper> createState() => _KeepAliveWrapperState();
}

class _KeepAliveWrapperState extends State<_KeepAliveWrapper>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    return widget.child;
  }
}

class IbadetTakipScreen extends StatefulWidget {
  const IbadetTakipScreen({Key? key}) : super(key: key);

  @override
  State<IbadetTakipScreen> createState() => _IbadetTakipScreenState();
}

class _IbadetTakipScreenState extends State<IbadetTakipScreen> with SingleTickerProviderStateMixin {
  final PrayerTrackingService _trackingService = PrayerTrackingService();
  late TabController _tabController;
  DateTime _selectedDate = DateTime.now();
  DailyPrayerTracking? _currentRecord;
  bool _hasChanges = false;
  Timer? _autoSaveTimer;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this); // Changed back to 3 tabs
    _initializeService();
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _initializeService() async {
    setState(() {
      _isLoading = true;
    });
    
    // First load from local storage
    await _trackingService.initialize();
    
    // Then sync from backend to get latest data
    try {
      final synced = await _trackingService.syncFromBackend();
      debugPrint('IbadetTakipScreen: Backend sync result: $synced');
    } catch (e) {
      debugPrint('IbadetTakipScreen: Backend sync error: $e');
    }
    
    _loadCurrentRecord();
    
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _loadCurrentRecord() {
    _currentRecord = _trackingService.getDayRecord(_selectedDate);
    _hasChanges = false;
  }

  Future<void> _saveChanges() async {
    try {
      await _trackingService.saveDayRecordToApi(_selectedDate);
      if (!mounted) return;
      setState(() {
        _hasChanges = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Kaydedildi'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Kaydetme hatası: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Column(
          children: [
            const Text(
              'Namaz Takip',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              DateFormat('dd MMMM yyyy', 'tr_TR').format(_selectedDate),
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            ),
          ],
        ),
        centerTitle: true,
        elevation: 1,
        actions: [
          if (_hasChanges)
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _saveChanges,
            ),
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: _selectDate,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Günlük', icon: Icon(Icons.today)),
            Tab(text: 'Haftalık', icon: Icon(Icons.calendar_view_week)),
            Tab(text: 'İstatistikler', icon: Icon(Icons.analytics)),
            // Removed Kaza tab
          ],
        ),
      ),
      // PERFORMANCE: KeepAliveWrapper prevents tab content from being disposed
      // when switching tabs, reducing unnecessary rebuilds
      body: TabBarView(
        controller: _tabController,
        children: [
          _KeepAliveWrapper(child: _buildDailyView()),
          _KeepAliveWrapper(child: _buildWeeklyView()),
          _KeepAliveWrapper(child: _buildStatsView()),
        ],
      ),
    );
  }

  Widget _buildDailyView() {
    final today = DateTime.now();
    final oneWeekAgo = today.subtract(const Duration(days: 7));
    final canGoBack = _selectedDate.isAfter(oneWeekAgo);
    final canGoForward = _selectedDate.isBefore(DateTime(today.year, today.month, today.day));

    return Column(
      children: [
        // Date selector
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: canGoBack ? () {
                  setState(() {
                    _selectedDate = _selectedDate.subtract(const Duration(days: 1));
                    _loadCurrentRecord();
                  });
                } : null,
                color: canGoBack ? null : Colors.grey,
              ),
              GestureDetector(
                onTap: () => _selectDate(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    DateFormat('d MMMM y, EEEE', 'tr_TR').format(_selectedDate),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: canGoForward ? () {
                  setState(() {
                    _selectedDate = _selectedDate.add(const Duration(days: 1));
                    _loadCurrentRecord();
                  });
                } : null,
                color: canGoForward ? null : Colors.grey,
              ),
            ],
          ),
        ),
        
        // Content
        Expanded(
          child: _isLoading || _currentRecord == null 
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Prayer tracking section
                      _buildSectionCard(
                        title: 'RAHMET için önce NAMAZ',
                        icon: Icons.mosque,
                        color: Colors.green,
                        child: _buildPrayerTrackingSection(),
                      ),
                      const SizedBox(height: 16),
                      
                      // Sünnet & Nafile Namazlar section
                      _buildSectionCard(
                        title: 'Sünnet & Nafile Namazlar',
                        icon: Icons.add_circle_outline,
                        color: Colors.purple,
                        child: _buildSunnetNafileSection(),
                      ),
                      const SizedBox(height: 16),
                      
                      // Kaza Namazları section (moved here from separate tab)
                      _buildSectionCard(
                        title: 'Kaza Namazları',
                        icon: Icons.update,
                        color: Colors.orange,
                        child: _buildKazaSection(),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Color color,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildPrayerTrackingSection() {
    return Column(
      children: [
        // Sütun başlıkları
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            children: [
              const Expanded(
                child: SizedBox(), // Namaz ismi için boş alan
              ),
              Expanded(
                child: Text(
                  'Vaktinde',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              Expanded(
                child: Text(
                  'Sünnet',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              Expanded(
                child: Text(
                  'Tesbihat',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        ..._currentRecord!.prayers.where((p) => p.type == PrayerType.fard).map((prayer) => 
          Column(
            children: [
              _buildPrayerRow(prayer),
              const Divider(height: 16),
            ],
          )
        ),
      ],
    );
  }

  Widget _buildPrayerRow(PrayerRecord prayer) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Text(
            prayer.prayerName,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Checkbox(
              value: prayer.isCompleted,
              onChanged: (value) => _updatePrayerStatus(prayer, completedOnTime: value ?? false),
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Checkbox(
              value: prayer.completedSunnet,
              onChanged: (value) => _updatePrayerStatus(prayer, completedSunnet: value ?? false),
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Checkbox(
              value: prayer.completedTesbihat,
              onChanged: (value) => _updatePrayerStatus(prayer, completedTesbihat: value ?? false),
            ),
          ),
        ),
      ],
    );
  }

  void _updatePrayerStatus(
    PrayerRecord prayer, {
    bool? completedOnTime,
    bool? completedSunnet,
    bool? completedTesbihat,
  }) async {
    if (completedOnTime != null) {
      await _trackingService.togglePrayerCompletion(prayer.id, _selectedDate);
    }
    if (completedSunnet != null) {
      await _trackingService.togglePrayerSunnet(prayer.id, _selectedDate);
    }
    if (completedTesbihat != null) {
      await _trackingService.togglePrayerTesbihat(prayer.id, _selectedDate);
    }
    
    setState(() {
      _loadCurrentRecord();
      _hasChanges = true;
    });
    // User will explicitly save with the Save button (single API call)
  }

  Widget _buildSunnetNafileSection() {
    final additional = _currentRecord?.additionalPrayers ?? AdditionalPrayersTracking.empty();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Checkbox'lı namazlar - 2x2 düzenli hizalama
        Row(
          children: [
            Expanded(
              child: Row(
                children: [
                  Checkbox(
                    value: additional.teheccud,
                    onChanged: (value) => _updateAdditionalPrayer('teheccud', value ?? false),
                  ),
                  const Text('Teheccüd'),
                ],
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Checkbox(
                    value: additional.duha,
                    onChanged: (value) => _updateAdditionalPrayer('duha', value ?? false),
                  ),
                  const Text('Duha'),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Row(
                children: [
                  Checkbox(
                    value: additional.evvabin,
                    onChanged: (value) => _updateAdditionalPrayer('evvabin', value ?? false),
                  ),
                  const Text('Evvabin'),
                ],
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Checkbox(
                    value: additional.tespih,
                    onChanged: (value) => _updateAdditionalPrayer('tespih', value ?? false),
                  ),
                  const Text('Tesbih'),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildKazaSection() {
    final additional = _currentRecord?.additionalPrayers ?? AdditionalPrayersTracking.empty();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...['sabah', 'öğle', 'ikindi', 'akşam', 'yatsı'].map((prayerName) => 
          _buildKazaPrayerRow(prayerName.toUpperCase(), prayerName, additional.kazaPrayers[prayerName] ?? 0)
        ),
      ],
    );
  }

  Widget _buildKazaPrayerRow(String displayName, String prayerKey, int count) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              displayName,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 16,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: count > 0 
                      ? () => _updateKazaPrayer(prayerKey, count - 1)
                      : null,
                  color: count > 0 ? Colors.red : Colors.grey,
                ),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      count.toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: () => _updateKazaPrayer(prayerKey, count + 1),
                  color: Colors.green,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _updateAdditionalPrayer(String prayerType, bool value) async {
    await _trackingService.toggleAdditionalPrayer(_selectedDate, prayerType, value);
    setState(() {
      _loadCurrentRecord();
      _hasChanges = true;
    });
    // User will explicitly save with the Save button (single API call)
  }

  void _updateKazaPrayer(String prayerKey, int count) async {
    await _trackingService.updateKazaPrayer(_selectedDate, prayerKey, count);
    setState(() {
      _loadCurrentRecord();
      _hasChanges = true;
    });
    // User will explicitly save with the Save button (single API call)
  }

  Widget _buildWeeklyView() {
    return AnimatedBuilder(
      animation: _trackingService,
      builder: (context, child) {
        final weeklyStats = _trackingService.getWeeklyStats(_selectedDate);
        
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Week selector
              _buildWeekSelector(),
              
              const SizedBox(height: 16),
              
              // Weekly summary
              _buildWeeklySummaryCard(weeklyStats),
              
              const SizedBox(height: 16),
              
              // Daily breakdown
              _buildWeeklyBreakdown(weeklyStats),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWeekSelector() {
    final weekStart = _getWeekStart(_selectedDate);
    final weekEnd = weekStart.add(const Duration(days: 6));
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () {
              setState(() {
                _selectedDate = _selectedDate.subtract(const Duration(days: 7));
              });
            },
          ),
          Text(
            '${DateFormat('d MMM', 'tr_TR').format(weekStart)} - ${DateFormat('d MMM y', 'tr_TR').format(weekEnd)}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () {
              setState(() {
                _selectedDate = _selectedDate.add(const Duration(days: 7));
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklySummaryCard(WeeklyPrayerStats stats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Haftalık Özet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildWeeklyStatCard(
                    'Farz Namazlar',
                    '${stats.completedFardCount}/${stats.totalFardCount}',
                    stats.weeklyFardCompletionRate,
                    Colors.green,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildWeeklyStatCard(
                    'Toplam Namazlar',
                    '${stats.completedPrayerCount}/${stats.totalPrayerCount}',
                    stats.totalPrayerCount > 0 ? stats.completedPrayerCount / stats.totalPrayerCount : 0.0,
                    Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: stats.weeklyFardCompletionRate,
              backgroundColor: Colors.grey.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
            ),
            const SizedBox(height: 8),
            Text(
              'Haftalık Farz Namaz Oranı: ${(stats.weeklyFardCompletionRate * 100).toInt()}%',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeeklyStatCard(String title, String count, double rate, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            count,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            '${(rate * 100).toInt()}%',
            style: TextStyle(
              fontSize: 14,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyBreakdown(WeeklyPrayerStats stats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Günlük Detay',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...stats.dailyRecords.map((dayRecord) => _buildDayBreakdownRow(dayRecord)),
          ],
        ),
      ),
    );
  }

  Widget _buildDayBreakdownRow(DailyPrayerTracking dayRecord) {
    final dayName = DateFormat('EEEE', 'tr_TR').format(dayRecord.date);
    final dayDate = DateFormat('d MMM', 'tr_TR').format(dayRecord.date);
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor.withOpacity(0.3),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dayName,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  dayDate,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).textTheme.bodySmall?.color,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 3,
            child: LinearProgressIndicator(
              value: dayRecord.fardCompletionRate,
              backgroundColor: Colors.grey.withOpacity(0.3),
              valueColor: AlwaysStoppedAnimation<Color>(
                dayRecord.fardCompletionRate == 1.0 ? Colors.green : Colors.orange,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '${dayRecord.completedFardCount}/${dayRecord.fardPrayerCount}',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsView() {
    return AnimatedBuilder(
      animation: _trackingService,
      builder: (context, child) {
        final last7Days = _trackingService.getLastSevenDaysStats();
        final monthlyStats = _trackingService.getMonthlyStats();
        
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildStatCard(
                'Son 7 Gün',
                last7Days,
                Icons.calendar_view_week,
                Colors.blue,
              ),
              const SizedBox(height: 16),
              _buildStatCard(
                'Bu Ay',
                monthlyStats,
                Icons.calendar_month,
                Colors.green,
              ),
              const SizedBox(height: 16),
              _buildBestWorstDays(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatCard(String title, Map<String, dynamic> stats, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Farz Namazlar',
                    '${stats['completedFard']}/${stats['totalFard']}',
                    '${(stats['fardCompletionRate'] * 100).toInt()}%',
                    Colors.red,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatItem(
                    'Toplam Namazlar',
                    '${stats['completedPrayers']}/${stats['totalPrayers']}',
                    '${(stats['overallCompletionRate'] * 100).toInt()}%',
                    Colors.blue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String title, String count, String percentage, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            count,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            percentage,
            style: TextStyle(
              fontSize: 14,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBestWorstDays() {
    final weeklyStats = _trackingService.getWeeklyStats();
    final bestDay = weeklyStats.bestDay;
    final worstDay = weeklyStats.worstDay;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Bu Hafta',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (bestDay != null) ...[
              _buildDayHighlight(
                'En İyi Gün',
                bestDay,
                Colors.green,
                Icons.emoji_events,
              ),
              const SizedBox(height: 8),
            ],
            if (worstDay != null) ...[
              _buildDayHighlight(
                'Gelişim Alanı',
                worstDay,
                Colors.orange,
                Icons.trending_up,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDayHighlight(String title, DailyPrayerTracking day, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  DateFormat('d MMMM y, EEEE', 'tr_TR').format(day.date),
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '${day.completedFardCount}/${day.fardPrayerCount}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDate() async {
    final today = DateTime.now();
    final oneWeekAgo = today.subtract(const Duration(days: 7));
    
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: oneWeekAgo,
      lastDate: today,
    );
    
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _loadCurrentRecord();
      });
    }
  }

  DateTime _getWeekStart(DateTime date) {
    final weekday = date.weekday;
    final daysToSubtract = weekday == 7 ? 0 : weekday;
    return DateTime(date.year, date.month, date.day).subtract(Duration(days: daysToSubtract));
  }
} 