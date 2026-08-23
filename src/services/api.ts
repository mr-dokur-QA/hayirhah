import { DailyPrayerTracking, Group, User } from '../types';
import { SAMPLE_GROUPS } from '../data/islamicData';

const STORAGE_KEYS = {
  TRACKING: 'hayirhah_tracking_history',
  GROUPS: 'hayirhah_groups_v2',
  AUTH: 'hayirhah_auth_user',
  TOKEN: 'hayirhah_jwt_token',
  SELECTED_CITY: 'hayirhah_selected_city',
  DHIKRS: 'hayirhah_dhikrs_v1',
};

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
  }
};
