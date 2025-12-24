class PrayerRecord {
  final String id;
  final String prayerName;
  final PrayerType type;
  final bool isCompleted;
  final DateTime? completedAt;
  final bool isAdded; // Kullanıcı tarafından eklenen sünnet namazlar için
  final bool completedSunnet; // Sünnet kılındı mı
  final bool completedTesbihat; // Tesbihat yapıldı mı

  PrayerRecord({
    required this.id,
    required this.prayerName,
    required this.type,
    this.isCompleted = false,
    this.completedAt,
    this.isAdded = false,
    this.completedSunnet = false,
    this.completedTesbihat = false,
  });

  PrayerRecord copyWith({
    String? id,
    String? prayerName,
    PrayerType? type,
    bool? isCompleted,
    DateTime? completedAt,
    bool? isAdded,
    bool? completedSunnet,
    bool? completedTesbihat,
  }) {
    return PrayerRecord(
      id: id ?? this.id,
      prayerName: prayerName ?? this.prayerName,
      type: type ?? this.type,
      isCompleted: isCompleted ?? this.isCompleted,
      completedAt: completedAt ?? this.completedAt,
      isAdded: isAdded ?? this.isAdded,
      completedSunnet: completedSunnet ?? this.completedSunnet,
      completedTesbihat: completedTesbihat ?? this.completedTesbihat,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'prayerName': prayerName,
      'type': type.toString(),
      'isCompleted': isCompleted,
      'completedAt': completedAt?.toIso8601String(),
      'isAdded': isAdded,
      'completedSunnet': completedSunnet,
      'completedTesbihat': completedTesbihat,
    };
  }

  factory PrayerRecord.fromMap(Map<String, dynamic> map) {
    return PrayerRecord(
      id: map['id'] ?? '',
      prayerName: map['prayerName'] ?? '',
      type: PrayerType.values.firstWhere(
        (e) => e.toString() == map['type'],
        orElse: () => PrayerType.fard,
      ),
      isCompleted: map['isCompleted'] ?? false,
      completedAt: map['completedAt'] != null 
          ? DateTime.parse(map['completedAt']) 
          : null,
      isAdded: map['isAdded'] ?? false,
      completedSunnet: map['completedSunnet'] ?? false,
      completedTesbihat: map['completedTesbihat'] ?? false,
    );
  }
}

enum PrayerType {
  fard,
  sunnah,
  nafile,
  witr,
  kaza, // Added for makeup prayers
}

extension PrayerTypeExtension on PrayerType {
  String get displayName {
    switch (this) {
      case PrayerType.fard:
        return 'Farz';
      case PrayerType.sunnah:
        return 'Sünnet';
      case PrayerType.nafile:
        return 'Nafile';
      case PrayerType.witr:
        return 'Vitir';
      case PrayerType.kaza:
        return 'Kaza';
    }
  }

  String get shortName {
    switch (this) {
      case PrayerType.fard:
        return 'F';
      case PrayerType.sunnah:
        return 'S';
      case PrayerType.nafile:
        return 'N';
      case PrayerType.witr:
        return 'V';
      case PrayerType.kaza:
        return 'K';
    }
  }
}

// Additional prayers tracking (Sünnet & Nafile)
class AdditionalPrayersTracking {
  final bool teheccud;
  final bool duha; 
  final bool evvabin;
  final bool tespih;
  final Map<String, int> kazaPrayers; // Kaza namazları

  AdditionalPrayersTracking({
    this.teheccud = false,
    this.duha = false,
    this.evvabin = false,
    this.tespih = false,
    required this.kazaPrayers,
  });

  AdditionalPrayersTracking copyWith({
    bool? teheccud,
    bool? duha,
    bool? evvabin,
    bool? tespih,
    Map<String, int>? kazaPrayers,
  }) {
    return AdditionalPrayersTracking(
      teheccud: teheccud ?? this.teheccud,
      duha: duha ?? this.duha,
      evvabin: evvabin ?? this.evvabin,
      tespih: tespih ?? this.tespih,
      kazaPrayers: kazaPrayers ?? this.kazaPrayers,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'teheccud': teheccud,
      'duha': duha,
      'evvabin': evvabin,
      'tespih': tespih,
      'kazaPrayers': kazaPrayers,
    };
  }

  factory AdditionalPrayersTracking.fromMap(Map<String, dynamic> map) {
    return AdditionalPrayersTracking(
      teheccud: map['teheccud'] ?? false,
      duha: map['duha'] ?? false,
      evvabin: map['evvabin'] ?? false,
      tespih: map['tespih'] ?? false,
      kazaPrayers: Map<String, int>.from(map['kazaPrayers'] ?? {
        'sabah': 0,
        'öğle': 0,
        'ikindi': 0,
        'akşam': 0,
        'yatsı': 0,
      }),
    );
  }

  factory AdditionalPrayersTracking.empty() => AdditionalPrayersTracking(
    kazaPrayers: {
      'sabah': 0,
      'öğle': 0,
      'ikindi': 0,
      'akşam': 0,
      'yatsı': 0,
    },
  );
}

class DailyPrayerTracking {
  final String id;
  final DateTime date;
  final List<PrayerRecord> prayers;
  final String userId;
  final AdditionalPrayersTracking additionalPrayers;

  DailyPrayerTracking({
    required this.id,
    required this.date,
    required this.prayers,
    required this.userId,
    AdditionalPrayersTracking? additionalPrayers,
  }) : additionalPrayers = additionalPrayers ?? AdditionalPrayersTracking.empty();

  DailyPrayerTracking copyWith({
    String? id,
    DateTime? date,
    List<PrayerRecord>? prayers,
    String? userId,
    AdditionalPrayersTracking? additionalPrayers,
  }) {
    return DailyPrayerTracking(
      id: id ?? this.id,
      date: date ?? this.date,
      prayers: prayers ?? this.prayers,
      userId: userId ?? this.userId,
      additionalPrayers: additionalPrayers ?? this.additionalPrayers,
    );
  }

  // Farz namazların tamamlanma oranı
  double get fardCompletionRate {
    final fardPrayers = prayers.where((p) => p.type == PrayerType.fard).toList();
    if (fardPrayers.isEmpty) return 0.0;
    final completed = fardPrayers.where((p) => p.isCompleted).length;
    return completed / fardPrayers.length;
  }

  // Toplam namaz sayısı
  int get totalPrayerCount => prayers.length;

  // Tamamlanan namaz sayısı
  int get completedPrayerCount => prayers.where((p) => p.isCompleted).length;

  // Farz namaz sayısı
  int get fardPrayerCount => prayers.where((p) => p.type == PrayerType.fard).length;

  // Tamamlanan farz namaz sayısı
  int get completedFardCount => prayers.where((p) => p.type == PrayerType.fard && p.isCompleted).length;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'prayers': prayers.map((p) => p.toMap()).toList(),
      'userId': userId,
      'additionalPrayers': additionalPrayers.toMap(),
    };
  }

  factory DailyPrayerTracking.fromMap(Map<String, dynamic> map) {
    return DailyPrayerTracking(
      id: map['id'] ?? '',
      date: DateTime.parse(map['date']),
      prayers: (map['prayers'] as List<dynamic>?)
          ?.map((p) => PrayerRecord.fromMap(p))
          .toList() ?? [],
      userId: map['userId'] ?? '',
      additionalPrayers: map['additionalPrayers'] != null
          ? AdditionalPrayersTracking.fromMap(map['additionalPrayers'])
          : AdditionalPrayersTracking.empty(),
    );
  }

  // Varsayılan günlük namaz kaydı oluştur
  factory DailyPrayerTracking.createDefault({
    required String userId,
    required DateTime date,
  }) {
    final dateStr = date.toIso8601String().split('T')[0];
    return DailyPrayerTracking(
      id: '${userId}_$dateStr',
      date: date,
      userId: userId,
      prayers: [
        // Farz Namazlar
        PrayerRecord(
          id: 'fajr_$dateStr',
          prayerName: 'Sabah',
          type: PrayerType.fard,
        ),
        PrayerRecord(
          id: 'dhuhr_$dateStr',
          prayerName: 'Öğle',
          type: PrayerType.fard,
        ),
        PrayerRecord(
          id: 'asr_$dateStr',
          prayerName: 'İkindi',
          type: PrayerType.fard,
        ),
        PrayerRecord(
          id: 'maghrib_$dateStr',
          prayerName: 'Akşam',
          type: PrayerType.fard,
        ),
        PrayerRecord(
          id: 'isha_$dateStr',
          prayerName: 'Yatsı',
          type: PrayerType.fard,
        ),
      ],
      additionalPrayers: AdditionalPrayersTracking.empty(),
    );
  }

  // Sünnet namazları seçenekleri (isteğe bağlı eklenebilecek ek sünnet namazlar)
  static List<String> get availableSunnahPrayers => [
    'İstikhare',
    'Tövbe',
    'Şükür',
  ];

  // Sünnet namazı ekle
  void addSunnahPrayer(String sunnahName) {
    final dateStr = date.toIso8601String().split('T')[0];
    final prayerId = '${sunnahName.toLowerCase()}_sunnah_${dateStr}_${DateTime.now().millisecondsSinceEpoch}';
    
    final newPrayer = PrayerRecord(
      id: prayerId,
      prayerName: sunnahName,
      type: PrayerType.sunnah,
      isAdded: true,
    );
    
    prayers.add(newPrayer);
  }
}

class WeeklyPrayerStats {
  final DateTime weekStart;
  final DateTime weekEnd;
  final List<DailyPrayerTracking> dailyRecords;

  WeeklyPrayerStats({
    required this.weekStart,
    required this.weekEnd,
    required this.dailyRecords,
  });

  // Haftalık farz namaz tamamlanma oranı
  double get weeklyFardCompletionRate {
    if (dailyRecords.isEmpty) return 0.0;
    final totalFardCount = dailyRecords.fold(0, (sum, day) => sum + day.fardPrayerCount);
    final completedFardCount = dailyRecords.fold(0, (sum, day) => sum + day.completedFardCount);
    return totalFardCount > 0 ? completedFardCount / totalFardCount : 0.0;
  }

  // Haftalık toplam namaz sayısı
  int get totalPrayerCount => dailyRecords.fold(0, (sum, day) => sum + day.totalPrayerCount);

  // Haftalık tamamlanan namaz sayısı
  int get completedPrayerCount => dailyRecords.fold(0, (sum, day) => sum + day.completedPrayerCount);

  // Haftalık farz namaz sayısı
  int get totalFardCount => dailyRecords.fold(0, (sum, day) => sum + day.fardPrayerCount);

  // Haftalık tamamlanan farz namaz sayısı
  int get completedFardCount => dailyRecords.fold(0, (sum, day) => sum + day.completedFardCount);

  // Günlük ortalama tamamlanma oranı
  double get dailyAverageCompletionRate {
    if (dailyRecords.isEmpty) return 0.0;
    final totalRate = dailyRecords.fold(0.0, (sum, day) => sum + day.fardCompletionRate);
    return totalRate / dailyRecords.length;
  }

  // En iyi gün
  DailyPrayerTracking? get bestDay {
    if (dailyRecords.isEmpty) return null;
    return dailyRecords.reduce((a, b) => 
      a.fardCompletionRate > b.fardCompletionRate ? a : b);
  }

  // En kötü gün
  DailyPrayerTracking? get worstDay {
    if (dailyRecords.isEmpty) return null;
    return dailyRecords.reduce((a, b) => 
      a.fardCompletionRate < b.fardCompletionRate ? a : b);
  }
} 