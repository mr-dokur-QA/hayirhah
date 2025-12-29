/// Kur'an Cüz Modeli
/// Her cüz için sayfa aralığı ve bilgileri

class QuranJuz {
  final int juzNumber; // 1-30
  final String name; // "1. Cüz"
  final int startPage; // Başlangıç sayfası (1-604)
  final int endPage; // Bitiş sayfası (1-604)
  final String? surahStart; // Başladığı sure
  final String? surahEnd; // Bittiği sure

  const QuranJuz({
    required this.juzNumber,
    required this.name,
    required this.startPage,
    required this.endPage,
    this.surahStart,
    this.surahEnd,
  });

  int get totalPages => endPage - startPage + 1;

  /// Kur'an'ın 30 cüzü için sayfa aralıkları
  /// Standart Mushaf sayfa numaralarına göre
  static const List<QuranJuz> allJuzs = [
    QuranJuz(juzNumber: 1, name: '1. Cüz', startPage: 1, endPage: 21, surahStart: 'Fatiha', surahEnd: 'Bakara'),
    QuranJuz(juzNumber: 2, name: '2. Cüz', startPage: 22, endPage: 41, surahStart: 'Bakara', surahEnd: 'Bakara'),
    QuranJuz(juzNumber: 3, name: '3. Cüz', startPage: 42, endPage: 61, surahStart: 'Bakara', surahEnd: 'Bakara'),
    QuranJuz(juzNumber: 4, name: '4. Cüz', startPage: 62, endPage: 82, surahStart: 'Bakara', surahEnd: 'Bakara'),
    QuranJuz(juzNumber: 5, name: '5. Cüz', startPage: 83, endPage: 101, surahStart: 'Bakara', surahEnd: 'Ali İmran'),
    QuranJuz(juzNumber: 6, name: '6. Cüz', startPage: 102, endPage: 120, surahStart: 'Ali İmran', surahEnd: 'Ali İmran'),
    QuranJuz(juzNumber: 7, name: '7. Cüz', startPage: 121, endPage: 141, surahStart: 'Ali İmran', surahEnd: 'Nisa'),
    QuranJuz(juzNumber: 8, name: '8. Cüz', startPage: 142, endPage: 161, surahStart: 'Nisa', surahEnd: 'Nisa'),
    QuranJuz(juzNumber: 9, name: '9. Cüz', startPage: 162, endPage: 180, surahStart: 'Nisa', surahEnd: 'Maide'),
    QuranJuz(juzNumber: 10, name: '10. Cüz', startPage: 181, endPage: 200, surahStart: 'Maide', surahEnd: 'Enam'),
    QuranJuz(juzNumber: 11, name: '11. Cüz', startPage: 201, endPage: 220, surahStart: 'Enam', surahEnd: 'Araf'),
    QuranJuz(juzNumber: 12, name: '12. Cüz', startPage: 221, endPage: 240, surahStart: 'Araf', surahEnd: 'Araf'),
    QuranJuz(juzNumber: 13, name: '13. Cüz', startPage: 241, endPage: 260, surahStart: 'Araf', surahEnd: 'Enfal'),
    QuranJuz(juzNumber: 14, name: '14. Cüz', startPage: 261, endPage: 280, surahStart: 'Enfal', surahEnd: 'Tevbe'),
    QuranJuz(juzNumber: 15, name: '15. Cüz', startPage: 281, endPage: 300, surahStart: 'Tevbe', surahEnd: 'Hud'),
    QuranJuz(juzNumber: 16, name: '16. Cüz', startPage: 301, endPage: 320, surahStart: 'Hud', surahEnd: 'Yusuf'),
    QuranJuz(juzNumber: 17, name: '17. Cüz', startPage: 321, endPage: 340, surahStart: 'Yusuf', surahEnd: 'Hicr'),
    QuranJuz(juzNumber: 18, name: '18. Cüz', startPage: 341, endPage: 360, surahStart: 'Hicr', surahEnd: 'Kehf'),
    QuranJuz(juzNumber: 19, name: '19. Cüz', startPage: 361, endPage: 380, surahStart: 'Kehf', surahEnd: 'Taha'),
    QuranJuz(juzNumber: 20, name: '20. Cüz', startPage: 381, endPage: 400, surahStart: 'Taha', surahEnd: 'Enbiya'),
    QuranJuz(juzNumber: 21, name: '21. Cüz', startPage: 401, endPage: 420, surahStart: 'Enbiya', surahEnd: 'Hac'),
    QuranJuz(juzNumber: 22, name: '22. Cüz', startPage: 421, endPage: 440, surahStart: 'Hac', surahEnd: 'Muminun'),
    QuranJuz(juzNumber: 23, name: '23. Cüz', startPage: 441, endPage: 460, surahStart: 'Muminun', surahEnd: 'Furkan'),
    QuranJuz(juzNumber: 24, name: '24. Cüz', startPage: 461, endPage: 480, surahStart: 'Furkan', surahEnd: 'Şuara'),
    QuranJuz(juzNumber: 25, name: '25. Cüz', startPage: 481, endPage: 500, surahStart: 'Şuara', surahEnd: 'Neml'),
    QuranJuz(juzNumber: 26, name: '26. Cüz', startPage: 501, endPage: 520, surahStart: 'Neml', surahEnd: 'Ankebut'),
    QuranJuz(juzNumber: 27, name: '27. Cüz', startPage: 521, endPage: 540, surahStart: 'Ankebut', surahEnd: 'Lokman'),
    QuranJuz(juzNumber: 28, name: '28. Cüz', startPage: 541, endPage: 560, surahStart: 'Lokman', surahEnd: 'Sebe'),
    QuranJuz(juzNumber: 29, name: '29. Cüz', startPage: 561, endPage: 580, surahStart: 'Sebe', surahEnd: 'Zümer'),
    QuranJuz(juzNumber: 30, name: '30. Cüz', startPage: 581, endPage: 604, surahStart: 'Zümer', surahEnd: 'Nas'),
  ];

  static QuranJuz? getJuzByNumber(int juzNumber) {
    try {
      return allJuzs.firstWhere((juz) => juz.juzNumber == juzNumber);
    } catch (e) {
      return null;
    }
  }

  static QuranJuz? getJuzByTaskIndex(int taskIndex) {
    // taskIndex 0-based, juzNumber 1-based
    return getJuzByNumber(taskIndex + 1);
  }

  /// Sayfa numarasına göre hangi cüzde olduğunu bul
  static QuranJuz? getJuzByPage(int pageNumber) {
    try {
      return allJuzs.firstWhere(
        (juz) => pageNumber >= juz.startPage && pageNumber <= juz.endPage,
      );
    } catch (e) {
      return null;
    }
  }
}

