class ArabicText {
  final String id;
  final String title;
  final String type; // 'yasin', 'fetih', 'tefriciye'
  final List<ArabicPage> pages;
  final String description;
  final String? imagePath; // Ana görsel yolu
  final String? pdfPath; // PDF dosya yolu (gelecekte)

  const ArabicText({
    required this.id,
    required this.title,
    required this.type,
    required this.pages,
    required this.description,
    this.imagePath,
    this.pdfPath,
  });
}

class ArabicPage {
  final int pageNumber;
  final String imagePath; // Sayfa görseli
  final String? title; // Sayfa başlığı
  final List<int>? verseNumbers; // Bu sayfadaki ayet numaraları

  const ArabicPage({
    required this.pageNumber,
    required this.imagePath,
    this.title,
    this.verseNumbers,
  });
}

class ArabicVerse {
  final int number;
  final String arabicText;
  final String? translation; // Türkçe meal (isteğe bağlı)
  final bool isBasmala; // Besmele mi?

  const ArabicVerse({
    required this.number,
    required this.arabicText,
    this.translation,
    this.isBasmala = false,
  });
}

class ArabicTextRepository {
  // Yasin Suresi için gerçek sayfa yapısı (6 sayfa)
  static List<ArabicText> getAllTexts() {
    return [
      ArabicText(
        id: 'yasin',
        title: 'Yasin Suresi',
        type: 'yasin',
        description: 'Kur\'an\'ın kalbi olarak bilinen Yasin Suresi - 83 ayet',
        imagePath: 'assets/images/homeLogo.jpeg', // Using existing logo as placeholder
        pages: const [],
      ),
      ArabicText(
        id: 'fetih',
        title: 'Fetih Suresi',
        type: 'fetih',
        description: 'Fetih Suresi - 29 ayet',
        imagePath: 'assets/images/homeLogo.jpeg', // Using existing logo as placeholder
        pages: const [],
      ),
      ArabicText(
        id: 'tefriciye',
        title: 'Salât-ı Tefriciye',
        type: 'tefriciye',
        description: 'Sıkıntıları gideren kutsal salavat',
        imagePath: 'assets/images/homeLogo.jpeg', // Using existing logo as placeholder
        pages: const [],
      ),
    ];
  }

  static ArabicText? getTextByType(String type) {
    try {
      return getAllTexts().firstWhere((text) => text.type == type);
    } catch (e) {
      return null;
    }
  }

  // Get Arabic text as verses for text display
  static List<ArabicVerse> getArabicVerses(String type) {
    switch (type) {
      case 'yasin':
        return _parseArabicText(_yasinText, type);
      case 'fetih':
        return _parseArabicText(_fetihText, type);
      case 'tefriciye':
        return _parseArabicText(_tefriciyeText, type);
      default:
        return [];
    }
  }

  // Eski metin tabanlı yapıyı koruyalım (geçiş dönemi için)
  static const String _yasinText = '''
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
يس
وَالْقُرْآنِ الْحَكِيمِ
إِنَّكَ لَمِنَ الْمُرْسَلِينَ
عَلَى صِرَاطٍ مُسْتَقِيمٍ
تَنْزِيلَ الْعَزِيزِ الرَّحِيمِ
لِتُنْذِرَ قَوْمًا مَا أُنْذِرَ آبَاؤُهُمْ فَهُمْ غَافِلُونَ
لَقَدْ حَقَّ الْقَوْلُ عَلَى أَكْثَرِهِمْ فَهُمْ لَا يُؤْمِنُونَ
إِنَّا جَعَلْنَا فِي أَعْنَاقِهِمْ أَغْلَالًا فَهِيَ إِلَى الْأَذْقَانِ فَهُمْ مُقْمَحُونَ
وَجَعَلْنَا مِنْ بَيْنِ أَيْدِيهِمْ سَدًّا وَمِنْ خَلْفِهِمْ سَدًّا فَأَغْشَيْنَاهُمْ فَهُمْ لَا يُبْصِرُونَ
وَسَوَاءٌ عَلَيْهِمْ أَأَنْذَرْتَهُمْ أَمْ لَمْ تُنْذِرْهُمْ لَا يُؤْمِنُونَ
إِنَّمَا تُنْذِرُ مَنِ اتَّبَعَ الذِّكْرَ وَخَشِيَ الرَّحْمَنَ بِالْغَيْبِ فَبَشِّرْهُ بِمَغْفِرَةٍ وَأَجْرٍ كَرِيمٍ
إِنَّا نَحْنُ نُحْيِي الْمَوْتَى وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُبِينٍ
''';

  static const String _fetihText = '''
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
إِنَّا فَتَحْنَا لَكَ فَتْحًا مُبِينًا
لِيَغْفِرَ لَكَ اللَّهُ مَا تَقَدَّمَ مِنْ ذَنْبِكَ وَمَا تَأَخَّرَ وَيُتِمَّ نِعْمَتَهُ عَلَيْكَ وَيَهْدِيَكَ صِرَاطًا مُسْتَقِيمًا
وَيَنْصُرَكَ اللَّهُ نَصْرًا عَزِيزًا
هُوَ الَّذِي أَنْزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَعَ إِيمَانِهِمْ وَلِلَّهِ جُنُودُ السَّمَاوَاتِ وَالْأَرْضِ وَكَانَ اللَّهُ عَلِيمًا حَكِيمًا
لِيُدْخِلَ الْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ جَنَّاتٍ تَجْرِي مِنْ تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا وَيُكَفِّرَ عَنْهُمْ سَيِّئَاتِهِمْ وَكَانَ ذَلِكَ عِنْدَ اللَّهِ فَوْزًا عَظِيمًا
وَيُعَذِّبَ الْمُنَافِقِينَ وَالْمُنَافِقَاتِ وَالْمُشْرِكِينَ وَالْمُشْرِكَاتِ الظَّانِّينَ بِاللَّهِ ظَنَّ السَّوْءِ عَلَيْهِمْ دَائِرَةُ السَّوْءِ وَغَضِبَ اللَّهُ عَلَيْهِمْ وَلَعَنَهُمْ وَأَعَدَّ لَهُمْ جَهَنَّمَ وَسَاءَتْ مَصِيرًا
وَلِلَّهِ جُنُودُ السَّمَاوَاتِ وَالْأَرْضِ وَكَانَ اللَّهُ عَزِيزًا حَكِيمًا
إِنَّا أَرْسَلْنَاكَ شَاهِدًا وَمُبَشِّرًا وَنَذِيرًا
لِتُؤْمِنُوا بِاللَّهِ وَرَسُولِهِ وَتُعَزِّرُوهُ وَتُوَقِّرُوهُ وَتُسَبِّحُوهُ بُكْرَةً وَأَصِيلًا
إِنَّ الَّذِينَ يُبَايِعُونَكَ إِنَّمَا يُبَايِعُونَ اللَّهَ يَدُ اللَّهِ فَوْقَ أَيْدِيهِمْ فَمَنْ نَكَثَ فَإِنَّمَا يَنْكُثُ عَلَى نَفْسِهِ وَمَنْ أَوْفَى بِمَا عَاهَدَ عَلَيْهُ اللَّهَ فَسَيُؤْتِيهِ أَجْرًا عَظِيمًا
''';

  static const String _tefriciyeText = '''
اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ وَتُقْضَى بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِمِ وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ
''';

  static List<ArabicVerse> _parseArabicText(String text, String type) {
    final lines = text.trim().split('\n').where((line) => line.trim().isNotEmpty).toList();
    final verses = <ArabicVerse>[];
    
    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (line.isEmpty) continue;
      
      final isBasmala = line.contains('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ');
      
      verses.add(ArabicVerse(
        number: i + 1,
        arabicText: line,
        isBasmala: isBasmala,
      ));
    }
    
    return verses;
  }
} 