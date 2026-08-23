// Precise mapping of each Juz (1-30) to standard 20 pages (Mushaf pages 1 to 604)
export interface JuzPageRange {
  juzNumber: number;
  name: string;
  startPage: number;
  endPage: number;
  totalPages: number;
  startSurahName: string;
  endSurahName: string;
  description: string;
}

export const JUZ_PAGE_RANGES: JuzPageRange[] = [
  { juzNumber: 1, name: '1. Cüz (Elif Lâm Mîm)', startPage: 1, endPage: 21, totalPages: 21, startSurahName: 'Fâtiha', endSurahName: 'Bakara', description: 'Fâtiha Suresi ve Bakara Suresi 1-141. ayetler' },
  { juzNumber: 2, name: '2. Cüz (Seyekûlu)', startPage: 22, endPage: 41, totalPages: 20, startSurahName: 'Bakara', endSurahName: 'Bakara', description: 'Bakara Suresi 142-252. ayetler' },
  { juzNumber: 3, name: '3. Cüz (Tilker-Rusul)', startPage: 42, endPage: 61, totalPages: 20, startSurahName: 'Bakara', endSurahName: 'Âl-i İmrân', description: 'Bakara 253-286 ve Âl-i İmrân 1-92. ayetler' },
  { juzNumber: 4, name: '4. Cüz (Len Tenâlû)', startPage: 62, endPage: 81, totalPages: 20, startSurahName: 'Âl-i İmrân', endSurahName: 'Nisâ', description: 'Âl-i İmrân 93-200 ve Nisâ 1-23. ayetler' },
  { juzNumber: 5, name: '5. Cüz (Vel Muhsanât)', startPage: 82, endPage: 101, totalPages: 20, startSurahName: 'Nisâ', endSurahName: 'Nisâ', description: 'Nisâ Suresi 24-147. ayetler' },
  { juzNumber: 6, name: '6. Cüz (Lâ Yuhıbbullâh)', startPage: 102, endPage: 121, totalPages: 20, startSurahName: 'Nisâ', endSurahName: 'Mâide', description: 'Nisâ 148-176 ve Mâide 1-81. ayetler' },
  { juzNumber: 7, name: '7. Cüz (Ve İzâ Semiu)', startPage: 122, endPage: 141, totalPages: 20, startSurahName: 'Mâide', endSurahName: 'En\'âm', description: 'Mâide 82-120 ve En\'âm 1-110. ayetler' },
  { juzNumber: 8, name: '8. Cüz (Ve Lev Ennenâ)', startPage: 142, endPage: 161, totalPages: 20, startSurahName: 'En\'âm', endSurahName: 'A\'râf', description: 'En\'âm 111-165 ve A\'râf 1-87. ayetler' },
  { juzNumber: 9, name: '9. Cüz (Kâlel Meleu)', startPage: 162, endPage: 181, totalPages: 20, startSurahName: 'A\'râf', endSurahName: 'Enfâl', description: 'A\'râf 88-206 ve Enfâl 1-40. ayetler' },
  { juzNumber: 10, name: '10. Cüz (Va\'lemû)', startPage: 182, endPage: 201, totalPages: 20, startSurahName: 'Enfâl', endSurahName: 'Tevbe', description: 'Enfâl 41-75 ve Tevbe 1-92. ayetler' },
  { juzNumber: 11, name: '11. Cüz (Ya\'tezirûne)', startPage: 202, endPage: 221, totalPages: 20, startSurahName: 'Tevbe', endSurahName: 'Hûd', description: 'Tevbe 93-129, Yûnus (tamamı), Hûd 1-5. ayetler' },
  { juzNumber: 12, name: '12. Cüz (Ve Mâ Min Dâbbeh)', startPage: 222, endPage: 241, totalPages: 20, startSurahName: 'Hûd', endSurahName: 'Yûsuf', description: 'Hûd 6-123 ve Yûsuf 1-52. ayetler' },
  { juzNumber: 13, name: '13. Cüz (Ve Mâ Uberriu)', startPage: 242, endPage: 261, totalPages: 20, startSurahName: 'Yûsuf', endSurahName: 'İbrâhîm', description: 'Yûsuf 53-111, Ra\'d ve İbrâhîm Sureleri' },
  { juzNumber: 14, name: '14. Cüz (Rubemâ)', startPage: 262, endPage: 281, totalPages: 20, startSurahName: 'Hicr', endSurahName: 'Nahl', description: 'Hicr ve Nahl Sureleri' },
  { juzNumber: 15, name: '15. Cüz (Subhânellezî)', startPage: 282, endPage: 301, totalPages: 20, startSurahName: 'İsrâ', endSurahName: 'Kehf', description: 'İsrâ Suresi ve Kehf 1-74. ayetler' },
  { juzNumber: 16, name: '16. Cüz (Kâle Elem Ekul)', startPage: 302, endPage: 321, totalPages: 20, startSurahName: 'Kehf', endSurahName: 'Tâhâ', description: 'Kehf 75-110, Meryem ve Tâhâ Sureleri' },
  { juzNumber: 17, name: '17. Cüz (İkterabe Lin-Nâs)', startPage: 322, endPage: 341, totalPages: 20, startSurahName: 'Enbiyâ', endSurahName: 'Hac', description: 'Enbiyâ ve Hac Sureleri' },
  { juzNumber: 18, name: '18. Cüz (Kad Efleha)', startPage: 342, endPage: 361, totalPages: 20, startSurahName: 'Mü\'minûn', endSurahName: 'Furkân', description: 'Mü\'minûn, Nûr ve Furkân 1-20. ayetler' },
  { juzNumber: 19, name: '19. Cüz (Ve Kâlellezîne)', startPage: 362, endPage: 381, totalPages: 20, startSurahName: 'Furkân', endSurahName: 'Neml', description: 'Furkân 21-77, Şuarâ ve Neml 1-55. ayetler' },
  { juzNumber: 20, name: '20. Cüz (E-Men Halaka)', startPage: 382, endPage: 401, totalPages: 20, startSurahName: 'Neml', endSurahName: 'Ankebût', description: 'Neml 56-93, Kasas ve Ankebût 1-45. ayetler' },
  { juzNumber: 21, name: '21. Cüz (Utlu Mâ Ûhıye)', startPage: 402, endPage: 421, totalPages: 20, startSurahName: 'Ankebût', endSurahName: 'Ahzâb', description: 'Ankebût 46-69, Rûm, Lokmân, Secde, Ahzâb 1-30' },
  { juzNumber: 22, name: '22. Cüz (Ve Men Yaknut)', startPage: 422, endPage: 441, totalPages: 20, startSurahName: 'Ahzâb', endSurahName: 'Yâsîn', description: 'Ahzâb 31-73, Sebe\', Fâtır ve Yâsîn 1-27. ayetler' },
  { juzNumber: 23, name: '23. Cüz (Ve Mâ Liye)', startPage: 442, endPage: 461, totalPages: 20, startSurahName: 'Yâsîn', endSurahName: 'Zümer', description: 'Yâsîn 28-83, Sâffât, Sâd ve Zümer 1-31. ayetler' },
  { juzNumber: 24, name: '24. Cüz (Fe-Men Ezlamu)', startPage: 462, endPage: 481, totalPages: 20, startSurahName: 'Zümer', endSurahName: 'Fussilet', description: 'Zümer 32-75, Mü\'min ve Fussilet 1-46. ayetler' },
  { juzNumber: 25, name: '25. Cüz (İleyhi Yuraddu)', startPage: 482, endPage: 501, totalPages: 20, startSurahName: 'Fussilet', endSurahName: 'Câsiye', description: 'Fussilet 47-54, Şûrâ, Zuhruf, Duhân ve Câsiye' },
  { juzNumber: 26, name: '26. Cüz (Hâ-Mîm)', startPage: 502, endPage: 521, totalPages: 20, startSurahName: 'Ahkâf', endSurahName: 'Zâriyât', description: 'Ahkâf, Muhammed, Fetih, Hucurât, Kâf, Zâriyât 1-30' },
  { juzNumber: 27, name: '27. Cüz (Kâle Fe-Mâ Hatbukum)', startPage: 522, endPage: 541, totalPages: 20, startSurahName: 'Zâriyât', endSurahName: 'Hadîd', description: 'Tûr, Necm, Kamer, Rahmân, Vâkıa ve Hadîd' },
  { juzNumber: 28, name: '28. Cüz (Kad Semiallâh)', startPage: 542, endPage: 561, totalPages: 20, startSurahName: 'Mücâdele', endSurahName: 'Tahrîm', description: 'Mücâdele, Haşr, Mümtehine, Saf, Cuma, Münâfikûn, vb.' },
  { juzNumber: 29, name: '29. Cüz (Tebâreke)', startPage: 562, endPage: 581, totalPages: 20, startSurahName: 'Mülk (Tebâreke)', endSurahName: 'Mürselât', description: 'Mülk, Kalem, Hâkka, Meâric, Nûh, Cin, Müzzemmil, vb.' },
  { juzNumber: 30, name: '30. Cüz (Amme Cüzü)', startPage: 582, endPage: 604, totalPages: 23, startSurahName: 'Nebe (Amme)', endSurahName: 'Nâs', description: 'Nebe\'den Nâs Suresine kadar 37 sure' },
];

export interface BookmarkData {
  juzNumber: number;
  pageNumber: number;
  surahNumber?: number;
  surahName?: string;
  ayahNumber?: number;
  savedAt: string;
  note?: string;
}
