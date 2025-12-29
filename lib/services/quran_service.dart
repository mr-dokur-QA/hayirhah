import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

/// Kur'an Ayet Modeli
class QuranVerse {
  final int surahNumber;
  final int verseNumber;
  final String arabicText;
  final String? turkishTranslation;
  final int? pageNumber;

  const QuranVerse({
    required this.surahNumber,
    required this.verseNumber,
    required this.arabicText,
    this.turkishTranslation,
    this.pageNumber,
  });

  factory QuranVerse.fromJson(Map<String, dynamic> json) {
    return QuranVerse(
      surahNumber: json['surah']?['number'] ?? json['surah_number'] ?? 0,
      verseNumber: json['number'] ?? json['verse_number'] ?? 0,
      arabicText: json['text'] ?? json['arabic'] ?? '',
      turkishTranslation: json['translation']?['tr'] ?? json['turkish'],
      pageNumber: json['page'],
    );
  }
}

/// Kur'an Sayfa Modeli
class QuranPage {
  final int pageNumber;
  final List<QuranVerse> verses;

  const QuranPage({
    required this.pageNumber,
    required this.verses,
  });
}

/// Kur'an Servisi - Dış API'lerden Kur'an metni çeker
class QuranService {
  static final QuranService _instance = QuranService._internal();
  factory QuranService() => _instance;
  QuranService._internal();

  // Al-Quran Cloud API (ücretsiz, rate limit var ama yeterli)
  static const String _alquranApiBase = 'https://api.alquran.cloud/v1';
  
  // Alternatif: Tanzil.net (açık kaynak, JSON indirilebilir)
  // static const String _tanzilBase = 'https://tanzil.net/res/text/';

  /// Sayfa numarasına göre Kur'an ayetlerini getir
  /// Al-Quran Cloud API kullanıyor
  Future<QuranPage?> getPageByNumber(int pageNumber) async {
    try {
      // Al-Quran Cloud API: /page/{pageNumber}/{edition}
      // Edition: quran-uthmani (Uthmani script - standart)
      final url = Uri.parse('$_alquranApiBase/page/$pageNumber/quran-uthmani');
      
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final ayahs = data['data']['ayahs'] as List;
        
        final verses = ayahs.map<QuranVerse>((ayah) {
          return QuranVerse(
            surahNumber: ayah['surah']['number'],
            verseNumber: ayah['number'],
            arabicText: ayah['text'],
            pageNumber: pageNumber,
          );
        }).toList();

        return QuranPage(
          pageNumber: pageNumber,
          verses: verses,
        );
      } else {
        debugPrint('Quran API error: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Error fetching Quran page: $e');
      return null;
    }
  }

  /// Türkçe meal ile birlikte sayfa getir
  /// İki API çağrısı yapar: Arapça metin + Türkçe meal
  Future<QuranPage?> getPageWithTranslation(int pageNumber) async {
    try {
      // Arapça metin
      final arabicUrl = Uri.parse('$_alquranApiBase/page/$pageNumber/quran-uthmani');
      final arabicResponse = await http.get(arabicUrl);
      
      if (arabicResponse.statusCode != 200) {
        return null;
      }

      final arabicData = json.decode(arabicResponse.body);
      final ayahs = arabicData['data']['ayahs'] as List;

      // Türkçe meal için alternatif API: Quran API (fawazahmed0)
      // Bu API'den Türkçe meal çekmeye çalışalım
      final verses = <QuranVerse>[];
      
      for (final ayah in ayahs) {
        final surahNum = ayah['surah']['number'];
        final verseNum = ayah['number'];
        
        // Türkçe meal için ayrı API çağrısı (opsiyonel, hata olursa devam et)
        String? turkishTranslation;
        try {
          // Quran API'den Türkçe meal (tr.ali_bulaç veya başka bir çevirmen)
          final translationUrl = Uri.parse('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/tur-ali-bulac/$surahNum/$verseNum.json');
          final translationResponse = await http.get(translationUrl).timeout(
            const Duration(seconds: 2),
            onTimeout: () => throw TimeoutException('Translation timeout'),
          );
          
          if (translationResponse.statusCode == 200) {
            final translationData = json.decode(translationResponse.body);
            turkishTranslation = translationData[0]?['text'];
          }
        } catch (e) {
          // Türkçe meal yüklenemezse devam et
          debugPrint('Turkish translation not available for $surahNum:$verseNum');
        }
        
        verses.add(QuranVerse(
          surahNumber: surahNum,
          verseNumber: verseNum,
          arabicText: ayah['text'],
          pageNumber: pageNumber,
          turkishTranslation: turkishTranslation,
        ));
      }

      return QuranPage(
        pageNumber: pageNumber,
        verses: verses,
      );
    } catch (e) {
      debugPrint('Error fetching Quran page with translation: $e');
      return null;
    }
  }

  /// Cüz numarasına göre tüm sayfaları getir
  Future<List<QuranPage>> getJuzPages(int juzNumber) async {
    // Cüz sayfa aralığını bul
    final juz = _getJuzPageRange(juzNumber);
    if (juz == null) return [];

    final pages = <QuranPage>[];
    final startPage = juz['start'] as int;
    final endPage = juz['end'] as int;
    for (int page = startPage; page <= endPage; page++) {
      final pageData = await getPageByNumber(page);
      if (pageData != null) {
        pages.add(pageData);
      }
      // Rate limit için kısa bekleme
      await Future.delayed(const Duration(milliseconds: 100));
    }

    return pages;
  }

  /// Cüz sayfa aralığı (basitleştirilmiş)
  Map<String, int>? _getJuzPageRange(int juzNumber) {
    const ranges = [
      {'start': 1, 'end': 21},
      {'start': 22, 'end': 41},
      {'start': 42, 'end': 61},
      {'start': 62, 'end': 82},
      {'start': 83, 'end': 101},
      {'start': 102, 'end': 120},
      {'start': 121, 'end': 141},
      {'start': 142, 'end': 161},
      {'start': 162, 'end': 180},
      {'start': 181, 'end': 200},
      {'start': 201, 'end': 220},
      {'start': 221, 'end': 240},
      {'start': 241, 'end': 260},
      {'start': 261, 'end': 280},
      {'start': 281, 'end': 300},
      {'start': 301, 'end': 320},
      {'start': 321, 'end': 340},
      {'start': 341, 'end': 360},
      {'start': 361, 'end': 380},
      {'start': 381, 'end': 400},
      {'start': 401, 'end': 420},
      {'start': 421, 'end': 440},
      {'start': 441, 'end': 460},
      {'start': 461, 'end': 480},
      {'start': 481, 'end': 500},
      {'start': 501, 'end': 520},
      {'start': 521, 'end': 540},
      {'start': 541, 'end': 560},
      {'start': 561, 'end': 580},
      {'start': 581, 'end': 604},
    ];

    if (juzNumber < 1 || juzNumber > 30) return null;
    return ranges[juzNumber - 1];
  }
}

