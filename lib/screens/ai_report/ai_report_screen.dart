import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/ai_report_service.dart';

class AIReportScreen extends StatefulWidget {
  const AIReportScreen({Key? key}) : super(key: key);

  @override
  State<AIReportScreen> createState() => _AIReportScreenState();
}

class _AIReportScreenState extends State<AIReportScreen> with SingleTickerProviderStateMixin {
  final AIReportService _aiService = AIReportService();
  late TabController _tabController;
  
  AIReport? _dailyReport;
  AIReport? _weeklyReport;
  AIReport? _monthlyReport;
  
  bool _isLoadingDaily = false;
  bool _isLoadingWeekly = false;
  bool _isLoadingMonthly = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _generateDailyReport() async {
    setState(() => _isLoadingDaily = true);
    try {
      final report = await _aiService.generateDailyReport();
      setState(() => _dailyReport = report);
    } finally {
      setState(() => _isLoadingDaily = false);
    }
  }

  Future<void> _generateWeeklyReport() async {
    setState(() => _isLoadingWeekly = true);
    try {
      final report = await _aiService.generateWeeklyReport();
      setState(() => _weeklyReport = report);
    } finally {
      setState(() => _isLoadingWeekly = false);
    }
  }

  Future<void> _generateMonthlyReport() async {
    setState(() => _isLoadingMonthly = true);
    try {
      final report = await _aiService.generateMonthlyReport();
      setState(() => _monthlyReport = report);
    } finally {
      setState(() => _isLoadingMonthly = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome, size: 24),
            SizedBox(width: 8),
            Text('AI Namaz Raporu'),
          ],
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.today), text: 'Günlük'),
            Tab(icon: Icon(Icons.view_week), text: 'Haftalık'),
            Tab(icon: Icon(Icons.calendar_month), text: 'Aylık'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildReportTab(
            report: _dailyReport,
            isLoading: _isLoadingDaily,
            onGenerate: _generateDailyReport,
            title: 'Günlük Rapor',
            icon: Icons.today,
            color: Colors.blue,
          ),
          _buildReportTab(
            report: _weeklyReport,
            isLoading: _isLoadingWeekly,
            onGenerate: _generateWeeklyReport,
            title: 'Haftalık Rapor',
            icon: Icons.view_week,
            color: Colors.purple,
          ),
          _buildReportTab(
            report: _monthlyReport,
            isLoading: _isLoadingMonthly,
            onGenerate: _generateMonthlyReport,
            title: 'Aylık Rapor',
            icon: Icons.calendar_month,
            color: Colors.teal,
          ),
        ],
      ),
    );
  }

  Widget _buildReportTab({
    required AIReport? report,
    required bool isLoading,
    required VoidCallback onGenerate,
    required String title,
    required IconData icon,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header card
          Container(
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
            child: Column(
              children: [
                Icon(icon, size: 48, color: color),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'AI destekli kişiselleştirilmiş namaz analizi',
                  style: TextStyle(
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: isLoading ? null : onGenerate,
                  icon: isLoading 
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome),
                  label: Text(isLoading ? 'Rapor hazırlanıyor...' : 'Rapor Oluştur'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Report content
          if (report != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[850] : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        report.isError ? Icons.error_outline : Icons.check_circle,
                        color: report.isError ? Colors.red : Colors.green,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        report.isError ? 'Hata' : report.typeDisplayName,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: report.isError ? Colors.red : color,
                        ),
                      ),
                      const Spacer(),
                      if (report.generatedAt != null)
                        Text(
                          _formatTime(report.generatedAt!),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                    ],
                  ),
                  const Divider(height: 24),
                  SelectableText(
                    report.content,
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.6,
                      color: isDark ? Colors.grey[300] : Colors.grey[800],
                    ),
                  ),
                  if (!report.isError) ...[
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: report.content));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Rapor kopyalandı!')),
                            );
                          },
                          icon: const Icon(Icons.copy, size: 18),
                          label: const Text('Kopyala'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[850] : Colors.grey[100],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.grey[700]! : Colors.grey[300]!,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Henüz rapor oluşturulmadı',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[500],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Yukarıdaki butona tıklayarak AI destekli\nkişisel namaz raporunuzu oluşturun',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[400],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 20),
          
          // Info card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.amber[700]),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Bu rapor AI tarafından namaz takip verilerinize göre oluşturulmaktadır. Dini fetva niteliği taşımaz.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.amber[800],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
