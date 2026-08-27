import { ArabicTextItem, QuranSurah, DhikrItem, Group } from '../types';

export interface CityLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
  isAutoDetected?: boolean;
}

export const TURKEY_CITIES: CityLocation[] = [
  { name: 'İstanbul', latitude: 41.0082, longitude: 28.9784, country: 'Türkiye' },
  { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, country: 'Türkiye' },
  { name: 'İzmir', latitude: 38.4192, longitude: 27.1287, country: 'Türkiye' },
  { name: 'Bursa', latitude: 40.1885, longitude: 29.0610, country: 'Türkiye' },
  { name: 'Antalya', latitude: 36.8969, longitude: 30.7133, country: 'Türkiye' },
  { name: 'Adana', latitude: 37.0000, longitude: 35.3213, country: 'Türkiye' },
  { name: 'Konya', latitude: 37.8746, longitude: 32.4932, country: 'Türkiye' },
  { name: 'Gaziantep', latitude: 37.0662, longitude: 37.3833, country: 'Türkiye' },
  { name: 'Şanlıurfa', latitude: 37.1674, longitude: 38.7955, country: 'Türkiye' },
  { name: 'Kocaeli', latitude: 40.8533, longitude: 29.8815, country: 'Türkiye' },
  { name: 'Mersin', latitude: 36.8121, longitude: 34.6415, country: 'Türkiye' },
  { name: 'Diyarbakır', latitude: 37.9144, longitude: 40.2306, country: 'Türkiye' },
  { name: 'Hatay', latitude: 36.4018, longitude: 36.3498, country: 'Türkiye' },
  { name: 'Manisa', latitude: 38.6191, longitude: 27.4289, country: 'Türkiye' },
  { name: 'Kayseri', latitude: 38.7205, longitude: 35.4826, country: 'Türkiye' },
  { name: 'Samsun', latitude: 41.2867, longitude: 36.3300, country: 'Türkiye' },
  { name: 'Balıkesir', latitude: 39.6484, longitude: 27.8826, country: 'Türkiye' },
  { name: 'Kahramanmaraş', latitude: 37.5858, longitude: 36.9371, country: 'Türkiye' },
  { name: 'Van', latitude: 38.4891, longitude: 43.4089, country: 'Türkiye' },
  { name: 'Aydın', latitude: 37.8560, longitude: 27.8416, country: 'Türkiye' },
  { name: 'Denizli', latitude: 37.7765, longitude: 29.0864, country: 'Türkiye' },
  { name: 'Sakarya', latitude: 40.7569, longitude: 30.3783, country: 'Türkiye' },
  { name: 'Eskişehir', latitude: 39.7767, longitude: 30.5206, country: 'Türkiye' },
  { name: 'Muğla', latitude: 37.2153, longitude: 28.3636, country: 'Türkiye' },
  { name: 'Trabzon', latitude: 41.0027, longitude: 39.7168, country: 'Türkiye' },
  { name: 'Erzurum', latitude: 39.9055, longitude: 41.2658, country: 'Türkiye' },
  { name: 'Malatya', latitude: 38.3552, longitude: 38.3095, country: 'Türkiye' },
  { name: 'Ordu', latitude: 40.9839, longitude: 37.8764, country: 'Türkiye' },
  { name: 'Afyonkarahisar', latitude: 38.7507, longitude: 30.5567, country: 'Türkiye' },
  { name: 'Sivas', latitude: 39.7477, longitude: 37.0179, country: 'Türkiye' },
  { name: 'Tokat', latitude: 40.3167, longitude: 36.5500, country: 'Türkiye' },
  { name: 'Çanakkale', latitude: 40.1553, longitude: 26.4142, country: 'Türkiye' },
  { name: 'Kütahya', latitude: 39.4167, longitude: 29.9833, country: 'Türkiye' },
  { name: 'Çorum', latitude: 40.5506, longitude: 34.9556, country: 'Türkiye' },
  { name: 'Isparta', latitude: 37.7648, longitude: 30.5566, country: 'Türkiye' },
  { name: 'Rize', latitude: 41.0201, longitude: 40.5234, country: 'Türkiye' },
  { name: 'Elazığ', latitude: 38.6810, longitude: 39.2264, country: 'Türkiye' },
  { name: 'Batman', latitude: 37.8812, longitude: 41.1294, country: 'Türkiye' },
  { name: 'Aksaray', latitude: 38.3687, longitude: 34.0370, country: 'Türkiye' },
  { name: 'Kastamonu', latitude: 41.3887, longitude: 33.7827, country: 'Türkiye' },
  { name: 'Düzce', latitude: 40.8438, longitude: 31.1565, country: 'Türkiye' },
  { name: 'Uşak', latitude: 38.6823, longitude: 29.4082, country: 'Türkiye' },
  { name: 'Zonguldak', latitude: 41.4564, longitude: 31.7987, country: 'Türkiye' },
  { name: 'Osmaniye', latitude: 37.0742, longitude: 36.2472, country: 'Türkiye' },
  { name: 'Yalova', latitude: 40.6500, longitude: 29.2667, country: 'Türkiye' },
  { name: 'Bolu', latitude: 40.7350, longitude: 31.6061, country: 'Türkiye' },
  { name: 'Giresun', latitude: 40.9128, longitude: 38.3895, country: 'Türkiye' },
  { name: 'Karaman', latitude: 37.1759, longitude: 33.2287, country: 'Türkiye' },
  { name: 'Kırıkkale', latitude: 39.8468, longitude: 33.5153, country: 'Türkiye' },
  { name: 'Kars', latitude: 40.6013, longitude: 43.0975, country: 'Türkiye' },
  { name: 'Nevşehir', latitude: 38.6250, longitude: 34.7122, country: 'Türkiye' },
  { name: 'Ağrı', latitude: 39.7191, longitude: 43.0503, country: 'Türkiye' },
  { name: 'Bilecik', latitude: 40.1451, longitude: 29.9799, country: 'Türkiye' },
  { name: 'Edirne', latitude: 41.6772, longitude: 26.5557, country: 'Türkiye' },
  { name: 'Tekirdağ', latitude: 40.9833, longitude: 27.5167, country: 'Türkiye' },
  { name: 'Kırklareli', latitude: 41.7333, longitude: 27.2167, country: 'Türkiye' },
  { name: 'Yozgat', latitude: 39.8181, longitude: 34.8147, country: 'Türkiye' },
  { name: 'Mardin', latitude: 37.3212, longitude: 40.7245, country: 'Türkiye' },
  { name: 'Siirt', latitude: 37.9333, longitude: 41.9500, country: 'Türkiye' },
  { name: 'Sinop', latitude: 42.0231, longitude: 35.1531, country: 'Türkiye' },
  { name: 'Bitlis', latitude: 38.4006, longitude: 42.1095, country: 'Türkiye' },
  { name: 'Muş', latitude: 38.7432, longitude: 41.5064, country: 'Türkiye' },
  { name: 'Bingöl', latitude: 38.8854, longitude: 40.4983, country: 'Türkiye' },
  { name: 'Bayburt', latitude: 40.2552, longitude: 40.2249, country: 'Türkiye' },
  { name: 'Gümüşhane', latitude: 40.4600, longitude: 39.4700, country: 'Türkiye' },
  { name: 'Artvin', latitude: 41.1828, longitude: 41.8183, country: 'Türkiye' },
  { name: 'Amasya', latitude: 40.6500, longitude: 35.8333, country: 'Türkiye' },
  { name: 'Burdur', latitude: 37.7203, longitude: 30.2908, country: 'Türkiye' },
  { name: 'Çankırı', latitude: 40.6013, longitude: 33.6134, country: 'Türkiye' },
  { name: 'Hakkâri', latitude: 37.5833, longitude: 43.7333, country: 'Türkiye' },
  { name: 'Iğdır', latitude: 39.9167, longitude: 44.0333, country: 'Türkiye' },
  { name: 'Karabük', latitude: 41.2061, longitude: 32.6204, country: 'Türkiye' },
  { name: 'Kilis', latitude: 36.7184, longitude: 37.1212, country: 'Türkiye' },
  { name: 'Şırnak', latitude: 37.5164, longitude: 42.4594, country: 'Türkiye' },
  { name: 'Ardahan', latitude: 41.1105, longitude: 42.7022, country: 'Türkiye' },
  { name: 'Bartın', latitude: 41.6344, longitude: 32.3375, country: 'Türkiye' },
  { name: 'Tunceli', latitude: 39.1079, longitude: 39.5401, country: 'Türkiye' },
];

export const WORLD_CITIES: CityLocation[] = [
  // USA (Florida & major hubs)
  { name: 'Wesley Chapel', latitude: 28.1889, longitude: -82.3534, country: 'ABD (Florida)', state: 'Florida' },
  { name: 'Tampa', latitude: 27.9506, longitude: -82.4572, country: 'ABD (Florida)', state: 'Florida' },
  { name: 'Orlando', latitude: 28.5383, longitude: -81.3792, country: 'ABD (Florida)', state: 'Florida' },
  { name: 'Miami', latitude: 25.7617, longitude: -80.1918, country: 'ABD (Florida)', state: 'Florida' },
  { name: 'Jacksonville', latitude: 30.3322, longitude: -81.6557, country: 'ABD (Florida)', state: 'Florida' },
  { name: 'New York', latitude: 40.7128, longitude: -74.0060, country: 'ABD (New York)', state: 'New York' },
  { name: 'Chicago', latitude: 41.8781, longitude: -87.6298, country: 'ABD (Illinois)', state: 'Illinois' },
  { name: 'Houston', latitude: 29.7604, longitude: -95.3698, country: 'ABD (Texas)', state: 'Texas' },
  { name: 'Dallas', latitude: 32.7767, longitude: -96.7970, country: 'ABD (Texas)', state: 'Texas' },
  { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, country: 'ABD (California)', state: 'California' },
  { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194, country: 'ABD (California)', state: 'California' },
  { name: 'Washington D.C.', latitude: 38.9072, longitude: -77.0369, country: 'ABD', state: 'DC' },
  { name: 'Boston', latitude: 42.3601, longitude: -71.0589, country: 'ABD (Massachusetts)', state: 'Massachusetts' },
  { name: 'Atlanta', latitude: 33.7490, longitude: -84.3880, country: 'ABD (Georgia)', state: 'Georgia' },
  { name: 'Toronto', latitude: 43.6532, longitude: -79.3832, country: 'Kanada' },
  { name: 'Montreal', latitude: 45.5017, longitude: -73.5673, country: 'Kanada' },

  // Holy & Islamic Heritage Cities
  { name: 'Mekke-i Mükerreme', latitude: 21.4225, longitude: 39.8262, country: 'Suudi Arabistan' },
  { name: 'Medine-i Münevvere', latitude: 24.4672, longitude: 39.6111, country: 'Suudi Arabistan' },
  { name: 'Kudüs-ü Şerif', latitude: 31.7683, longitude: 35.2137, country: 'Filistin' },
  { name: 'Kahire', latitude: 30.0444, longitude: 31.2357, country: 'Mısır' },
  { name: 'Şam', latitude: 33.5138, longitude: 36.2765, country: 'Suriye' },
  { name: 'Bağdat', latitude: 33.3152, longitude: 44.3661, country: 'Irak' },
  { name: 'Saraybosna', latitude: 43.8563, longitude: 18.4131, country: 'Bosna-Hersek' },
  { name: 'Üsküp', latitude: 41.9981, longitude: 21.4254, country: 'Kuzey Makedonya' },
  { name: 'Semerkant', latitude: 39.6542, longitude: 66.9597, country: 'Özbekistan' },
  { name: 'Buhara', latitude: 39.7747, longitude: 64.4286, country: 'Özbekistan' },
  { name: 'Bakü', latitude: 40.4093, longitude: 49.8671, country: 'Azerbaycan' },
  { name: 'Lefkoşa', latitude: 35.1856, longitude: 33.3823, country: 'KKTC' },

  // Europe & World
  { name: 'Berlin', latitude: 52.5200, longitude: 13.4050, country: 'Almanya' },
  { name: 'Köln', latitude: 50.9375, longitude: 6.9603, country: 'Almanya' },
  { name: 'Frankfurt', latitude: 50.1109, longitude: 8.6821, country: 'Almanya' },
  { name: 'Londra', latitude: 51.5074, longitude: -0.1278, country: 'İngiltere' },
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'Fransa' },
  { name: 'Amsterdam', latitude: 52.3676, longitude: 4.9041, country: 'Hollanda' },
  { name: 'Viyana', latitude: 48.2082, longitude: 16.3738, country: 'Avusturya' },
  { name: 'Zürih', latitude: 47.3769, longitude: 8.5417, country: 'İsviçre' },
  { name: 'Brüksel', latitude: 50.8503, longitude: 4.3517, country: 'Belçika' },
  { name: 'Stockholm', latitude: 59.3293, longitude: 18.0686, country: 'İsveç' },
  { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, country: 'Japonya' },
  { name: 'Sidney', latitude: -33.8688, longitude: 151.2093, country: 'Avustralya' },
  { name: 'Dubai', latitude: 25.2048, longitude: 55.2708, country: 'BAE' },
  { name: 'Doha', latitude: 25.2854, longitude: 51.5310, country: 'Katar' },
  { name: 'Kuala Lumpur', latitude: 3.1390, longitude: 101.6869, country: 'Malezya' },
  { name: 'Cakarta', latitude: -6.2088, longitude: 106.8456, country: 'Endonezya' },
];

export const QURAN_SURAHS: QuranSurah[] = [
  { number: 1, name: 'الفاتحة', englishName: 'Al-Faatiha', englishNameTranslation: 'Fâtiha', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'البقرة', englishName: 'Al-Baqara', englishNameTranslation: 'Bakara', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'آل عمران', englishName: 'Aal-i-Imraan', englishNameTranslation: 'Âl-i İmrân', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'النساء', englishName: 'An-Nisaa', englishNameTranslation: 'Nisâ', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 18, name: 'الكهف', englishName: 'Al-Kahf', englishNameTranslation: 'Kehf', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 36, name: 'يس', englishName: 'Yaseen', englishNameTranslation: 'Yâsîn', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 48, name: 'الفتح', englishName: 'Al-Fath', englishNameTranslation: 'Fetih', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 55, name: 'الرحمن', englishName: 'Ar-Rahmaan', englishNameTranslation: 'Rahmân', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: 'الواقعة', englishName: 'Al-Waaqia', englishNameTranslation: 'Vâkıa', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 67, name: 'الملك', englishName: 'Al-Mulk', englishNameTranslation: 'Mülk (Tebâreke)', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 78, name: 'النبأ', englishName: 'An-Naba', englishNameTranslation: 'Nebe (Amme)', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 93, name: 'الضحى', englishName: 'Ad-Dhuhaa', englishNameTranslation: 'Duhâ', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'الشرح', englishName: 'Ash-Sharh', englishNameTranslation: 'İnşirah', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 97, name: 'القدر', englishName: 'Al-Qadr', englishNameTranslation: 'Kadir', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', englishNameTranslation: 'Kevser', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'الكافرون', englishName: 'Al-Kaafiroon', englishNameTranslation: 'Kâfirûn', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'النصر', englishName: 'An-Nasr', englishNameTranslation: 'Nasr', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlaas', englishNameTranslation: 'İhlâs', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'الفلق', englishName: 'Al-Falaq', englishNameTranslation: 'Felak', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'الناس', englishName: 'An-Naas', englishNameTranslation: 'Nâs', numberOfAyahs: 6, revelationType: 'Meccan' },
];

export const ARABIC_TEXTS: ArabicTextItem[] = [
  {
    id: 'cevsen',
    title: 'Cevşen-ül Kebîr',
    arabicTitle: 'الجَوْشَنُ الكَبِير',
    type: 'cevsen',
    description: 'Peygamber Efendimiz\'e (s.a.v) Cebrail (a.s) vasıtasıyla vahyedilen, 100 bab ve 1001 İlahi İsmi ihtiva eden muazzam manevi zırh.',
    countTarget: 20,
    verses: [
      {
        number: 1,
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n(١) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا اللَّهُ، يَا رَحْمَٰنُ، يَا رَحِيمُ، يَا كَرِيمُ، يَا مُقِيمُ، يَا عَظِيمُ، يَا قَدِيمُ، يَا عَلِيمُ، يَا حَلِيمُ، يَا حَكِيمُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: 'Bismillâhirrahmânirrahîm\n(1) Allâhümme innî es\'elüke bismike: Yâ Allâh, Yâ Rahmân, Yâ Rahîm, Yâ Kerîm, Yâ Mukîm, Yâ Azîm, Yâ Kadîm, Yâ Alîm, Yâ Halîm, Yâ Hakîm.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: 'Rahmân ve Rahîm olan Allah\'ın adıyla.\n(1) Allah\'ım! Şu güzel isimlerinin hakkı için Senden istiyorum: Ey Allah, ey Rahmân, ey Rahîm, ey Kerîm, ey her şeyi ayakta tutan Mukîm, ey Azîm, ey ezeli Kadîm, ey her şeyi bilen Alîm, ey yumuşak muamele eden Halîm, ey her işi hikmetli Hakîm!\nBütün kusurlardan münezzehsin, Senden başka ilah yoktur. İmdat! İmdat! Bizi cehennem ateşinden kurtar!',
      },
      {
        number: 2,
        arabic: '(٢) يَا سَيِّدَ السَّادَاتِ، يَا مُجِيبَ الدَّعَوَاتِ، يَا رَافِعَ الدَّرَجَاتِ، يَا وَلِيَّ الْحَسَنَاتِ، يَا غَافِرَ الْخَطِيئَاتِ، يَا مُعْطِيَ الْمَسْأَلَاتِ، يَا قَابِلَ التَّوْبَاتِ، يَا سَامِعَ الْأَصْوَاتِ، يَا عَالِمَ الْخَفِيَّاتِ، يَا دَافِعَ الْبَلِيَّاتِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(2) Yâ Seyyide\'s-sâdât, Yâ Mucîbe\'d-da\'avât, Yâ Râfia\'d-deracât, Yâ Veliye\'l-hasenât, Yâ Gâfire\'l-hatîât, Yâ Mu\'tiye\'l-mes\'elât, Yâ Kâbile\'t-tevbât, Yâ Sâmia\'l-asvât, Yâ Âlime\'l-hafiyyât, Yâ Dâfia\'l-beliyyât.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(2) Ey efendiler efendisi, ey dualara icabet eden, ey dereceleri yükselten, ey iyiliklerin sahibi, ey günahları bağışlayan, ey dilekleri ihsan eden, ey tevbeleri kabul eden, ey sesleri işiten, ey gizlilikleri bilen, ey belaları defeden Rabbimiz! Bizi cehennemden kurtar!',
      },
      {
        number: 3,
        arabic: '(٣) يَا خَيْرَ الْغَافِرِينَ، يَا خَيْرَ الْفَاتِحِينَ، يَا خَيْرَ النَّاصِرِينَ، يَا خَيْرَ الْحَاكِمِينَ، يَا خَيْرَ الرَّازِقِينَ، يَا خَيْرَ الْوَارِثِينَ، يَا خَيْرَ الْحَامِدِينَ، يَا خَيْرَ الذَّاكِرِينَ، يَا خَيْرَ الْمُنْزِلِينَ، يَا خَيْرَ الْمُحْسِنِينَ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(3) Yâ Hayra\'l-gâfirîn, Yâ Hayra\'l-fâtihîn, Yâ Hayra\'n-nâsırîn, Yâ Hayra\'l-hâkimîn, Yâ Hayra\'r-râzikîn, Yâ Hayra\'l-vârisîn, Yâ Hayra\'l-hâmidîn, Yâ Hayra\'z-zâkirîn, Yâ Hayra\'l-münzilîn, Yâ Hayra\'l-muhsinîn.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(3) Ey bağışlayanların en hayırlısı, ey fetih kapılarını açanların en hayırlısı, ey yardım edenlerin en hayırlısı, ey hüküm verenlerin en hayırlısı, ey rızık verenlerin en hayırlısı, ey varislerin en hayırlısı, ey övenlerin en hayırlısı, ey zikredenlerin en hayırlısı, ey ikramda bulunanların en hayırlısı, ey ihsan edenlerin en hayırlısı!\nBizi cehennemden kurtar!',
      },
      {
        number: 4,
        arabic: '(٤) يَا مَنْ لَهُ الْعِزَّةُ وَالْجَمَالُ، يَا مَنْ لَهُ الْقُدْرَةُ وَالْكَمَالُ، يَا مَنْ لَهُ الْمُلْكُ وَالْجَلَالُ، يَا مَنْ هُوَ الْكَبِيرُ الْمُتَعَالِ، يَا مُنْشِئَ السَّحَابِ الثِّقَالِ، يَا مَنْ هُوَ شَدِيدُ الْمِحَالِ، يَا مَنْ هُوَ سَرِيعُ الْحِسَابِ، يَا مَنْ هُوَ شَدِيدُ الْعِقَابِ، يَا مَنْ عِنْدَهُ حُسْنُ الثَّوَابِ، يَا مَنْ عِنْدَهُ أُمُّ الْكِتَابِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(4) Yâ men lehu\'l-izzetü ve\'l-cemâl, Yâ men lehu\'l-kudretü ve\'l-kemâl, Yâ men lehu\'l-mülkü ve\'l-celâl, Yâ men hüve\'l-kebîru\'l-müte\'âl, Yâ münşie\'s-sehâbi\'s-sikâl, Yâ men hüve şedîdü\'l-mihâl, Yâ men hüve serîu\'l-hisâb, Yâ men hüve şedîdü\'l-ikâb, Yâ men indehû husnü\'s-sevâb, Yâ men indehû ümmü\'l-kitâb.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(4) Ey izzet ve cemal sahibi, ey kudret ve kemal sahibi, ey mülk ve celal sahibi, ey pek yüce ve ulu olan, ey yağmur yüklü bulutları yaratan, ey cezalandırması çetin olan, ey hesabı çarçabuk gören, ey azabı şiddetli olan, ey katında güzel mükâfatlar bulunan, ey Ana Kitap katında olan Rabbimiz!\nBizi cehennemden kurtar!',
      },
      {
        number: 5,
        arabic: '(٥) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا حَنَّانُ، يَا مَنَّانُ، يَا دَيَّانُ، يَا بُرْهَانُ، يَا سُلْطَانُ، يَا رِضْوَانُ، يَا غُفْرَانُ، يَا سُبْحَانُ، يَا مُسْتَعَانُ، يَا ذَا الْمَنِّ وَالْبَيَانِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(5) Allâhümme innî es\'elüke bismike: Yâ Hannân, Yâ Mennân, Yâ Deyyân, Yâ Bürhân, Yâ Sultân, Yâ Rıdvân, Yâ Gufrân, Yâ Sübhân, Yâ Müste\'ân, Yâ Ze\'l-menni ve\'l-beyân.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(5) Allah\'ım! Şu isimlerinin hakkı için Senden istiyorum: Ey çok şefkatli Hannân, ey bol nimet veren Mennân, ey amellerin karşılığını eksiksiz veren Deyyân, ey varlığı apaçık delil olan Bürhân, ey mutlak hâkim Sultân, ey rızasına erilen Rıdvân, ey bağışlayan Gufrân, ey noksanlıklardan pak olan Sübhân, ey kendisinden yardım dilenen Müsteân, ey lütuf ve beyan sahibi!\nBizi cehennemden kurtar!',
      },
      {
        number: 6,
        arabic: '(٦) يَا مَنْ تَوَاضَعَ كُلُّ شَيْءٍ لِعَظَمَتِهِ، يَا مَنِ اسْتَسْلَمَ كُلُّ شَيْءٍ لِقُدْرَتِهِ، يَا مَنْ ذَلَّ كُلُّ شَيْءٍ لِعِزَّتِهِ، يَا مَنْ خَضَعَ كُلُّ شَيْءٍ لِهَيْبَتِهِ، يَا مَنِ انْقَادَ كُلُّ شَيْءٍ مِنْ خَشْيَتِهِ، يَا مَنْ تَشَقَّقَتِ الْجِبَالُ مِنْ مَخَافَتِهِ، يَا مَنْ قَامَتِ السَّمَاوَاتُ بِأَمْرِهِ، يَا مَنِ اسْتَقَرَّتِ الْأَرَضُونَ بِإِذْنِهِ، يَا مَنْ يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ، يَا مَنْ لَا يَعْتَدِي عَلَىٰ أَهْلِ مَمْلَكَتِهِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(6) Yâ men tevâdaa küllü şey\'in li-azametih, Yâ meni\'stesleme küllü şey\'in li-kudretih, Yâ men zelle küllü şey\'in li-izzetih, Yâ men hadaa küllü şey\'in li-heybetih, Yâ meni\'nkâde küllü şey\'in min haşyetih, Yâ men teşakkatı\'l-cibâlü min mehâfetih, Yâ men kâmeti\'s-semâvâtü bi-emrih, Yâ meni\'stekarretı\'l-aradûne bi-iznih, Yâ men yüsebbihu\'r-ra\'dü bi-hamdih, Yâ men lâ ya\'tedî alâ ehli memleketih.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(6) Ey azameti karşısında her şeyin boyun eğdiği, ey kudretine her şeyin teslim olduğu, ey izzeti önünde her şeyin küçüldüğü, ey heybetine her şeyin itaat ettiği, ey heybetinden dağların yarıldığı, ey emriyle göklerin ayakta durduğu, ey izniyle yerin sükûnet bulduğu, ey gök gürültüsünün hamd ile tesbih ettiği, ey memleketinin ahalisine asla zulmetmeyen Rabbimiz!\nBizi cehennemden kurtar!',
      },
      {
        number: 7,
        arabic: '(٧) يَا غَافِرَ الْخَطَايَا، يَا كَاشِفَ الْبَلَايَا، يَا مُنْتَهَى الرَّجَايَا، يَا مُجْزِلَ الْعَطَايَا، يَا وَاسِعَ الْهَدَايَا، يَا رَازِقَ الْبَرَايَا، يَا قَاضِيَ الْمَنَايَا، يَا سَامِعَ الشَّكَايَا، يَا بَاعِثَ السَّرَايَا، يَا مُطْلِقَ الْأُسَارَىٰ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(7) Yâ Gâfire\'l-hatâyâ, Yâ Kâşife\'l-belâyâ, Yâ Müntehe\'r-recâyâ, Yâ Muczile\'l-atâyâ, Yâ Vâsia\'l-hedâyâ, Yâ Râzika\'l-berâyâ, Yâ Kâdiye\'l-menâyâ, Yâ Sâmia\'ş-şekâyâ, Yâ Bâise\'s-serâyâ, Yâ Mutlika\'l-üsârâ.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(7) Ey günahları bağışlayan, ey belaları defeden, ey umutların son durağı, ey bol bol ihsanda bulunan, ey hediyeleri pek geniş olan, ey mahlûkatı rızıklandıran, ey ecelleri takdir eden, ey şikâyetleri işiten, ey esirleri hürriyetine kavuşturan Rabbimiz!\nBizi cehennemden kurtar!',
      },
      {
        number: 8,
        arabic: '(٨) يَا ذَا الْحَمْدِ وَالثَّنَاءِ، يَا ذَا الْفَخْرِ وَالْبَهَاءِ، يَا ذَا الْمَجْدِ وَالسَّنَاءِ، يَا ذَا الْعَهْدِ وَالْوَفَاءِ، يَا ذَا الْعَفْوِ وَالرِّضَاءِ، يَا ذَا الْمَنِّ وَالْعَطَاءِ، يَا ذَا الْفَصْلِ وَالْقَضَاءِ، يَا ذَا الْعِزِّ وَالْبَقَاءِ، يَا ذَا الْجُودِ وَالسَّخَاءِ، يَا ذَا الْآلَاءِ وَالنَّعْمَاءِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(8) Yâ Ze\'l-hamdi ve\'s-senâ\', Yâ Ze\'l-fahri ve\'l-behâ\', Yâ Ze\'l-mecdi ve\'s-senâ\', Yâ Ze\'l-ahdi ve\'l-vefâ\', Yâ Ze\'l-afvi ve\'r-rıdâ\', Yâ Ze\'l-menni ve\'l-atâ\', Yâ Ze\'l-fasli ve\'l-kadâ\', Yâ Ze\'l-ızzi ve\'l-bekâ\', Yâ Ze\'l-cûdi ve\'s-sehâ\', Yâ Ze\'l-âlâi ve\'n-na\'mâ\'.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(8) Ey hamd ve övgünün sahibi, ey şan ve güzelliğin sahibi, ey şeref ve yüceliğin sahibi, ey ahit ve vefanın sahibi, ey af ve rızanın sahibi, ey lütuf ve ihsanın sahibi, ey kesin hüküm ve kazanın sahibi, ey izzet ve bekânın sahibi, ey cömertlik ve keremin sahibi, ey sonsuz nimetlerin sahibi!\nBizi cehennemden kurtar!',
      },
      {
        number: 9,
        arabic: '(٩) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا مَانِعُ، يَا دَافِعُ، يَا نَافِعُ، يَا سَامِعُ، يَا رَافِعُ، يَا صَانِعُ، يَا شَافِعُ، يَا جَامِعُ، يَا وَاسِعُ، يَا مُوَسِّعُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(9) Allâhümme innî es\'elüke bismike: Yâ Mâni\', Yâ Dâfi\', Yâ Nâfi\', Yâ Sâmi\', Yâ Râfi\', Yâ Sâni\', Yâ Şâfi\', Yâ Câmi\', Yâ Vâsi\', Yâ Muvassi\'.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(9) Allah\'ım! Şu isimlerinin hakkı için Senden istiyorum: Ey dilediğine engel olan Mâni, ey zararları defeden Dâfi, ey menfaatler veren Nâfi, ey her şeyi işiten Sâmi, ey dereceleri yükselten Râfi, ey sanatla yaratan Sâni, ey şefaat eden Şâfi, ey toplayan Câmi, ey rahmeti geniş olan Vâsi, ey rızkı bollaştıran Muvassi!\nBizi cehennemden kurtar!',
      },
      {
        number: 10,
        arabic: '(١٠) يَا صَانِعَ كُلِّ مَصْنُوعٍ، يَا خَالِقَ كُلِّ مَخْلُوقٍ، يَا رَازِقَ كُلِّ مَرْزُوقٍ، يَا مَالِكَ كُلِّ مَمْلُوكٍ، يَا كَاشِفَ كُلِّ مَكْرُوبٍ، يَا فَارِجَ كُلِّ مَهْمُومٍ، يَا رَاحِمَ كُلِّ مَرْحُومٍ، يَا نَاصِرَ كُلِّ مَخْذُولٍ، يَا سَاتِرَ كُلِّ مَعْيُوبٍ، يَا مَلْجَأَ كُلِّ مَطْرُودٍ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
        turkish: '(10) Yâ Sânia külli masnû\', Yâ Hâlika külli mahlûk, Yâ Râzıka külli merzûk, Yâ Mâlike külli memlûk, Yâ Kâşife külli mekrûb, Yâ Fârice külli mehmûm, Yâ Râhime külli merhûm, Yâ Nâsıra külli mahzûl, Yâ Sâtira külli ma\'yûb, Yâ Melcee külli matrûd.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
        meaning: '(10) Ey yapılan her şeyin sanatkârı, ey yaratılan her varlığın yaratıcısı, ey rızıklanan her canlının rızık vericisi, ey sahip olunan her şeyin gerçek maliki, ey kederlilerin kederini açan, ey gamlıların gamını dağıtan, ey merhamete muhtaç olanlara acıyan, ey yalnız bırakılanlara yardım eden, ey ayıpları örten, ey sığınağımız Rabbimiz!\nBizi cehennemden kurtar!',
      },
      {
        number: 100,
        arabic: '(١٠٠) يَا حَلِيمًا لَا يَعْجَلُ، يَا جَوَادًا لَا يَبْخَلُ، يَا صَادِقًا لَا يُخْلِفُ، يَا وَهَّابًا لَا يَمَلُّ، يَا قَاهِرًا لَا يُغْلَبُ، يَا عَظِيمًا لَا يُوصَفُ، يَا عَدْلًا لَا يَحِيفُ، يَا غَنِيًّا لَا يَفْتَقِرُ، يَا كَبِيرًا لَا يَصْغُرُ، يَا حَافِظًا لَا يَغْفُلُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَخَلِّصْنَا مِنَ النَّارِ، يَا مُجِيرُ أَجِرْنَا مِنَ النَّارِ، وَأَدْخِلْنَا الْجَنَّةَ مَعَ الْأَبْرَارِ',
        turkish: '(100) Yâ Halîmen lâ ya\'cel, Yâ Cevâden lâ yebhal, Yâ Sâdikan lâ yuhlif, Yâ Vehhâben lâ yemell, Yâ Kâhiran lâ yugleb, Yâ Azîmen lâ yûsaf, Yâ Adlen lâ yehîf, Yâ Ganiyyen lâ yeftekır, Yâ Kebîran lâ yasgur, Yâ Hâfizan lâ yagfül.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs salli alâ Muhammedin ve âli Muhammed ve hallisnâ mine\'n-nâr, yâ Mücîr ecirnâ mine\'n-nâr, ve edhılne\'l-cennete mea\'l-ebrâr.',
        meaning: '(100) Ey cezalandırmada acele etmeyen Halîm, ey asla cimrilik etmeyen Cevâd, ey vaadinden dönmeyen Sâdık, ey vermekten usanmayan Vehhâb, ey asla mağlup olmayan Kâhir, ey vasfedilemeyecek kadar yüce Azîm, ey asla haksızlık etmeyen Âdil, ey hiçbir şeye muhtaç olmayan Ganî, ey büyüklüğü eksilmeyen Kebîr, ey asla gaflete düşmeyen Hâfız!\nBütün kusurlardan münezzehsin, Senden başka ilah yoktur. İmdat! İmdat! Efendimiz Muhammed\'e ve âline salât eyle, bizi cehennem ateşinden kurtar. Ey koruyup sığınak olan Allah\'ım, bizi ateşten koru ve bizi iyilerle beraber Cennetine idhal eyle!',
      },
    ],
  },
  {
    id: 'tefriciye',
    title: 'Salât-ı Tefriciye (Nâriye)',
    arabicTitle: 'الصَّلَاةُ التَّفْرِيجِيَّة',
    type: 'tefriciye',
    description: 'Sıkıntıların giderilmesi, hayırlı dileklerin kabulü ve kederlerin dağılması için meşhur 4.444 defa okunan faziletli salavat-ı şerife.',
    countTarget: 4444,
    verses: [
      {
        number: 1,
        arabic: 'اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَىٰ سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ وَتُقْضَىٰ بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِمِ وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ وَعَلَىٰ آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ',
        turkish: 'Allâhümme salli salâten kâmileten ve sellim selâmen tâmmen alâ seyyidinâ Muhammedinillezî tenhallü bihil ukadü ve tenfericü bihil kürabü ve tükdâ bihil havâicü ve tünâlü bihir ragâibü ve hüsnül havâtimi ve yüsteskalgamâmü bi vechihil kerîmi ve alâ âlihî ve sahbihî fî külli lemhatin ve nefesin bi adedi külli ma\'lûmin lek.',
        meaning: 'Allah\'ım! Efendimiz Muhammed\'e kusursuz bir salât ve eksiksiz bir selâm eyle ki; O\'nun hürmetine düğümler çözülür, sıkıntılar dağılır, ihtiyaçlar karşılanır, arzulara ve güzel sonlara ulaşılır. O\'nun mübarek yüzü hürmetine bulutlardan yağmur istenir. O\'nun âline ve ashâbına da her an ve nefeste, Senin bildiğin varlıklar sayısınca salât ve selâm olsun.',
        virtue: 'Büyük İslam alimleri ve evliyalar, mühim bir maksadın hasıl olması veya bir felaketin defi için 4444 kere okunmasını tavsiye etmişlerdir.'
      }
    ]
  }
];

export const POPULAR_DHIKRS = [
  { id: '1', name: 'Sübhânallâh', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Allah her türlü noksanlıktan münezzehtir', targetCount: 33, virtue: 'Her farz namazdan sonra 33 defa okunması sünnettir.' },
  { id: '2', name: 'Elhamdülillâh', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Hamd ve övgü yalnızca Allah\'a mahsustur', targetCount: 33, virtue: 'Mizanı dolduran en faziletli şükür zikridir.' },
  { id: '3', name: 'Allâhu Ekber', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah en büyüktür', targetCount: 33, virtue: 'Göklerle yer arasını dolduracak kadar sevap kazandırır.' },
  { id: '4', name: 'Lâ ilâhe illallâh', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: 'Allah\'tan başka ilah yoktur', targetCount: 100, virtue: 'Zikrin en faziletlisi \'Lâ ilâhe illallah\'tır.' },
  { id: '5', name: 'Estağfirullâhel Azîm', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ', meaning: 'Yüce Allah\'tan bağışlanma dilerim', targetCount: 100, virtue: 'Sıkıntıların defi ve rızkın bereketi için tavsiye edilmiştir.' },
  { id: '6', name: 'Salavat-ı Şerife', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Allah\'ım, Efendimiz Muhammed\'e salât ve selâm eyle', targetCount: 100, virtue: 'Bana bir salavat getirene Allah on rahmet eder.' },
  { id: '7', name: 'Hasbünallâh ve Ni\'mel Vekîl', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', meaning: 'Allah bize yeter, O ne güzel vekildir', targetCount: 100, virtue: 'İbrahim (a.s) ateşe atılırken bu zikri söylemiştir.' },
  { id: '8', name: 'Lâ havle ve lâ kuvvete illâ billâh', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning: 'Güç ve kuvvet ancak Allah\'tandır', targetCount: 100, virtue: 'Cennet hazinelerinden bir hazinedir.' },
];

export const INITIAL_DHIKRS: DhikrItem[] = [
  { id: '1', arabic: 'سُبْحَانَ اللَّهِ', title: 'Sübhânallâh', meaning: 'Allah her türlü noksanlıktan münezzehtir', target: 33, count: 0 },
  { id: '2', arabic: 'الْحَمْدُ لِلَّهِ', title: 'Elhamdülillâh', meaning: 'Hamd ve övgü yalnızca Allah\'a aittir', target: 33, count: 0 },
  { id: '3', arabic: 'اللَّهُ أَكْبَرُ', title: 'Allâhu Ekber', meaning: 'Allah en büyüktür', target: 33, count: 0 },
  { id: '4', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', title: 'Lâ ilâhe illallâh', meaning: 'Allah\'tan başka ilah yoktur', target: 100, count: 0 },
  { id: '5', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ', title: 'Estağfirullâhel Azîm', meaning: 'Yüce Allah\'tan bağışlanma dilerim', target: 100, count: 0 },
  { id: '6', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', title: 'Salavat-ı Şerife', meaning: 'Allah\'ım, Efendimiz Muhammed\'e salât eyle', target: 100, count: 0 },
  { id: '7', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', title: 'Hasbünallâh ve Ni\'mel Vekîl', meaning: 'Allah bize yeter, O ne güzel vekildir', target: 100, count: 0 },
  { id: '8', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', title: 'Lâ havle ve lâ kuvvete illâ billâh', meaning: 'Güç ve kuvvet ancak Allah\'tandır', target: 100, count: 0 },
];

export const DAILY_HADITHS = [
  {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    turkish: 'Ameller ancak niyetlere göredir ve herkes için niyet ettiği şey vardır.',
    source: 'Buhârî, Bed\'ü\'l-Vahy, 1; Müslim, İmâre, 155',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    turkish: 'Sizin en hayırlınız, Kur\'an\'ı öğrenen ve öğreteninizdir.',
    source: 'Buhârî, Fezâilü\'l-Kur\'ân, 21',
  },
  {
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    turkish: 'Allah katında amellerin en sevimlisi, az da olsa devamlı olanıdır.',
    source: 'Buhârî, Rikâk, 18; Müslim, Müsâfirîn, 218',
  },
  {
    arabic: 'مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ',
    turkish: 'Bir hayra vesile olan kimse, o hayrı bizzat işlemiş gibi ecir ve sevap kazanır.',
    source: 'Müslim, İmâre, 133; Tirmizî, İlim, 14',
  },
  {
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    turkish: 'Dua, ibadetin ta kendisidir.',
    source: 'Tirmizî, Tefsîr, 2; Ebû Dâvûd, Vitr, 23',
  },
];

export const SAMPLE_GROUPS: Group[] = [
  {
    id: 'grp-1',
    title: 'Ramazan-ı Şerif Hatm-i Kebîr',
    description: 'Birlik ve beraberlik içinde Kur\'an-ı Kerim\'i 30 cüz paylaşarak hatmediyoruz.',
    creatorId: 'user-admin',
    creatorUsername: '@ahmet_faruk',
    type: 'hatim',
    targetCount: 30,
    currentProgress: 18,
    isPrivate: false,
    inviteCode: 'HATIM30TR',
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    membersCount: 14,
    tasks: Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      const isMyCuz = idx === 1 || idx === 2 || idx === 3 || idx === 4;
      const isCompleted = idx <= 12;
      const isAssigned = idx <= 18;
      return {
        id: `task-hatim-1-${idx}`,
        groupId: 'grp-1',
        taskIndex: idx,
        title: `${idx}. Cüz`,
        description: `Kur'an-ı Kerim ${idx}. Cüz Tilaveti`,
        status: isCompleted ? 'completed' : isAssigned ? 'assigned' : 'available',
        assignedTo: isMyCuz ? 'current-user' : isAssigned ? `user-${idx}` : undefined,
        assignedToUsername: isMyCuz ? '@siz' : isAssigned ? `@kardes_${idx}` : undefined,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
    }),
  },
  {
    id: 'grp-1b',
    title: 'Cuma Gecesi Hatm-i Şerifi',
    description: 'Her Cuma gecesi duası yapılmak üzere okunan müşterek Hatm-i Şerif halkamız.',
    creatorId: 'user-2',
    creatorUsername: '@mehmet_salih',
    type: 'hatim',
    targetCount: 30,
    currentProgress: 15,
    isPrivate: false,
    inviteCode: 'CUMAHATIM',
    isActive: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    membersCount: 11,
    tasks: Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      const isMyCuz = idx === 10 || idx === 11 || idx === 12;
      const isCompleted = idx <= 10;
      const isAssigned = idx <= 20;
      return {
        id: `task-hatim-2-${idx}`,
        groupId: 'grp-1b',
        taskIndex: idx,
        title: `${idx}. Cüz`,
        description: `Kur'an-ı Kerim ${idx}. Cüz Tilaveti`,
        status: isCompleted ? 'completed' : isAssigned ? 'assigned' : 'available',
        assignedTo: isMyCuz ? 'current-user' : isAssigned ? `user-${idx}` : undefined,
        assignedToUsername: isMyCuz ? '@siz' : isAssigned ? `@kardes_${idx}` : undefined,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
    }),
  },
  {
    id: 'grp-1c',
    title: 'Şühedâ & Geçmişlerimiz Hatm-i Şerifi',
    description: 'Aziz şehitlerimiz ve ebediyete irtihal etmiş geçmişlerimizin ruhlarına ithafen okunan hatim.',
    creatorId: 'user-6',
    creatorUsername: '@zeynep_h',
    type: 'hatim',
    targetCount: 30,
    currentProgress: 14,
    isPrivate: false,
    inviteCode: 'SUHEDAHATIM',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    membersCount: 9,
    tasks: Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      const isMyCuz = idx === 28 || idx === 29 || idx === 30;
      const isCompleted = idx === 28 || idx <= 10;
      const isAssigned = idx >= 28 || idx <= 16;
      return {
        id: `task-hatim-3-${idx}`,
        groupId: 'grp-1c',
        taskIndex: idx,
        title: `${idx}. Cüz`,
        description: `Kur'an-ı Kerim ${idx}. Cüz Tilaveti`,
        status: isCompleted ? 'completed' : isAssigned ? 'assigned' : 'available',
        assignedTo: isMyCuz ? 'current-user' : isAssigned ? `user-${idx}` : undefined,
        assignedToUsername: isMyCuz ? '@siz' : isAssigned ? `@kardes_${idx}` : undefined,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
    }),
  },
  {
    id: 'grp-2',
    title: '4.444 Salât-ı Tefriciye Duası',
    description: 'Zorlukların kolaylaşması, şifa ve hayırlı kapıların açılması niyetiyle 4444 Tefriciye halkası.',
    creatorId: 'user-2',
    creatorUsername: '@mehmet_salih',
    type: 'tefriciye',
    targetCount: 4444,
    currentProgress: 2650,
    isPrivate: false,
    inviteCode: 'TEFRIC4444',
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    membersCount: 22,
    numberedAssignments: [
      { id: 'num-1', groupId: 'grp-2', userId: 'current-user', userUsername: '@siz', assignedCount: 200, completedCount: 150, isCompleted: false, assignedAt: new Date().toISOString() },
      { id: 'num-2', groupId: 'grp-2', userId: 'user-3', userUsername: '@omer_faruk', assignedCount: 500, completedCount: 500, isCompleted: true, assignedAt: new Date().toISOString() },
      { id: 'num-3', groupId: 'grp-2', userId: 'user-4', userUsername: '@mustafa_can', assignedCount: 1000, completedCount: 1000, isCompleted: true, assignedAt: new Date().toISOString() },
      { id: 'num-4', groupId: 'grp-2', userId: 'user-5', userUsername: '@ali_riza', assignedCount: 1000, completedCount: 1000, isCompleted: true, assignedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'grp-3',
    title: '1.000 İhlâs-ı Şerif Kardeşliği',
    description: 'Cuma gecesi hürmetine 1000 İhlas-ı Şerif okuma halkamız.',
    creatorId: 'user-6',
    creatorUsername: '@zeynep_h',
    type: '1000_ihlas',
    targetCount: 1000,
    currentProgress: 750,
    isPrivate: false,
    inviteCode: 'IHLAS1000K',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    membersCount: 8,
    numberedAssignments: [
      { id: 'num-ih-1', groupId: 'grp-3', userId: 'current-user', userUsername: '@siz', assignedCount: 100, completedCount: 100, isCompleted: true, assignedAt: new Date().toISOString() },
      { id: 'num-ih-2', groupId: 'grp-3', userId: 'user-7', userUsername: '@fatma_nur', assignedCount: 250, completedCount: 250, isCompleted: true, assignedAt: new Date().toISOString() },
      { id: 'num-ih-3', groupId: 'grp-3', userId: 'user-8', userUsername: '@hacer_k', assignedCount: 400, completedCount: 400, isCompleted: true, assignedAt: new Date().toISOString() },
    ]
  },
  {
    id: 'grp-4',
    title: 'Haftalık Cevşen-ül Kebîr Taksimi',
    description: 'Cevşen-ül Kebir 20 bölüme ayrılarak paylaşılmaktadır (her bölüm 5 bab).',
    creatorId: 'user-9',
    creatorUsername: '@huseyin_avni',
    type: 'cevsen',
    targetCount: 20,
    currentProgress: 14,
    isPrivate: false,
    inviteCode: 'CEVSEN20TR',
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    membersCount: 12,
    tasks: Array.from({ length: 20 }, (_, i) => {
      const idx = i + 1;
      const isAssigned = idx <= 14;
      const isCompleted = idx <= 10;
      const startBab = (idx - 1) * 5 + 1;
      const endBab = idx * 5;
      return {
        id: `task-cevsen-${idx}`,
        groupId: 'grp-4',
        taskIndex: idx,
        title: `${idx}. Bölüm (Bab ${startBab}-${endBab})`,
        description: `Cevşen ${startBab} ile ${endBab}. Bablar arası`,
        status: isCompleted ? 'completed' : isAssigned ? 'assigned' : 'available',
        assignedTo: isAssigned ? (idx === 2 ? 'current-user' : `user-${idx}`) : undefined,
        assignedToUsername: isAssigned ? (idx === 2 ? '@siz' : `@kardes_${idx}`) : undefined,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
    }),
  }
];
