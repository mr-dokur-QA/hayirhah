import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/quran_juz.dart';
import '../../models/task.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../services/quran_service.dart';

class QuranJuzReaderScreen extends StatefulWidget {
  final Task task;
  final QuranJuz juz;
  final String groupId;

  const QuranJuzReaderScreen({
    Key? key,
    required this.task,
    required this.juz,
    required this.groupId,
  }) : super(key: key);

  @override
  State<QuranJuzReaderScreen> createState() => _QuranJuzReaderScreenState();
}

class _QuranJuzReaderScreenState extends State<QuranJuzReaderScreen> {
  int _currentPageIndex = 0; // Cüz içindeki sayfa indeksi (0-based)
  int _lastReadPage = 0; // Son okunan sayfa
  bool _isLoading = false;
  bool _isLoadingPage = false;
  bool _showTranslation = false;
  final _apiService = ApiService();
  final _storageService = StorageService();
  final _quranService = QuranService();
  
  // Cache: Sayfa verilerini hafızada tut
  final Map<int, QuranPage> _pageCache = {};

  @override
  void initState() {
    super.initState();
    _loadReadingProgress();
    _loadCurrentPage();
  }

  Future<void> _loadReadingProgress() async {
    try {
      final savedPage = await _storageService.getTaskReadingProgress(widget.task.id);
      if (savedPage != null) {
        // Kaydedilen sayfa cüzün sayfa aralığında mı kontrol et
        if (savedPage >= widget.juz.startPage && savedPage <= widget.juz.endPage) {
          setState(() {
            _currentPageIndex = savedPage - widget.juz.startPage;
            _lastReadPage = _currentPageIndex;
          });
        }
      }
    } catch (e) {
      debugPrint('Okuma ilerlemesi yüklenemedi: $e');
    }
  }

  int get _currentPageNumber => widget.juz.startPage + _currentPageIndex;
  
  QuranPage? get _currentPage => _pageCache[_currentPageNumber];

  Future<void> _loadCurrentPage() async {
    if (_pageCache.containsKey(_currentPageNumber)) {
      return; // Zaten yüklü
    }

    setState(() {
      _isLoadingPage = true;
    });

    try {
      final page = await _quranService.getPageByNumber(_currentPageNumber);
      if (page != null && mounted) {
        setState(() {
          _pageCache[_currentPageNumber] = page;
          _isLoadingPage = false;
        });
      } else if (mounted) {
        setState(() {
          _isLoadingPage = false;
        });
      }
    } catch (e) {
      debugPrint('Sayfa yüklenemedi: $e');
      if (mounted) {
        setState(() {
          _isLoadingPage = false;
        });
      }
    }
  }

  Future<void> _saveReadingProgress() async {
    if (_currentPageIndex <= _lastReadPage) return; // Geriye gitme durumunda kaydetme

    setState(() {
      _isLoading = true;
      _lastReadPage = _currentPageIndex;
    });

    try {
      // TODO: Backend'e okuma ilerlemesini kaydet
      // await _apiService.updateTaskReadingProgress(
      //   widget.groupId,
      //   widget.task.id,
      //   _currentPageNumber,
      // );

      // Local storage'a kaydet
      await _storageService.saveTaskReadingProgress(
        widget.task.id,
        _currentPageNumber,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('İlerleme kaydedildi: Sayfa $_currentPageNumber'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      debugPrint('Okuma ilerlemesi kaydedilemedi: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _markAsCompleted() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cüzü Tamamla'),
        content: Text(
          '${widget.juz.name} okumayı tamamladınız mı?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              // Task'ı tamamla
              try {
                await _apiService.completeTask(widget.groupId, widget.task.id);
                if (mounted) {
                  Navigator.pop(context, true); // Geri dön ve refresh yap
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Hata: $e')),
                  );
                }
              }
            },
            child: const Text('Tamamla'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalPages = widget.juz.totalPages;
    final progress = (_currentPageIndex + 1) / totalPages;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: const Color(0xFF2D3748),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.juz.name,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Sayfa ${_currentPageIndex + 1} / $totalPages',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.check_circle_outline),
              onPressed: _markAsCompleted,
              tooltip: 'Cüzü Tamamla',
            ),
        ],
      ),
      body: Column(
        children: [
          // İlerleme çubuğu
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey[300],
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF667EEA)),
                  minHeight: 6,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${(progress * 100).toInt()}% tamamlandı',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      'Sayfa $_currentPageNumber / ${widget.juz.endPage}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Kur'an sayfası görüntüleme
          Expanded(
            child: _isLoadingPage
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _currentPage == null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Sayfa yüklenemedi',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: _loadCurrentPage,
                              child: const Text('Tekrar Dene'),
                            ),
                          ],
                        ),
                      )
                    : GestureDetector(
                        onTap: () {
                          // Sayfa tıklama ile ilerleme kaydet
                          _saveReadingProgress();
                        },
                        child: Container(
                          margin: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: _buildQuranPageContent(_currentPage!),
                        ),
                      ),
          ),

          // Navigasyon butonları
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.translate),
                  onPressed: () {
                    setState(() {
                      _showTranslation = !_showTranslation;
                    });
                  },
                  tooltip: _showTranslation ? 'Meali Gizle' : 'Meali Göster',
                  color: _showTranslation ? const Color(0xFF667EEA) : Colors.grey,
                ),
                ElevatedButton.icon(
                  onPressed: _currentPageIndex > 0
                      ? () {
                          setState(() {
                            _currentPageIndex--;
                          });
                          _loadCurrentPage();
                          _saveReadingProgress();
                        }
                      : null,
                  icon: const Icon(Icons.arrow_back_ios, size: 16),
                  label: const Text('Önceki'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF667EEA),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _currentPageIndex < totalPages - 1
                      ? () {
                          setState(() {
                            _currentPageIndex++;
                          });
                          _loadCurrentPage();
                          _saveReadingProgress();
                        }
                      : null,
                  icon: const Icon(Icons.arrow_forward_ios, size: 16),
                  label: const Text('Sonraki'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF667EEA),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
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

  Widget _buildQuranPageContent(QuranPage page) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Sayfa numarası başlığı
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Colors.grey[300]!,
                    width: 1,
                  ),
                ),
              ),
              child: Text(
                'Sayfa ${page.pageNumber}',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[600],
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Ayetler
            ...page.verses.map((verse) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Arapça metin (Ahmed Husrev fontu ile)
                    Text(
                      verse.arabicText,
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontFamily: 'AhmedHusrev',
                        fontSize: 24,
                        height: 2.2,
                        color: Color(0xFF2D3748),
                      ),
                    ),
                    
                    // Türkçe meal (eğer gösteriliyorsa)
                    if (_showTranslation && verse.turkishTranslation != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF667EEA).withOpacity(0.05),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          verse.turkishTranslation!,
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 14,
                            height: 1.6,
                            color: Colors.grey[700],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ],
                    
                    // Ayet numarası
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF667EEA).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${verse.surahNumber}:${verse.verseNumber}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF667EEA),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

