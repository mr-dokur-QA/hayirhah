import { DailyPrayerTracking, Group, User } from '../types';
import { SAMPLE_GROUPS } from '../data/islamicData';

const STORAGE_KEYS = {
  TRACKING: 'hayirhah_tracking_history',
  GROUPS: 'hayirhah_groups_v2',
  AUTH: 'hayirhah_auth_user',
  TOKEN: 'hayirhah_jwt_token',
  SELECTED_CITY: 'hayirhah_selected_city',
  DHIKRS: 'hayirhah_dhikrs_v1',
  PRAYER_REQUESTS: 'hayirhah_prayer_requests_v1',
};

const SAMPLE_PRAYER_REQUESTS: import('../types').PrayerRequest[] = [
  {
    id: 'pr-1',
    authorId: 'user-2',
    authorUsername: '@mehmet_salih',
    category: 'shifa',
    title: 'Şifa Bekleyen Annemiz İçin Dua',
    intention: 'Yoğun bakımda tedavi gören kıymetli annemizin tez zamanda hayırlı ve kâmil bir şifaya kavuşması niyetiyle kardeşlerimizden Fatiha ve Yâ Şâfî zikri istirham ediyoruz.',
    targetDhikrType: 'Fâtiha',
    targetCount: 100,
    currentCount: 68,
    aminCount: 34,
    responses: [
      { id: 'r-1', userId: 'user-6', userUsername: '@zeynep_h', type: 'fatiha', count: 10, message: 'Rabbim Şâfî ismiyle acil ve hayırlı şifalar ihsan eylesin.', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'r-2', userId: 'user-3', userUsername: '@omer_faruk', type: 'fatiha', count: 15, message: 'Dualarımızdasınız kardeşim, Mevlam tez vakitte ayağa kaldırsın.', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'r-3', userId: 'current-user', userUsername: '@siz', type: 'amin', count: 1, createdAt: new Date(Date.now() - 1800000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'pr-2',
    authorId: 'user-6',
    authorUsername: '@zeynep_h',
    category: 'exam_work',
    title: 'Üniversite ve Hafızlık Sınavı Kolaylığı',
    intention: 'Bu hafta sonu hafızlık tespit ve üniversite sınavına girecek genç kardeşlerimizin zihin açıklığı ve kalplerinin teskini için 1.000 İhlas ve Âyetel Kürsi niyet ettik.',
    targetDhikrType: 'İhlâs-ı Şerif',
    targetCount: 1000,
    currentCount: 450,
    aminCount: 52,
    responses: [
      { id: 'r-4', userId: 'user-2', userUsername: '@mehmet_salih', type: 'ihlas', count: 100, message: 'Rabbim ilim yolunda muvaffakiyetler nasip etsin.', createdAt: new Date(Date.now() - 5000000).toISOString() },
      { id: 'r-5', userId: 'user-4', userUsername: '@mustafa_can', type: 'ihlas', count: 150, createdAt: new Date(Date.now() - 10000000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'pr-3',
    authorId: 'user-4',
    authorUsername: '@mustafa_can',
    category: 'vefat',
    title: 'Vefat Eden Dedemizin Ruhuna Fâtiha',
    intention: 'Ebediyete irtihal eden merhum dedemizin kabrinin nur, mekânının cennet olması niyetiyle ruhuna hediye edilmek üzere Fâtihalarınızı bekliyoruz.',
    targetDhikrType: 'Fâtiha',
    targetCount: 70,
    currentCount: 70,
    aminCount: 41,
    isCompleted: true,
    responses: [
      { id: 'r-6', userId: 'user-6', userUsername: '@zeynep_h', type: 'fatiha', count: 20, message: 'Mekânı cennet, makamı âlî olsun inşallah.', createdAt: new Date(Date.now() - 20000000).toISOString() },
      { id: 'r-7', userId: 'user-2', userUsername: '@mehmet_salih', type: 'fatiha', count: 30, createdAt: new Date(Date.now() - 25000000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'pr-4',
    authorId: 'user-3',
    authorUsername: '@omer_faruk',
    category: 'hacet',
    title: 'Hayırlı Evlilik & Yuva Niyeti',
    intention: 'Hayırlı ve takvalı bir yuva kurma niyetinde olan kardeşimiz için gönül huzuru ve hayırlı kapıların açılması duası.',
    targetDhikrType: 'Salavât-ı Şerife',
    targetCount: 500,
    currentCount: 220,
    aminCount: 29,
    responses: [
      { id: 'r-8', userId: 'user-5', userUsername: '@ali_riza', type: 'salavat', count: 100, message: 'Rabbim iki cihan saadeti nasip eylesin.', createdAt: new Date(Date.now() - 4000000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 100000000).toISOString(),
  }
];

export function formatUserHandle(input: string): string {
  if (!input) return '@kardes';
  let clean = input.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_.]/g, '_').toLowerCase();
  if (!clean) clean = 'kardes';
  return `@${clean}`;
}

export const ApiService = {
  // Auth
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && !parsed.username.startsWith('@')) {
          parsed.username = formatUserHandle(parsed.username);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse user', e);
    }
    return { id: 'guest-1', email: 'misafir@hayirhah.com', username: '@kardes' };
  },

  setCurrentUser(user: User | null, token?: string) {
    if (user) {
      if (user.username && !user.username.startsWith('@')) {
        user.username = formatUserHandle(user.username);
      }
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  async findUserByHandle(handle: string): Promise<{ id: string; username: string } | null> {
    try {
      const clean = formatUserHandle(handle);
      const token = this.getToken();
      const res = await fetch(`/api/users/find-by-handle?handle=${encodeURIComponent(clean)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async loginWithGoogle(params: { credential?: string; accessToken?: string; email?: string; name?: string; picture?: string }) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Google girişi başarısız');
      }
      const loggedUser: User = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        profilePhotoUrl: data.user.picture,
        isVerified: true,
      };
      this.setCurrentUser(loggedUser, data.token);
      return { success: true, user: loggedUser, token: data.token };
    } catch (err: any) {
      console.warn('Google login error', err);
      // Fallback local persistence if offline
      if (params.email) {
        const fallbackUser: User = {
          id: `google-${Date.now()}`,
          email: params.email,
          username: params.name || params.email.split('@')[0] || 'Kullanıcı',
          profilePhotoUrl: params.picture,
          isVerified: true,
        };
        this.setCurrentUser(fallbackUser);
        return { success: true, user: fallbackUser };
      }
      throw err;
    }
  },

  // Daily Tracking
  getDailyTracking(dateStr: string): DailyPrayerTracking {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.TRACKING}_${dateStr}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to get tracking', e);
    }

    return {
      date: dateStr,
      fardPrayers: {
        sabah: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        ogle: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        ikindi: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        aksam: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
        yatsi: { isCompleted: false, completedSunnet: false, completedTesbihat: false },
      },
      sunnahPrayers: {
        teheccud: false,
        duha: false,
        evvabin: false,
        tespih: false,
      },
      kazaPrayers: {
        sabah: 0,
        ogle: 0,
        ikindi: 0,
        aksam: 0,
        yatsi: 0,
        vitir: 0,
      },
      quranReadingPages: 0,
    };
  },

  saveDailyTracking(tracking: DailyPrayerTracking) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.TRACKING}_${tracking.date}`, JSON.stringify(tracking));
      
      // Also send to backend async if online
      const token = this.getToken();
      fetch('/api/prayer-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(tracking),
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to save tracking', e);
    }
  },

  // Groups
  getGroups(): Group[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load groups', e);
    }
    // Save sample groups initially
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(SAMPLE_GROUPS));
    return SAMPLE_GROUPS;
  },

  saveGroups(groups: Group[]) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  createGroup(groupData: Partial<Group>): Group {
    const groups = this.getGroups();
    const currentUser = this.getCurrentUser();
    const creatorHandle = currentUser?.username ? formatUserHandle(currentUser.username) : '@kardes';
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      title: groupData.title || 'Dua Halkası',
      description: groupData.description || '',
      creatorId: currentUser?.id || 'guest',
      creatorUsername: creatorHandle,
      type: groupData.type || 'hatim',
      targetCount: groupData.targetCount || 30,
      currentProgress: 0,
      isPrivate: !!groupData.isPrivate,
      deadline: groupData.deadline,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + 'TR',
      isActive: true,
      createdAt: new Date().toISOString(),
      membersCount: 1,
      tasks: groupData.tasks || (groupData.type === 'hatim' 
        ? Array.from({ length: 30 }, (_, i) => ({
            id: `task-${Date.now()}-${i + 1}`,
            groupId: `grp-${Date.now()}`,
            taskIndex: i + 1,
            title: `${i + 1}. Cüz`,
            status: 'available',
          }))
        : groupData.type === 'cevsen'
        ? Array.from({ length: 20 }, (_, i) => ({
            id: `task-${Date.now()}-${i + 1}`,
            groupId: `grp-${Date.now()}`,
            taskIndex: i + 1,
            title: `${i + 1}. Bölüm (Bab ${i * 5 + 1}-${(i + 1) * 5})`,
            status: 'available',
          }))
        : undefined),
      numberedAssignments: groupData.numberedAssignments || [],
    };

    groups.unshift(newGroup);
    this.saveGroups(groups);
    return newGroup;
  },

  joinGroupByCode(code: string): { success: boolean; group?: Group; message: string } {
    const groups = this.getGroups();
    const cleanCode = code.trim().toUpperCase();
    const group = groups.find((g) => g.inviteCode.toUpperCase() === cleanCode);

    if (!group) {
      return { success: false, message: 'Bu davet koduna ait aktif bir grup bulunamadı.' };
    }

    group.membersCount = (group.membersCount || 1) + 1;
    this.saveGroups(groups);
    return { success: true, group, message: `"${group.title}" grubuna başarıyla katıldınız!` };
  },

  // Task assignment in sectioned group (Hatim, Cevsen)
  assignTask(groupId: string, taskIndex: number): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    const currentUser = this.getCurrentUser();
    const userHandle = currentUser?.username ? formatUserHandle(currentUser.username) : '@siz';

    if (group && group.tasks) {
      const task = group.tasks.find((t) => t.taskIndex === taskIndex);
      if (task && task.status === 'available') {
        task.status = 'assigned';
        task.assignedTo = currentUser?.id || 'current-user';
        task.assignedToUsername = userHandle;
        task.assignedAt = new Date().toISOString();
        this.saveGroups(groups);
      }
    }
    return group!;
  },

  // Assign task to a specific invited member by their @handle
  assignTaskToMember(groupId: string, taskIndex: number, handle: string): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    const cleanHandle = formatUserHandle(handle);

    if (group && group.tasks) {
      const task = group.tasks.find((t) => t.taskIndex === taskIndex);
      if (task && task.status === 'available') {
        task.status = 'assigned';
        task.assignedTo = `user-${cleanHandle.replace('@', '')}`;
        task.assignedToUsername = cleanHandle;
        task.assignedAt = new Date().toISOString();
        this.saveGroups(groups);
      }
    }
    return group!;
  },

  completeTask(groupId: string, taskIndex: number): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);

    if (group && group.tasks) {
      const task = group.tasks.find((t) => t.taskIndex === taskIndex);
      if (task && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        if (!task.assignedTo) {
          const currentUser = this.getCurrentUser();
          task.assignedTo = currentUser?.id || 'current-user';
          task.assignedToUsername = currentUser?.username ? formatUserHandle(currentUser.username) : '@siz';
          task.assignedAt = new Date().toISOString();
        }
        group.currentProgress = group.tasks.filter((t) => t.status === 'completed').length;
        this.saveGroups(groups);
      }
    }
    return group!;
  },

  uncompleteTask(groupId: string, taskIndex: number): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);

    if (group && group.tasks) {
      const task = group.tasks.find((t) => t.taskIndex === taskIndex);
      if (task && task.status === 'completed') {
        task.status = 'assigned';
        task.completedAt = undefined;
        group.currentProgress = group.tasks.filter((t) => t.status === 'completed').length;
        this.saveGroups(groups);
      }
    }
    return group!;
  },

  // Numbered commitment (Tefriciye, 1000 İhlas)
  addNumberedAssignment(groupId: string, count: number, memberHandle?: string): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    const currentUser = this.getCurrentUser();
    const handleToUse = memberHandle ? formatUserHandle(memberHandle) : (currentUser?.username ? formatUserHandle(currentUser.username) : '@siz');

    if (group) {
      if (!group.numberedAssignments) group.numberedAssignments = [];
      const newAssignment = {
        id: `num-${Date.now()}`,
        groupId,
        userId: memberHandle ? `user-${handleToUse.replace('@', '')}` : (currentUser?.id || 'current-user'),
        userUsername: handleToUse,
        assignedCount: count,
        completedCount: 0,
        isCompleted: false,
        assignedAt: new Date().toISOString(),
      };
      group.numberedAssignments.push(newAssignment);
      this.saveGroups(groups);
    }
    return group!;
  },

  updateNumberedProgress(groupId: string, assignmentId: string, addCount: number): Group {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);

    if (group && group.numberedAssignments) {
      const assignment = group.numberedAssignments.find((a) => a.id === assignmentId);
      if (assignment) {
        assignment.completedCount = Math.min(assignment.assignedCount, assignment.completedCount + addCount);
        if (assignment.completedCount >= assignment.assignedCount) {
          assignment.isCompleted = true;
        }
        // Recalculate group progress
        group.currentProgress = group.numberedAssignments.reduce((sum, a) => sum + (a.completedCount || 0), 0);
        this.saveGroups(groups);
      }
    }
    return group!;
  },

  // ==================== FCM & Push Notification Services ====================

  async registerDeviceToken(token: string, platform = 'web', cityName = 'İstanbul') {
    try {
      const authToken = this.getToken();
      const res = await fetch('/api/notifications/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ token, platform, cityName }),
      });
      return await res.json();
    } catch (e) {
      console.warn('Register device failed', e);
      return null;
    }
  },

  async sendPrayerNotificationAlert(params: {
    prayerName: string;
    cityName: string;
    prayerTimeStr?: string;
    sound?: string;
    customMessage?: string;
  }) {
    try {
      const authToken = this.getToken();
      const res = await fetch('/api/notifications/send-prayer-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e) {
      console.warn('Send prayer alert failed', e);
      return null;
    }
  },

  async sendGroupNotificationEvent(params: {
    groupId: string;
    groupTitle: string;
    eventType: 'task_assigned' | 'task_completed' | 'group_completed' | 'comment';
    actorName: string;
    taskTitle?: string;
    details?: string;
  }) {
    try {
      const authToken = this.getToken();
      const res = await fetch('/api/notifications/send-group-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e) {
      console.warn('Send group notification failed', e);
      return null;
    }
  },

  async sendTestNotification() {
    try {
      const authToken = this.getToken();
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      return await res.json();
    } catch (e) {
      console.warn('Test notification failed', e);
      return null;
    }
  },

  async getNotificationHistory() {
    try {
      const res = await fetch('/api/notifications/history');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Get notification history failed', e);
    }
    return { logs: [], registeredDevicesCount: 0 };
  },

  // Prayer Requests (Kardeşlik Dua Talepleri)
  getPrayerRequests(groupId?: string): import('../types').PrayerRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRAYER_REQUESTS);
      if (stored) {
        const parsed: import('../types').PrayerRequest[] = JSON.parse(stored);
        if (groupId) {
          return parsed.filter((p) => p.groupId === groupId || !p.groupId);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse prayer requests', e);
    }
    // Initialize with sample requests
    this.savePrayerRequests(SAMPLE_PRAYER_REQUESTS);
    if (groupId) {
      return SAMPLE_PRAYER_REQUESTS.filter((p) => p.groupId === groupId || !p.groupId);
    }
    return SAMPLE_PRAYER_REQUESTS;
  },

  savePrayerRequests(requests: import('../types').PrayerRequest[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRAYER_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.warn('Failed to save prayer requests', e);
    }
  },

  addPrayerRequest(req: {
    groupId?: string;
    category: import('../types').PrayerRequest['category'];
    title: string;
    intention: string;
    targetDhikrType?: string;
    targetCount?: number;
  }): import('../types').PrayerRequest {
    const requests = this.getPrayerRequests();
    const currentUser = this.getCurrentUser();
    const authorHandle = currentUser?.username ? formatUserHandle(currentUser.username) : '@siz';

    const newRequest: import('../types').PrayerRequest = {
      id: `pr-${Date.now()}`,
      groupId: req.groupId,
      authorId: currentUser?.id || 'current-user',
      authorUsername: authorHandle,
      category: req.category,
      title: req.title,
      intention: req.intention,
      targetDhikrType: req.targetDhikrType || 'Fâtiha',
      targetCount: req.targetCount || 100,
      currentCount: 0,
      aminCount: 1,
      responses: [
        {
          id: `r-${Date.now()}`,
          userId: currentUser?.id || 'current-user',
          userUsername: authorHandle,
          type: 'amin',
          count: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    requests.unshift(newRequest);
    this.savePrayerRequests(requests);
    return newRequest;
  },

  respondToPrayerRequest(
    requestId: string,
    type: 'amin' | 'fatiha' | 'ihlas' | 'salavat' | 'shafi' | 'message',
    count: number = 1,
    message?: string
  ): import('../types').PrayerRequest | null {
    const requests = this.getPrayerRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return null;

    const currentUser = this.getCurrentUser();
    const userHandle = currentUser?.username ? formatUserHandle(currentUser.username) : '@siz';

    if (type === 'amin') {
      req.aminCount = (req.aminCount || 0) + 1;
    } else if (type !== 'message') {
      req.currentCount = (req.currentCount || 0) + count;
      if (req.targetCount && req.currentCount >= req.targetCount) {
        req.isCompleted = true;
      }
    }

    if (!req.responses) req.responses = [];
    req.responses.unshift({
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id || 'current-user',
      userUsername: userHandle,
      type,
      count,
      message,
      createdAt: new Date().toISOString(),
    });

    this.savePrayerRequests(requests);
    return req;
  },

  deletePrayerRequest(requestId: string): boolean {
    const requests = this.getPrayerRequests();
    const filtered = requests.filter((r) => r.id !== requestId);
    this.savePrayerRequests(filtered);
    return true;
  }
};
