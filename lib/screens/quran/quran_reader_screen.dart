import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:math' as math;

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

  String _getQuranPageImageUrl(int pageNumber) {
    // Kur'an sayfa görselleri için alternatif kaynaklar:
    // 1. SearchTruth.org (güvenilir): https://www.searchtruth.org/quran/images1/{pageNumber}.jpg
    // 2. Alternatif: https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/images/pages/{pageNumber}.png
    // 3. Alternatif: https://www.islamicfinder.org/quran/images/{pageNumber}.png
    
    // Sayfa numaraları 3 haneli format: 001, 002, ... 604
    final pageStr = pageNumber.toString().padLeft(3, '0');
    
    // SearchTruth.org kullanıyoruz (en güvenilir ve hızlı)
    return 'https://www.searchtruth.org/quran/images1/$pageStr.jpg';
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sayfa Seç'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Sayfa Numarası (1-604)',
                  border: OutlineInputBorder(),
                ),
                onSubmitted: (value) {
                  final page = int.tryParse(value);
                  if (page != null) {
                    Navigator.pop(context);
                    _goToPage(page);
                  }
                },
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  final controller = TextEditingController();
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Sayfa Seç'),
                      content: TextField(
                        controller: controller,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Sayfa Numarası',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('İptal'),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            final page = int.tryParse(controller.text);
                            if (page != null && page >= 1 && page <= totalPages) {
                              Navigator.pop(context);
                              Navigator.pop(context);
                              _goToPage(page);
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
                  );
                },
                child: const Text('Sayfa Numarası Gir'),
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
                  child: Image.network(
                    _getQuranPageImageUrl(pageNumber),
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) {
                        return child;
                      }
                      return Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
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
                              'Sayfa yüklenemedi',
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
                  ),
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
}

