import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/quran_juz.dart';

/// Kur'an Okuma Ekranı - Sayfa seçimi ile resim tabanlı görüntüleme
class QuranReaderScreen extends StatefulWidget {
  const QuranReaderScreen({Key? key}) : super(key: key);

  @override
  State<QuranReaderScreen> createState() => _QuranReaderScreenState();
}

class _QuranReaderScreenState extends State<QuranReaderScreen> {
  int _currentPage = 1;
  double _zoomLevel = 1.0;
  final PageController _pageController = PageController();
  int? _lastReadPage;

  static const int totalPages = 604; // Kur'an toplam sayfa sayısı

  @override
  void initState() {
    super.initState();
    _loadLastReadPage();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadLastReadPage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedPage = prefs.getInt('quran_last_read_page');
      if (savedPage != null && savedPage >= 1 && savedPage <= totalPages) {
        setState(() {
          _lastReadPage = savedPage;
          _currentPage = savedPage;
        });
        // Sayfayı yükle
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _pageController.jumpToPage(savedPage - 1);
        });
      }
    } catch (e) {
      debugPrint('Son okunan sayfa yüklenemedi: $e');
    }
  }

  Future<void> _saveCurrentPage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('quran_last_read_page', _currentPage);
    } catch (e) {
      debugPrint('Sayfa kaydedilemedi: $e');
    }
  }

  String _getQuranPageAssetPath(int pageNumber) {
    // Local assets'ten Kur'an sayfa görsellerini yükle
    // Format: assets/quran_pages/001.png, 002.png, ... 604.png
    final pageStr = pageNumber.toString().padLeft(3, '0');
    return 'assets/quran_pages/$pageStr.png';
  }

  void _goToPage(int pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setState(() {
        _currentPage = pageNumber;
        _zoomLevel = 1.0;
      });
      _pageController.jumpToPage(pageNumber - 1);
      _saveCurrentPage();
    }
  }

  void _showPageSelector() {
    final pageController = TextEditingController();
    int? selectedJuz;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Sayfa veya Cüz Seç'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Cüz seçimi
                  const Text(
                    'Cüz Seç:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    value: selectedJuz,
                    decoration: const InputDecoration(
                      labelText: 'Cüz seçin',
                      border: OutlineInputBorder(),
                    ),
                    items: List.generate(30, (index) {
                      final juzNumber = index + 1;
                      final juz = QuranJuz.getJuzByNumber(juzNumber);
                      return DropdownMenuItem<int>(
                        value: juzNumber,
                        child: Text('${juz?.name ?? "$juzNumber. Cüz"} (Sayfa ${juz?.startPage}-${juz?.endPage})'),
                      );
                    }),
                    onChanged: (value) {
                      setDialogState(() {
                        selectedJuz = value;
                        if (value != null) {
                          final juz = QuranJuz.getJuzByNumber(value);
                          if (juz != null) {
                            pageController.text = juz.startPage.toString();
                          }
                        }
                      });
                    },
                  ),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  // Sayfa seçimi
                  const Text(
                    'Sayfa Seç:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: pageController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Sayfa Numarası (1-604)',
                      border: OutlineInputBorder(),
                      hintText: 'Örn: 1',
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('İptal'),
            ),
            ElevatedButton(
              onPressed: () {
                final pageText = pageController.text.trim();
                if (pageText.isEmpty && selectedJuz == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Lütfen bir sayfa numarası veya cüz seçin'),
                    ),
                  );
                  return;
                }

                int? targetPage;
                if (selectedJuz != null) {
                  final juz = QuranJuz.getJuzByNumber(selectedJuz!);
                  targetPage = juz?.startPage;
                } else if (pageText.isNotEmpty) {
                  targetPage = int.tryParse(pageText);
                }

                if (targetPage != null && targetPage >= 1 && targetPage <= totalPages) {
                  Navigator.pop(context);
                  _goToPage(targetPage);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Geçerli bir sayfa numarası girin (1-604)'),
                    ),
                  );
                }
              },
              child: const Text('Git'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a1a1a),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Kur\'an-ı Kerim',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Sayfa $_currentPage / $totalPages',
              style: const TextStyle(
                fontSize: 12,
                color: Colors.white70,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: _showPageSelector,
            tooltip: 'Sayfa Seç',
          ),
        ],
      ),
      body: GestureDetector(
        onDoubleTap: () {
          setState(() {
            _zoomLevel = _zoomLevel == 1.0 ? 2.0 : 1.0;
          });
        },
        child: PageView.builder(
          controller: _pageController,
          itemCount: totalPages,
          onPageChanged: (index) {
            setState(() {
              _currentPage = index + 1;
              _zoomLevel = 1.0;
            });
            _saveCurrentPage();
          },
          itemBuilder: (context, index) {
            final pageNumber = index + 1;
            return InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: Center(
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: _buildQuranPageImage(pageNumber),
                ),
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.first_page, color: Colors.white),
                onPressed: _currentPage > 1
                    ? () => _goToPage(1)
                    : null,
                tooltip: 'İlk Sayfa',
              ),
              IconButton(
                icon: const Icon(Icons.chevron_left, color: Colors.white),
                onPressed: _currentPage > 1
                    ? () => _goToPage(_currentPage - 1)
                    : null,
                tooltip: 'Önceki Sayfa',
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF667EEA),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$_currentPage / $totalPages',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right, color: Colors.white),
                onPressed: _currentPage < totalPages
                    ? () => _goToPage(_currentPage + 1)
                    : null,
                tooltip: 'Sonraki Sayfa',
              ),
              IconButton(
                icon: const Icon(Icons.last_page, color: Colors.white),
                onPressed: _currentPage < totalPages
                    ? () => _goToPage(totalPages)
                    : null,
                tooltip: 'Son Sayfa',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuranPageImage(int pageNumber) {
    // Local assets'ten Kur'an sayfasını yükle
    final assetPath = _getQuranPageAssetPath(pageNumber);
    
    return Image.asset(
      assetPath,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        debugPrint('Sayfa yükleme hatası: $error');
        debugPrint('Asset path: $assetPath');
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              Text(
                'Sayfa bulunamadı',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Sayfa: $pageNumber',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Kur\'an sayfa görselleri assets klasörüne eklenmeli',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {});
                },
                child: const Text('Tekrar Dene'),
              ),
            ],
          ),
        );
      },
    );
  }
}

