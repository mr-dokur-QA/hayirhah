export interface User {
  id: string;
  email: string; // Private: only visible to user themselves in private settings
  username: string; // Public Handle with @ (e.g. @ahmet_kardes), visible to activity peers
  profilePhotoUrl?: string;
  isVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface PrayerTimeItem {
  id: string;
  name: string;
  turkishName: string;
  arabicName: string;
  time: string; // HH:MM
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export interface PrayerTimesData {
  city: string;
  country: string;
  date: string;
  hijriDate: string;
  timings: Record<string, string>;
  items: PrayerTimeItem[];
  nextPrayer: PrayerTimeItem | null;
  timeRemaining: string;
}

export interface DailyPrayerTracking {
  id?: string;
  date: string; // YYYY-MM-DD
  fardPrayers: {
    sabah: { isCompleted: boolean; completedSunnet: boolean; completedTesbihat: boolean };
    ogle: { isCompleted: boolean; completedSunnet: boolean; completedTesbihat: boolean };
    ikindi: { isCompleted: boolean; completedSunnet: boolean; completedTesbihat: boolean };
    aksam: { isCompleted: boolean; completedSunnet: boolean; completedTesbihat: boolean };
    yatsi: { isCompleted: boolean; completedSunnet: boolean; completedTesbihat: boolean };
  };
  sunnahPrayers: {
    teheccud: boolean;
    duha: boolean; // Kuşluk
    evvabin: boolean;
    tespih: boolean;
  };
  kazaPrayers: {
    sabah: number;
    ogle: number;
    ikindi: number;
    aksam: number;
    yatsi: number;
    vitir: number;
  };
  quranReadingPages: number;
  notes?: string;
}

export type GroupType = 'hatim' | 'yasin' | 'fetih' | 'tefriciye' | 'cevsen' | '1000_ihlas' | 'custom_parca' | 'custom_sayi';

export interface GroupTask {
  id: string;
  groupId: string;
  taskIndex: number;
  title: string;
  description?: string;
  status: 'available' | 'assigned' | 'completed';
  assignedTo?: string;
  assignedToUsername?: string;
  assignedAt?: string;
  completedAt?: string;
}

export interface NumberedAssignment {
  id: string;
  groupId: string;
  userId: string;
  userUsername: string;
  assignedCount: number;
  completedCount: number;
  isCompleted: boolean;
  assignedAt: string;
}

export interface Group {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorUsername: string;
  type: GroupType;
  targetCount: number;
  currentProgress: number;
  isPrivate: boolean;
  deadline?: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  membersCount: number;
  tasks?: GroupTask[];
  numberedAssignments?: NumberedAssignment[];
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface QuranAyah {
  numberInSurah: number;
  arabicText: string;
  turkishTranslation: string;
  transliteration?: string;
  audioUrl?: string;
}

export interface ArabicTextItem {
  id: string;
  title: string;
  arabicTitle: string;
  type: 'yasin' | 'fetih' | 'tefriciye' | 'cevsen' | 'ayetel_kursi' | 'amenerrasulu' | 'dualar' | 'esmaul_husna';
  description: string;
  countTarget?: number;
  verses: {
    number: number;
    arabic: string;
    turkish: string;
    meaning?: string;
    virtue?: string;
  }[];
}

export interface DhikrItem {
  id: string;
  arabic: string;
  title?: string;
  name?: string;
  meaning: string;
  target?: number;
  targetCount?: number;
  count?: number;
  virtue?: string;
}

export interface AIReportResult {
  type: 'daily' | 'weekly' | 'monthly';
  content: string;
  generatedAt: string;
  statsSummary: {
    totalFard: number;
    completedFard: number;
    fardPercentage: number;
    completedSunnet: number;
    completedTesbihat: number;
    totalQuranPages: number;
    totalKaza: number;
    mostRegularPrayer: string;
    challengingPrayer: string;
  };
}
