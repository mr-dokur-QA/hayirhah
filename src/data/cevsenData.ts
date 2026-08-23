export interface CevsenBab {
  babNumber: number;
  sectionNumber: number; // 1 to 20 (Her 5 bab 1 bölüm)
  arabic: string;
  transliteration: string;
  meaning: string;
}

export const CEVSEN_BABS: CevsenBab[] = [
  {
    babNumber: 1,
    sectionNumber: 1,
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n(١) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا اللَّهُ، يَا رَحْمَٰنُ، يَا رَحِيمُ، يَا كَرِيمُ، يَا مُقِيمُ، يَا عَظِيمُ، يَا قَدِيمُ، يَا عَلِيمُ، يَا حَلِيمُ، يَا حَكِيمُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: 'Bismillâhirrahmânirrahîm\n(1) Allâhümme innî es\'elüke bismike: Yâ Allâh, Yâ Rahmân, Yâ Rahîm, Yâ Kerîm, Yâ Mukîm, Yâ Azîm, Yâ Kadîm, Yâ Alîm, Yâ Halîm, Yâ Hakîm.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: 'Rahmân ve Rahîm olan Allah\'ın adıyla.\n(1) Allah\'ım! Şu güzel isimlerinin hakkı için Senden istiyorum: Ey Allah, ey Rahmân, ey Rahîm, ey Kerîm, ey her şeyi ayakta tutan Mukîm, ey Azîm, ey ezeli Kadîm, ey her şeyi bilen Alîm, ey yumuşak muamele eden Halîm, ey her işi hikmetli Hakîm!\nBütün kusurlardan münezzehsin, Senden başka ilah yoktur. İmdat! İmdat! Bizi cehennem ateşinden kurtar!',
  },
  {
    babNumber: 2,
    sectionNumber: 1,
    arabic: '(٢) يَا سَيِّدَ السَّادَاتِ، يَا مُجِيبَ الدَّعَوَاتِ، يَا رَافِعَ الدَّرَجَاتِ، يَا وَلِيَّ الْحَسَنَاتِ، يَا غَافِرَ الْخَطِيئَاتِ، يَا مُعْطِيَ الْمَسْأَلَاتِ، يَا قَابِلَ التَّوْبَاتِ، يَا سَامِعَ الْأَصْوَاتِ، يَا عَالِمَ الْخَفِيَّاتِ، يَا دَافِعَ الْبَلِيَّاتِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(2) Yâ Seyyide\'s-sâdât, Yâ Mucîbe\'d-da\'avât, Yâ Râfia\'d-deracât, Yâ Veliye\'l-hasenât, Yâ Gâfire\'l-hatîât, Yâ Mu\'tiye\'l-mes\'elât, Yâ Kâbile\'t-tevbât, Yâ Sâmia\'l-asvât, Yâ Âlime\'l-hafiyyât, Yâ Dâfia\'l-beliyyât.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(2) Ey efendiler efendisi, ey dualara icabet eden, ey dereceleri yükselten, ey iyiliklerin sahibi, ey hataları bağışlayan, ey dilekleri ihsan eden, ey tevbeleri kabul eden, ey sesleri işiten, ey gizlilikleri bilen, ey belaları defeden Rabbimiz! Bizi cehennem ateşinden kurtar!',
  },
  {
    babNumber: 3,
    sectionNumber: 1,
    arabic: '(٣) يَا خَيْرَ الْغَافِرِينَ، يَا خَيْرَ الْفَاتِحِينَ، يَا خَيْرَ النَّاصِرِينَ، يَا خَيْرَ الْحَاكِمِينَ، يَا خَيْرَ الرَّازِقِينَ، يَا خَيْرَ الْوَارِثِينَ، يَا خَيْرَ الْحَامِدِينَ، يَا خَيْرَ الذَّاكِرِينَ، يَا خَيْرَ الْمُنْزِلِينَ، يَا خَيْرَ الْمُحْسِنِينَ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(3) Yâ Hayra\'l-gâfirîn, Yâ Hayra\'l-fâtihîn, Yâ Hayra\'n-nâsırîn, Yâ Hayra\'l-hâkimîn, Yâ Hayra\'r-râzikîn, Yâ Hayra\'l-vârisîn, Yâ Hayra\'l-hâmidîn, Yâ Hayra\'z-zâkirîn, Yâ Hayra\'l-münzilîn, Yâ Hayra\'l-muhsinîn.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(3) Ey bağışlayanların en hayırlısı, ey fetih kapılarını açanların en hayırlısı, ey yardım edenlerin en hayırlısı, ey hüküm verenlerin en hayırlısı, ey rızık verenlerin en hayırlısı, ey varislerin en hayırlısı, ey övenlerin en hayırlısı, ey zikredenlerin en hayırlısı, ey ikramda bulunanların en hayırlısı, ey ihsan edenlerin en hayırlısı!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 4,
    sectionNumber: 1,
    arabic: '(٤) يَا مَنْ لَهُ الْعِزَّةُ وَالْجَمَالُ، يَا مَنْ لَهُ الْقُدْرَةُ وَالْكَمَالُ، يَا مَنْ لَهُ الْمُلْكُ وَالْجَلَالُ، يَا مَنْ هُوَ الْكَبِيرُ الْمُتَعَالِ، يَا مُنْشِئَ السَّحَابِ الثِّقَالِ، يَا مَنْ هُوَ شَدِيدُ الْمِحَالِ، يَا مَنْ هُوَ سَرِيعُ الْحِسَابِ، يَا مَنْ هُوَ شَدِيدُ الْعِقَابِ، يَا مَنْ عِنْدَهُ حُسْنُ الثَّوَابِ، يَا مَنْ عِنْدَهُ أُمُّ الْكِتَابِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(4) Yâ men lehu\'l-izzetü ve\'l-cemâl, Yâ men lehu\'l-kudretü ve\'l-kemâl, Yâ men lehu\'l-mülkü ve\'l-celâl, Yâ men hüve\'l-kebîru\'l-müte\'âl, Yâ münşie\'s-sehâbi\'s-sikâl, Yâ men hüve şedîdü\'l-mihâl, Yâ men hüve serîu\'l-hisâb, Yâ men hüve şedîdü\'l-ikâb, Yâ men indehû husnü\'s-sevâb, Yâ men indehû ümmü\'l-kitâb.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(4) Ey izzet ve cemal sahibi, ey kudret ve kemal sahibi, ey mülk ve celal sahibi, ey pek yüce ve ulu olan, ey yağmur yüklü bulutları yaratan, ey cezalandırması çetin olan, ey hesabı çarçabuk gören, ey azabı şiddetli olan, ey katında güzel mükâfatlar bulunan, ey Ana Kitap (Levh-i Mahfuz) katında olan Rabbimiz!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 5,
    sectionNumber: 1,
    arabic: '(٥) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا حَنَّانُ، يَا مَنَّانُ، يَا دَيَّانُ، يَا بُرْهَانُ، يَا سُلْطَانُ، يَا رِضْوَانُ، يَا غُفْرَانُ، يَا سُبْحَانُ، يَا مُسْتَعَانُ، يَا ذَا الْمَنِّ وَالْبَيَانِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(5) Allâhümme innî es\'elüke bismike: Yâ Hannân, Yâ Mennân, Yâ Deyyân, Yâ Bürhân, Yâ Sultân, Yâ Rıdvân, Yâ Gufrân, Yâ Sübhân, Yâ Müste\'ân, Yâ Ze\'l-menni ve\'l-beyân.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(5) Allah\'ım! Şu isimlerinin hakkı için Senden istiyorum: Ey çok şefkatli Hannân, ey bol nimet veren Mennân, ey amellerin karşılığını eksiksiz veren Deyyân, ey varlığı apaçık delil olan Bürhân, ey mutlak hâkim Sultân, ey rızasına erilen Rıdvân, ey bağışlayan Gufrân, ey noksanlıklardan pak olan Sübhân, ey kendisinden yardım dilenen Müsteân, ey lütuf ve beyan sahibi!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 6,
    sectionNumber: 2,
    arabic: '(٦) يَا مَنْ تَوَاضَعَ كُلُّ شَيْءٍ لِعَظَمَتِهِ، يَا مَنِ اسْتَسْلَمَ كُلُّ شَيْءٍ لِقُدْرَتِهِ، يَا مَنْ ذَلَّ كُلُّ شَيْءٍ لِعِزَّتِهِ، يَا مَنْ خَضَعَ كُلُّ شَيْءٍ لِهَيْبَتِهِ، يَا مَنِ انْقَادَ كُلُّ شَيْءٍ مِنْ خَشْيَتِهِ، يَا مَنْ تَشَقَّقَتِ الْجِبَالُ مِنْ مَخَافَتِهِ، يَا مَنْ قَامَتِ السَّمَاوَاتُ بِأَمْرِهِ، يَا مَنِ اسْتَقَرَّتِ الْأَرَضُونَ بِإِذْنِهِ، يَا مَنْ يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ، يَا مَنْ لَا يَعْتَدِي عَلَىٰ أَهْلِ مَمْلَكَتِهِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(6) Yâ men tevâdaa küllü şey\'in li-azametih, Yâ meni\'stesleme küllü şey\'in li-kudretih, Yâ men zelle küllü şey\'in li-izzetih, Yâ men hadaa küllü şey\'in li-heybetih, Yâ meni\'nkâde küllü şey\'in min haşyetih, Yâ men teşakkatı\'l-cibâlü min mehâfetih, Yâ men kâmeti\'s-semâvâtü bi-emrih, Yâ meni\'stekarretı\'l-aradûne bi-iznih, Yâ men yüsebbihu\'r-ra\'dü bi-hamdih, Yâ men lâ ya\'tedî alâ ehli memleketih.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(6) Ey azameti karşısında her şeyin boyun eğdiği, ey kudretine her şeyin teslim olduğu, ey izzeti önünde her şeyin küçüldüğü, ey heybetine her şeyin itaat ettiği, ey korkusundan her şeyin emrine girdiği, ey heybetinden dağların yarıldığı, ey emriyle göklerin ayakta durduğu, ey izniyle yerin sükûnet bulduğu, ey gök gürültüsünün hamd ile tesbih ettiği, ey memleketinin ahalisine asla zulmetmeyen Rabbimiz!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 7,
    sectionNumber: 2,
    arabic: '(٧) يَا غَافِرَ الْخَطَايَا، يَا كَاشِفَ الْبَلَايَا، يَا مُنْتَهَى الرَّجَايَا، يَا مُجْزِلَ الْعَطَايَا، يَا وَاسِعَ الْهَدَايَا، يَا رَازِقَ الْبَرَايَا، يَا قَاضِيَ الْمَنَايَا، يَا سَامِعَ الشَّكَايَا، يَا بَاعِثَ السَّرَايَا، يَا مُطْلِقَ الْأُسَارَىٰ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(7) Yâ Gâfire\'l-hatâyâ, Yâ Kâşife\'l-belâyâ, Yâ Müntehe\'r-recâyâ, Yâ Muczile\'l-atâyâ, Yâ Vâsia\'l-hedâyâ, Yâ Râzika\'l-berâyâ, Yâ Kâdiye\'l-menâyâ, Yâ Sâmia\'ş-şekâyâ, Yâ Bâise\'s-serâyâ, Yâ Mutlika\'l-üsârâ.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(7) Ey günahları bağışlayan, ey belaları defeden, ey umutların son durağı, ey bol bol ihsanda bulunan, ey hediyeleri pek geniş olan, ey mahlûkatı rızıklandıran, ey ecelleri takdir eden, ey şikâyetleri işiten, ey orduları sevk eden, ey esirleri hürriyetine kavuşturan Rabbimiz!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 8,
    sectionNumber: 2,
    arabic: '(٨) يَا ذَا الْحَمْدِ وَالثَّنَاءِ، يَا ذَا الْفَخْرِ وَالْبَهَاءِ، يَا ذَا الْمَجْدِ وَالسَّنَاءِ، يَا ذَا الْعَهْدِ وَالْوَفَاءِ، يَا ذَا الْعَفْوِ وَالرِّضَاءِ، يَا ذَا الْمَنِّ وَالْعَطَاءِ، يَا ذَا الْفَصْلِ وَالْقَضَاءِ، يَا ذَا الْعِزِّ وَالْبَقَاءِ، يَا ذَا الْجُودِ وَالسَّخَاءِ، يَا ذَا الْآلَاءِ وَالنَّعْمَاءِ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(8) Yâ Ze\'l-hamdi ve\'s-senâ\', Yâ Ze\'l-fahri ve\'l-behâ\', Yâ Ze\'l-mecdi ve\'s-senâ\', Yâ Ze\'l-ahdi ve\'l-vefâ\', Yâ Ze\'l-afvi ve\'r-rıdâ\', Yâ Ze\'l-menni ve\'l-atâ\', Yâ Ze\'l-fasli ve\'l-kadâ\', Yâ Ze\'l-ızzi ve\'l-bekâ\', Yâ Ze\'l-cûdi ve\'s-sehâ\', Yâ Ze\'l-âlâi ve\'n-na\'mâ\'.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(8) Ey hamd ve övgünün sahibi, ey şan ve güzelliğin sahibi, ey şeref ve yüceliğin sahibi, ey ahit ve vefanın sahibi, ey af ve rızanın sahibi, ey lütuf ve ihsanın sahibi, ey kesin hüküm ve kazanın sahibi, ey izzet ve bekânın sahibi, ey cömertlik ve keremin sahibi, ey sonsuz nimetlerin sahibi!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 9,
    sectionNumber: 2,
    arabic: '(٩) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا مَانِعُ، يَا دَافِعُ، يَا نَافِعُ، يَا سَامِعُ، يَا رَافِعُ، يَا صَانِعُ، يَا شَافِعُ، يَا جَامِعُ، يَا وَاسِعُ، يَا مُوَسِّعُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(9) Allâhümme innî es\'elüke bismike: Yâ Mâni\', Yâ Dâfi\', Yâ Nâfi\', Yâ Sâmi\', Yâ Râfi\', Yâ Sâni\', Yâ Şâfi\', Yâ Câmi\', Yâ Vâsi\', Yâ Muvassi\'.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(9) Allah\'ım! Şu isimlerinin hakkı için Senden istiyorum: Ey dilediğine engel olan Mâni, ey zararları defeden Dâfi, ey menfaatler veren Nâfi, ey her şeyi işiten Sâmi, ey dereceleri yükselten Râfi, ey sanatla yaratan Sâni, ey şefaat eden Şâfi, ey toplayan Câmi, ey rahmeti geniş olan Vâsi, ey rızkı bollaştıran Muvassi!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 10,
    sectionNumber: 2,
    arabic: '(١٠) يَا صَانِعَ كُلِّ مَصْنُوعٍ، يَا خَالِقَ كُلِّ مَخْلُوقٍ، يَا رَازِقَ كُلِّ مَرْزُوقٍ، يَا مَالِكَ كُلِّ مَمْلُوكٍ، يَا كَاشِفَ كُلِّ مَكْرُوبٍ، يَا فَارِجَ كُلِّ مَهْمُومٍ، يَا رَاحِمَ كُلِّ مَرْحُومٍ، يَا نَاصِرَ كُلِّ مَخْذُولٍ، يَا سَاتِرَ كُلِّ مَعْيُوبٍ، يَا مَلْجَأَ كُلِّ مَطْرُودٍ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(10) Yâ Sânia külli masnû\', Yâ Hâlika külli mahlûk, Yâ Râzıka külli merzûk, Yâ Mâlike külli memlûk, Yâ Kâşife külli mekrûb, Yâ Fârice külli mehmûm, Yâ Râhime külli merhûm, Yâ Nâsıra külli mahzûl, Yâ Sâtira külli ma\'yûb, Yâ Melcee külli matrûd.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(10) Ey yapılan her şeyin sanatkârı, ey yaratılan her varlığın yaratıcısı, ey rızıklanan her canlının rızık vericisi, ey sahip olunan her şeyin gerçek maliki, ey kederlilerin kederini açan, ey gamlıların gamını dağıtan, ey merhamete muhtaç olanlara acıyan, ey yalnız bırakılanlara yardım eden, ey ayıpları örten, ey kapılardan kovulanların sığınağı!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 20,
    sectionNumber: 4,
    arabic: '(٢٠) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا فَاعِلُ، يَا جَاعِلُ، يَا قَابِلُ، يَا كَامِلُ، يَا فَاصِلُ، يَا وَاصِلُ، يَا عَادِلُ، يَا غَالِبُ، يَا طَالِبُ، يَا وَاهِبُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(20) Allâhümme innî es\'elüke bismike: Yâ Fâil, Yâ Câil, Yâ Kâbil, Yâ Kâmil, Yâ Fâsıl, Yâ Vâsıl, Yâ Âdil, Yâ Gâlib, Yâ Tâlib, Yâ Vâhib.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(20) Allah\'ım! Şu isimlerinin hakkı için Senden istiyorum: Ey her fiili yaratan Fâil, ey dilediğini kılan Câil, ey tevbeleri kabul eden Kâbil, ey zatında ve sıfatında noksansız Kâmil, ey hakkı batıldan ayıran Fâsıl, ey sevenlerini kavuşturan Vâsıl, ey adalet sahibi Âdil, ey mutlak galip Gâlib, ey dilediğini arayıp bulan Tâlib, ey karşılıksız veren Vâhib!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 50,
    sectionNumber: 10,
    arabic: '(٥٠) اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ\nيَا كَافِي، يَا شَافِي، يَا وَافِي، يَا مُعَافِي، يَا هَادِي، يَا دَاعِي، يَا قَاضِي، يَا رَاضِي، يَا عَالِي، يَا بَاقِي\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(50) Allâhümme innî es\'elüke bismike: Yâ Kâfî, Yâ Şâfî, Yâ Vâfî, Yâ Muâfî, Yâ Hâdî, Yâ Dâî, Yâ Kâdî, Yâ Râdî, Yâ Âlî, Yâ Bâkî.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(50) Allah\'ım! Şu mübarek isimlerinle Senden diliyorum: Ey her şeye yeten Kâfi, ey her derde şifa veren Şâfi, ey vaadine sadık Vâfi, ey afiyet ihsan eden Muâfi, ey hidayet veren Hâdi, ey hayra çağıran Dâi, ey hükümleri infaz eden Kâdi, ey kullarından razı olan Râdi, ey pek yüce olan Âli, ey ebediyyen var olan Bâki!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 99,
    sectionNumber: 20,
    arabic: '(٩٩) يَا مَنْ لَا يَشْغَلُهُ سَمْعٌ عَنْ سَمْعٍ، يَا مَنْ لَا يَمْنَعُهُ فِعْلٌ عَنْ فِعْلٍ، يَا مَنْ لَا يُلْهِيهِ قَوْلٌ عَنْ قَوْلٍ، يَا مَنْ لَا يُغَلِّطُهُ سُؤَالٌ عَنْ سُؤَالٍ، يَا مَنْ لَا يَحْجُبُهُ شَيْءٌ عَنْ شَيْءٍ، يَا مَنْ لَا يُبْرِمُهُ إِلْحَاحُ الْمُلِحِّينَ، يَا مَنْ هُوَ غَايَةُ مُرَادِ الْمُرِيدِينَ، يَا مَنْ هُوَ مُنْتَهَى هِمَمِ الْعَارِفِينَ، يَا مَنْ هُوَ مُنْتَهَى طَلَبِ الطَّالِبِينَ، يَا مَنْ لَا يَخْفَىٰ عَلَيْهِ ذَرَّةٌ فِي الْعَالَمِينَ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ خَلِّصْنَا مِنَ النَّارِ',
    transliteration: '(99) Yâ men lâ yeşgalühû sem\'un an sem\', Yâ men lâ yemneuhû fi\'lün an fi\'l, Yâ men lâ yülhîhi kavlün an kavl, Yâ men lâ yugallituhû süâlün an süâl, Yâ men lâ yahcubühû şey\'ün an şey\', Yâ men lâ yübrimuhû ilhâhu\'l-mülihhîn, Yâ men hüve gâyetü murâdi\'l-mürîdîn, Yâ men hüve müntehâ himemi\'l-ârifîn, Yâ men hüve müntehâ talebi\'t-tâlibîn, Yâ men lâ yahfâ aleyhi zerratün fi\'l-âlemîn.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs hallisnâ mine\'n-nâr.',
    meaning: '(99) Ey bir sesi işitmesi diğerini işitmesine engel olmayan, ey bir fiili yapması diğer bir fiiline mâni olmayan, ey bir söz diğer bir sözle meşgul etmeyen, ey sayısız dualar Kendisini şaşırtmayan, ey hiçbir şey hiçbir şeyin önünü kapatıp gizleyemeyen, ey ısrarla dua edenlerin ısrarından usanmayan, ey arayanların nihai muradı, ey ariflerin himmetinin son gayesi, ey talep edenlerin ulaştığı son nokta, ey kâinatta hiçbir zerre Kendisinden gizlenemeyen Rabbimiz!\nBizi cehennemden kurtar!',
  },
  {
    babNumber: 100,
    sectionNumber: 20,
    arabic: '(١٠٠) يَا حَلِيمًا لَا يَعْجَلُ، يَا جَوَادًا لَا يَبْخَلُ، يَا صَادِقًا لَا يُخْلِفُ، يَا وَهَّابًا لَا يَمَلُّ، يَا قَاهِرًا لَا يُغْلَبُ، يَا عَظِيمًا لَا يُوصَفُ، يَا عَدْلًا لَا يَحِيفُ، يَا غَنِيًّا لَا يَفْتَقِرُ، يَا كَبِيرًا لَا يَصْغُرُ، يَا حَافِظًا لَا يَغْفُلُ\nسُبْحَانَكَ يَا لَا إِلَٰهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَخَلِّصْنَا مِنَ النَّارِ، يَا مُجِيرُ أَجِرْنَا مِنَ النَّارِ، وَأَدْخِلْنَا الْجَنَّةَ مَعَ الْأَبْرَارِ',
    transliteration: '(100) Yâ Halîmen lâ ya\'cel, Yâ Cevâden lâ yebhal, Yâ Sâdikan lâ yuhlif, Yâ Vehhâben lâ yemell, Yâ Kâhiran lâ yugleb, Yâ Azîmen lâ yûsaf, Yâ Adlen lâ yehîf, Yâ Ganiyyen lâ yeftekır, Yâ Kebîran lâ yasgur, Yâ Hâfizan lâ yagfül.\nSübhâneke yâ lâ ilâhe illâ ente\'l-gavse\'l-gavs salli alâ Muhammedin ve âli Muhammed ve hallisnâ mine\'n-nâr, yâ Mücîr ecirnâ mine\'n-nâr, ve edhılne\'l-cennete mea\'l-ebrâr.',
    meaning: '(100) Ey cezalandırmada acele etmeyen Halîm, ey asla cimrilik etmeyen Cevâd, ey vaadinden dönmeyen Sâdık, ey vermekten usanmayan Vehhâb, ey asla mağlup olmayan Kâhir, ey vasfedilemeyecek kadar yüce Azîm, ey asla haksızlık etmeyen Âdil, ey hiçbir şeye muhtaç olmayan Ganî, ey büyüklüğü eksilmeyen Kebîr, ey asla gaflete düşmeyen Hâfız!\nBütün kusurlardan münezzehsin, Senden başka ilah yoktur. İmdat! İmdat! Efendimiz Muhammed\'e ve âline salât eyle, bizi cehennem ateşinden kurtar. Ey koruyup sığınak olan Allah\'ım, bizi ateşten koru ve bizi iyilerle beraber Cennetine idhal eyle!',
  },
];
