class AzanSound {
  final String id;
  final String name;
  final String fileName;
  final String reciter;

  const AzanSound({
    required this.id,
    required this.name,
    required this.fileName,
    required this.reciter,
  });

  static const List<AzanSound> allSounds = [
    AzanSound(
      id: 'makkah',
      name: 'Makkah Azan',
      fileName: 'azan_makkah.mp3',
      reciter: 'Sheikh Ali Ahmad Mulla',
    ),
    AzanSound(
      id: 'madinah',
      name: 'Madinah Azan',
      fileName: 'azan_madinah.mp3',
      reciter: 'Sheikh Abdul Rahman Al-Khashoggi',
    ),
    AzanSound(
      id: 'istanbul',
      name: 'Istanbul Azan',
      fileName: 'azan_istanbul.mp3',
      reciter: 'İsmail Coşar',
    ),
    AzanSound(
      id: 'al_aqsa',
      name: 'Al-Aqsa Azan',
      fileName: 'azan_al_aqsa.mp3',
      reciter: 'Sheikh Muhammad Ahmad',
    ),
  ];

  static AzanSound getDefaultSound() => allSounds.first;

  static AzanSound? findById(String id) {
    try {
      return allSounds.firstWhere((sound) => sound.id == id);
    } catch (_) {
      return null;
    }
  }
} 