import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../models/arabic_text.dart';

class ArabicTextViewerScreen extends StatefulWidget {
  final String textType;

  const ArabicTextViewerScreen({
    Key? key,
    required this.textType,
  }) : super(key: key);

  @override
  State<ArabicTextViewerScreen> createState() => _ArabicTextViewerScreenState();
}

class _ArabicTextViewerScreenState extends State<ArabicTextViewerScreen> {
  late ArabicText? arabicText;
  int _currentPageIndex = 0;
  double _zoomLevel = 1.0;
  bool _showPageInfo = true;
  Set<int> _bookmarkedPages = {};
  late List<ArabicVerse> _verses;
  bool _textMode = true; // default to text mode
  
  @override
  void initState() {
    super.initState();
    arabicText = ArabicTextRepository.getTextByType(widget.textType);
    _verses = ArabicTextRepository.getArabicVerses(widget.textType);
  }

  @override
  Widget build(BuildContext context) {
    if (arabicText == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Metin Bulunamadı'),
        ),
        body: const Center(
          child: Text('Seçilen metin bulunamadı.'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: const Color(0xFF2D3748),
        title: Text(
          arabicText!.title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          // Bookmark button
          IconButton(
            icon: Icon(
              _bookmarkedPages.contains(_currentPageIndex) 
                ? Icons.bookmark 
                : Icons.bookmark_border,
              color: _bookmarkedPages.contains(_currentPageIndex) 
                ? const Color(0xFF667EEA) 
                : null,
            ),
            onPressed: _toggleBookmark,
            tooltip: 'Sayfa İşaretle',
          ),
          // Share button
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _sharePage,
            tooltip: 'Paylaş',
          ),
          IconButton(
            icon: const Icon(Icons.zoom_in),
            onPressed: _showZoomDialog,
            tooltip: 'Yakınlaştır/Uzaklaştır',
          ),
          // Toggle text/image view
          if (arabicText!.pages.isNotEmpty)
            IconButton(
              icon: Icon(_textMode ? Icons.image : Icons.font_download),
              onPressed: () {
                setState(() {
                  _textMode = !_textMode;
                });
              },
              tooltip: _textMode ? 'Görsel Görünüme Geç' : 'Metin Görünüme Geç',
            ),
          IconButton(
            icon: Icon(_showPageInfo ? Icons.info : Icons.info_outline),
            onPressed: () {
              setState(() {
                _showPageInfo = !_showPageInfo;
              });
            },
            tooltip: 'Sayfa Bilgisi',
          ),
        ],
      ),
      body: Column(
        children: [
          // Açıklama kartı (sadece ilk sayfada göster)
          if (_showPageInfo && _currentPageIndex == 0)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF667EEA).withValues(alpha: 0.1),
                    const Color(0xFF764BA2).withValues(alpha: 0.1),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF667EEA).withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF667EEA).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          _getIconForType(widget.textType),
                          color: const Color(0xFF667EEA),
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          arabicText!.title,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.headlineSmall?.color,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    arabicText!.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                ],
              ),
            ),
          
          // Sayfa bilgisi
          if (_showPageInfo && arabicText!.pages.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Sayfa ${_currentPageIndex + 1} / ${arabicText!.pages.length}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF4A5568),
                    ),
                  ),
                  if (arabicText!.pages[_currentPageIndex].title != null)
                    Text(
                      arabicText!.pages[_currentPageIndex].title!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF667EEA),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
          
          const SizedBox(height: 16),
          
          // İçerik (görsel veya metin)
          Expanded(
            child: _textMode
                ? _buildVersesView()
                : GestureDetector(
                    onScaleUpdate: (details) {
                      setState(() {
                        _zoomLevel = details.scale.clamp(0.5, 3.0);
                      });
                    },
                    child: InteractiveViewer(
                      minScale: 0.5,
                      maxScale: 3.0,
                      scaleEnabled: true,
                      panEnabled: true,
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            arabicText!.pages[_currentPageIndex].imagePath,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return _buildPlaceholderView();
                            },
                          ),
                        ),
                      ),
                    ),
                  ),
          ),
          
          // Sayfa navigasyonu
          if (arabicText!.pages.length > 1)
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton.icon(
                    onPressed: _currentPageIndex > 0
                        ? () {
                            setState(() {
                              _currentPageIndex--;
                            });
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
                    onPressed: _currentPageIndex < arabicText!.pages.length - 1
                        ? () {
                            setState(() {
                              _currentPageIndex++;
                            });
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
          
          const SizedBox(height: 16),
        ],
      ),
    );
  }



  Widget _buildPlaceholderView() {
    if (_verses.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.image_not_supported,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Sayfa görseli bulunamadı',
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context).textTheme.bodyMedium?.color,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: _verses.map((verse) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                verse.arabicText,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontFamily: 'AhmedHusrev',
                  fontSize: 28,
                  height: 2.0,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  // Tam metin görünümü
  Widget _buildVersesView() {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: _verses.map((verse) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                verse.arabicText,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontFamily: 'AhmedHusrev',
                  fontSize: 28,
                  height: 2.0,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  void _toggleBookmark() {
    setState(() {
      if (_bookmarkedPages.contains(_currentPageIndex)) {
        _bookmarkedPages.remove(_currentPageIndex);
        _showSnackBar('Sayfa işareti kaldırıldı');
      } else {
        _bookmarkedPages.add(_currentPageIndex);
        _showSnackBar('Sayfa işaretlendi');
      }
    });
  }

  void _sharePage() {
    final currentPage = arabicText!.pages[_currentPageIndex];
    final shareText = '${arabicText!.title} - ${currentPage.title}\n\nHayırhah uygulamasından paylaşıldı';
    
    Share.share(
      shareText,
      subject: '${arabicText!.title} - ${currentPage.title}',
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'yasin':
        return Icons.menu_book;
      case 'fetih':
        return Icons.military_tech;
      case 'tefriciye':
        return Icons.favorite;
      default:
        return Icons.book;
    }
  }

  void _showZoomDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yakınlaştırma'),
        content: StatefulBuilder(
          builder: (context, setDialogState) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Seviye: ${(_zoomLevel * 100).toInt()}%'),
                Slider(
                  value: _zoomLevel,
                  min: 0.5,
                  max: 3.0,
                  divisions: 25,
                  onChanged: (value) {
                    setDialogState(() {
                      _zoomLevel = value;
                    });
                    setState(() {});
                  },
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton(
                      onPressed: () {
                        setDialogState(() {
                          _zoomLevel = 1.0;
                        });
                        setState(() {});
                      },
                      child: const Text('Sıfırla'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Tamam'),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
} 