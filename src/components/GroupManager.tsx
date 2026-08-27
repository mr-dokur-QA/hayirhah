import React, { useState, useMemo } from 'react';
import { Users, Plus, KeyRound, CheckCircle2, Clock, Sparkles, BookOpen, Share2, ArrowRight, ShieldCheck, Heart, PieChart as PieChartIcon, TrendingUp, ChevronDown, ChevronUp, UserCheck, AtSign, Shield, Lock, Award, LayoutGrid, CircleDot, MessageSquareHeart } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Group, GroupTask, GroupType, User } from '../types';
import { ApiService, formatUserHandle } from '../services/api';
import { CircularJuzRing } from './CircularJuzRing';
import { GroupPrayerRequests } from './GroupPrayerRequests';
import { HatimCelebrationModal } from './HatimCelebrationModal';
import confetti from 'canvas-confetti';

interface GroupManagerProps {
  currentUser: User | null;
  onOpenJuzInQuranReader?: (juzNumber: number) => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ currentUser, onOpenJuzInQuranReader }) => {
  const [activeMainTab, setActiveMainTab] = useState<'groups' | 'requests'>('groups');
  const [groups, setGroups] = useState<Group[]>(() => ApiService.getGroups());
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<'ring' | 'list'>('ring');
  const [celebrationGroup, setCelebrationGroup] = useState<Group | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Group Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<GroupType>('hatim');
  const [newTarget, setNewTarget] = useState(30);

  // Numbered commitment input
  const [commitCount, setCommitCount] = useState<number>(50);
  const [commitMemberHandle, setCommitMemberHandle] = useState<string>('');
  const [assigningTaskIndex, setAssigningTaskIndex] = useState<number | null>(null);
  const [assigneeHandleInput, setAssigneeHandleInput] = useState<string>('');
  const [showCharts, setShowCharts] = useState<boolean>(true);

  const isTaskOwnedByCurrentUser = (task: GroupTask) => {
    if (task.status === 'available') return false;
    const user = currentUser || ApiService.getCurrentUser();
    const currentUserId = user?.id;
    const currentUserHandle = user?.username ? formatUserHandle(user.username).toLowerCase() : '@siz';

    if (task.assignedTo === 'current-user' || (currentUserId && task.assignedTo === currentUserId)) return true;
    if (task.assignedToUsername) {
      const handle = task.assignedToUsername.toLowerCase();
      if (handle === '@siz' || handle === currentUserHandle) return true;
      if (user?.username && handle.replace('@', '') === user.username.replace('@', '').toLowerCase()) return true;
    }
    return false;
  };

  // Compute analytics specifically for the current user's assigned cüzs across all hatims
  const analyticsData = useMemo(() => {
    // Filter ONLY tasks taken by the current user across all groups
    const myTakenTasks: Array<{ task: GroupTask; groupTitle: string; groupType: GroupType; groupId: string }> = [];

    groups.forEach((g) => {
      if (g.tasks && g.tasks.length > 0) {
        g.tasks.forEach((t) => {
          if (isTaskOwnedByCurrentUser(t)) {
            myTakenTasks.push({
              task: t,
              groupTitle: g.title,
              groupType: g.type,
              groupId: g.id,
            });
          }
        });
      }
    });

    const myCompletedTasks = myTakenTasks.filter((item) => item.task.status === 'completed');
    const myPendingTasks = myTakenTasks.filter((item) => item.task.status === 'assigned');
    const totalMyTasks = myTakenTasks.length;
    const distinctGroupsCount = new Set(myTakenTasks.map((item) => item.groupId)).size;

    // Pie chart: ONLY user's taken tasks (Completed vs In Progress). No unassigned tasks!
    const myPieData: Array<{ name: string; value: number; color: string }> = [];
    if (myCompletedTasks.length > 0) {
      myPieData.push({ name: 'Okunan / Biten Cüzler', value: myCompletedTasks.length, color: '#10b981' });
    }
    if (myPendingTasks.length > 0) {
      myPieData.push({ name: 'Okunmakta Olan Cüzler', value: myPendingTasks.length, color: '#f59e0b' });
    }

    // Completion percentage: (myCompletedTasks / totalMyTasks) * 100
    const myCompletionPercentage = totalMyTasks > 0 ? Math.round((myCompletedTasks.length / totalMyTasks) * 100) : 0;

    return {
      myPieData,
      myTakenTasks,
      myCompletedCount: myCompletedTasks.length,
      myPendingCount: myPendingTasks.length,
      totalMyTasks,
      distinctGroupsCount,
      myCompletionPercentage,
    };
  }, [groups, currentUser]);

  const refreshGroups = () => {
    const loaded = ApiService.getGroups();
    setGroups(loaded);
    if (selectedGroup) {
      const updatedSelected = loaded.find((g) => g.id === selectedGroup.id) || null;
      setSelectedGroup(updatedSelected);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let target = newTarget;
    if (newType === 'hatim') target = 30;
    if (newType === 'cevsen') target = 20;
    if (newType === 'tefriciye') target = 4444;
    if (newType === '1000_ihlas') target = 1000;

    const created = ApiService.createGroup({
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      targetCount: target,
    });

    refreshGroups();
    setIsCreateOpen(false);
    setSelectedGroup(created);
    setNewTitle('');
    setNewDesc('');

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    const res = ApiService.joinGroupByCode(inviteCodeInput);
    if (res.success && res.group) {
      setJoinMessage({ type: 'success', text: res.message });
      refreshGroups();
      setTimeout(() => {
        setIsJoinOpen(false);
        setInviteCodeInput('');
        setJoinMessage(null);
        setSelectedGroup(res.group!);
      }, 1000);
    } else {
      setJoinMessage({ type: 'error', text: res.message });
    }
  };

  const handleAssignTask = (groupId: string, taskIndex: number, specificHandle?: string) => {
    let updated;
    const currentUser = ApiService.getCurrentUser();
    const cleanHandle = specificHandle ? formatUserHandle(specificHandle) : (currentUser?.username ? formatUserHandle(currentUser.username) : '@siz');

    if (specificHandle) {
      updated = ApiService.assignTaskToMember(groupId, taskIndex, cleanHandle);
    } else {
      updated = ApiService.assignTask(groupId, taskIndex);
    }
    refreshGroups();
    const group = groups.find((g) => g.id === groupId);
    ApiService.sendGroupNotificationEvent({
      groupId,
      groupTitle: group?.title || 'Dua Halkası',
      eventType: 'task_assigned',
      actorName: cleanHandle,
      taskTitle: `${taskIndex}. Cüz / Bölüm`,
    });
    setAssigningTaskIndex(null);
    setAssigneeHandleInput('');
  };

  const handleCompleteTask = (groupId: string, taskIndex: number) => {
    const updated = ApiService.completeTask(groupId, taskIndex);
    refreshGroups();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
    const group = groups.find((g) => g.id === groupId);
    const currentUser = ApiService.getCurrentUser();
    const isFinished = updated && updated.currentProgress >= updated.targetCount;
    if (isFinished) {
      setCelebrationGroup(updated || group || null);
    }
    ApiService.sendGroupNotificationEvent({
      groupId,
      groupTitle: group?.title || 'Dua Halkası',
      eventType: isFinished ? 'group_completed' : 'task_completed',
      actorName: currentUser?.username ? formatUserHandle(currentUser.username) : 'Bir kardeşimiz',
      taskTitle: `${taskIndex}. Cüz / Bölüm`,
    });
  };

  const handleUncompleteTask = (groupId: string, taskIndex: number) => {
    ApiService.uncompleteTask(groupId, taskIndex);
    refreshGroups();
  };

  const handleAddCommitment = (groupId: string) => {
    if (commitCount <= 0) return;
    const memberHandle = commitMemberHandle.trim() ? formatUserHandle(commitMemberHandle) : undefined;
    const updated = ApiService.addNumberedAssignment(groupId, commitCount, memberHandle);
    refreshGroups();
    const group = groups.find((g) => g.id === groupId);
    const currentUser = ApiService.getCurrentUser();
    const isFinished = updated && updated.currentProgress >= updated.targetCount;
    if (isFinished) {
      setCelebrationGroup(updated || group || null);
    }
    const actor = memberHandle || (currentUser?.username ? formatUserHandle(currentUser.username) : 'Bir kardeşimiz');
    ApiService.sendGroupNotificationEvent({
      groupId,
      groupTitle: group?.title || 'Dua Halkası',
      eventType: isFinished ? 'group_completed' : 'task_assigned',
      actorName: actor,
      taskTitle: `${commitCount} adet zikir/dua`,
    });
    setCommitCount(50);
    setCommitMemberHandle('');
  };

  const handleUpdateCommitment = (groupId: string, assignmentId: string, delta: number) => {
    const updated = ApiService.updateNumberedProgress(groupId, assignmentId, delta);
    refreshGroups();
    confetti({
      particleCount: 30,
      spread: 40,
    });
    if (updated && updated.currentProgress >= updated.targetCount) {
      const group = groups.find((g) => g.id === groupId);
      setCelebrationGroup(updated || group || null);
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (filterType === 'all') return true;
    return g.type === filterType;
  });

  const getTypeBadge = (type: GroupType) => {
    switch (type) {
      case 'hatim': return { label: 'Hatm-i Şerif (30 Cüz)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'tefriciye': return { label: 'Salât-ı Tefriciye (4.444)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case '1000_ihlas': return { label: '1.000 İhlâs-ı Şerif', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'cevsen': return { label: 'Cevşen-ül Kebîr (20 Bölüm)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'fetih': return { label: 'Fetih Suresi', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'yasin': return { label: 'Yâsîn-i Şerîf', color: 'bg-sky-100 text-sky-800 border-sky-200' };
      default: return { label: 'Özel Dua Halkası', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-emerald-300" />
            <span>Mümin Kardeşliği</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Hatim ve Dua Meclisleri</h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            "Mü'minin mü'mine gıyabında yaptığı dua en çabuk kabul olan duadır." (Tirmizî). Kardeşlerinizle hatim, tefriciye ve zikir halkalarında buluşun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-join-group-modal-btn"
            onClick={() => setIsJoinOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs transition-colors backdrop-blur-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Koda Katıl</span>
          </button>

          <button
            id="open-create-group-modal-btn"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Halka Kur</span>
          </button>
        </div>
      </div>

      {/* Main Dual Feature Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveMainTab('groups')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'groups'
              ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Dua & Hatim Halkaları ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'requests'
              ? 'bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Kardeşimin Duasına Âmin (Dua Talepleri)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: Dua Talepleri View */}
      {activeMainTab === 'requests' ? (
        <GroupPrayerRequests currentUser={currentUser} />
      ) : (
        /* TAB CONTENT 2: Groups & Hatim Circles View */
        <div className="space-y-6">

      {/* Filter Tabs & Chart Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm Halkalar' },
            { id: 'hatim', label: '📖 Hatm-i Şerif' },
            { id: 'tefriciye', label: '🤲 Salât-ı Tefriciye' },
            { id: '1000_ihlas', label: '✨ 1.000 İhlâs' },
            { id: 'cevsen', label: '🛡️ Cevşen-i Kebir' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCharts(!showCharts)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-xs font-bold transition-colors shadow-2xs"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showCharts ? 'Grafikleri Gizle' : 'Grafik Analizini Göster'}</span>
          {showCharts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Visual Analytics & Recharts Trend Section - Strictly for User's Assigned Cüzs */}
      {showCharts && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header & Quick KPI Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kişisel Cüz Takip & İlerleme Analizi</h3>
                <p className="text-[11px] text-slate-500">
                  Farklı hatimlerden üzerinize aldığınız cüzlerin anlık tamamlanma ve okuma durumu
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-center">
                <span className="text-[10px] text-emerald-700 block font-semibold">Aldığınız Cüzler</span>
                <span className="text-sm font-extrabold">{analyticsData.totalMyTasks} Cüz ({analyticsData.distinctGroupsCount} Hatim)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-center">
                <span className="text-[10px] text-amber-700 block font-semibold">Tamamlanma Oranı</span>
                <span className="text-sm font-extrabold">%{analyticsData.myCompletionPercentage}</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-5 items-stretch">
            {/* Pie Chart: SADECE Kullanıcının Aldığı Cüzler */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Üzerinize Aldığınız Cüzlerin Dağılımı
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                  {analyticsData.totalMyTasks} Alınan Cüz ({analyticsData.myCompletedCount} Biten)
                </span>
              </div>

              {analyticsData.totalMyTasks > 0 ? (
                <>
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.myPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={75}
                          paddingAngle={analyticsData.myPieData.length > 1 ? 3 : 0}
                          dataKey="value"
                        >
                          {analyticsData.myPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [`${val} Cüz`, name]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={32}
                          formatter={(value) => <span className="text-[11px] font-semibold text-slate-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Mini Legend Summary */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-900">
                      <span className="text-[9px] font-bold block uppercase tracking-wider text-emerald-700">Okunan / Biten</span>
                      <span className="text-sm font-extrabold">{analyticsData.myCompletedCount} Cüz</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-900">
                      <span className="text-[9px] font-bold block uppercase tracking-wider text-amber-700">Okunmakta Olan</span>
                      <span className="text-sm font-extrabold">{analyticsData.myPendingCount} Cüz</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-700 text-white shadow-xs">
                      <span className="text-[9px] font-bold block uppercase tracking-wider text-emerald-200">Başarı Oranı</span>
                      <span className="text-sm font-extrabold">%{analyticsData.myCompletionPercentage}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Henüz üzerinize aldığınız bir cüz bulunmuyor</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Aşağıdaki Hatm-i Şerif halkalarından dilediğiniz cüzü seçip üzerinize alarak kişisel okuma yüzdenizi buradan takip edebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => {
          const badge = getTypeBadge(group.type);
          const percent = Math.min(100, Math.round((group.currentProgress / group.targetCount) * 100));
          const isCompleted = group.currentProgress >= group.targetCount;

          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Badge & Code */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    #{group.inviteCode}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{group.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{group.description || 'Açıklama belirtilmedi.'}</p>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">İlerleme:</span>
                  <span className="text-emerald-950 font-bold">
                    {group.currentProgress} / {group.targetCount} ({percent}%)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono font-medium text-emerald-800">
                    <AtSign className="w-3 h-3 text-emerald-600" />
                    {group.creatorUsername ? formatUserHandle(group.creatorUsername) : '@kardes'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {group.membersCount || 1} Katılımcı
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                    İncele <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
      )}

      {/* Group Detail Modal with Circular & List View */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                    {getTypeBadge(selectedGroup.type).label}
                  </span>
                  <span className="text-emerald-200 text-xs font-mono font-bold">
                    #{selectedGroup.inviteCode}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{selectedGroup.title}</h3>
                <p className="text-xs text-emerald-100/90">{selectedGroup.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCelebrationGroup(selectedGroup)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold text-xs shadow-md shadow-amber-400/20 flex items-center gap-1.5 transition-all"
                  title="Hatim Duası ve Beraat Kartı"
                >
                  <Award className="w-4 h-4 text-emerald-950" />
                  <span className="hidden sm:inline">Hatim Duası & Beratı</span>
                </button>

                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Subheader: Progress & View Mode Switcher */}
            <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Davet Kodu:</span>
                  <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                    {selectedGroup.inviteCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedGroup.inviteCode);
                      alert('Davet kodu panoya kopyalandı! Kardeşleriniz bu kodla halkaya katılabilir.');
                    }}
                    className="p-1 text-emerald-700 hover:text-emerald-900"
                    title="Kopyala"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-bold text-emerald-950">
                  {selectedGroup.currentProgress} / {selectedGroup.targetCount} (%
                  {Math.min(100, Math.round((selectedGroup.currentProgress / selectedGroup.targetCount) * 100))})
                </div>
              </div>

              {/* View Switcher for Task-based groups */}
              {selectedGroup.tasks && selectedGroup.tasks.length > 0 && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <button
                    onClick={() => setTaskViewMode('ring')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      taskViewMode === 'ring'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    <CircleDot className="w-3.5 h-3.5" />
                    <span>Dairesel Meclis</span>
                  </button>
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      taskViewMode === 'list'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Liste Görünümü</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Task Groups (Hatim / Cevşen) */}
              {selectedGroup.tasks && selectedGroup.tasks.length > 0 ? (
                taskViewMode === 'ring' ? (
                  /* IDEA 1: Dairesel Halka Meclisi Component */
                  <CircularJuzRing
                    group={selectedGroup}
                    currentUser={currentUser}
                    onAssignTask={handleAssignTask}
                    onCompleteTask={handleCompleteTask}
                    onUncompleteTask={handleUncompleteTask}
                    onOpenJuzInQuranReader={onOpenJuzInQuranReader}
                    onOpenCelebrationModal={() => setCelebrationGroup(selectedGroup)}
                  />
                ) : (
                  /* Classic Grid List View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Cüz / Parça Dağılımı ({selectedGroup.tasks.length} Parça)
                      </h4>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Kendi cüzünüzü alın veya @kullanıcı_adı ile kardeşinize atayın
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {selectedGroup.tasks.map((task) => {
                        const isCompleted = task.status === 'completed';
                        const isAssigned = task.status === 'assigned';
                        const isMyTask = isTaskOwnedByCurrentUser(task);
                        const isAssigningThis = assigningTaskIndex === task.taskIndex;
                        const isHatimGroup = selectedGroup.type === 'hatim';

                        return (
                          <div
                            key={task.id}
                            className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                              isCompleted
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                : isAssigned
                                ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-900">{task.title}</span>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : isAssigned ? (
                                  <Clock className="w-4 h-4 text-amber-600" />
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-semibold">Boş</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 truncate font-mono">
                                {isAssigned || isCompleted ? (
                                  <span className="font-semibold text-emerald-800">
                                    {task.assignedToUsername ? formatUserHandle(task.assignedToUsername) : '@kardes'}
                                  </span>
                                ) : (
                                  'Alınabilir'
                                )}
                              </p>

                              {/* Direct "Cüzü Oku" Quick Button for Hatim groups */}
                              {isHatimGroup && onOpenJuzInQuranReader && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenJuzInQuranReader(task.taskIndex);
                                  }}
                                  className="mt-2 w-full py-1.5 px-2 rounded-xl bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs group"
                                  title={`${task.taskIndex}. Cüzü Kur'an-ı Kerim Okuyucuda Aç`}
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
                                  <span>{task.taskIndex}. Cüzü Oku (Arapça)</span>
                                </button>
                              )}
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100">
                              {isCompleted ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Okundu
                                  </span>
                                  {isMyTask && (
                                    <button
                                      onClick={() => handleUncompleteTask(selectedGroup.id, task.taskIndex)}
                                      className="text-[10px] text-slate-500 hover:text-red-600 hover:underline transition-colors px-1 font-medium"
                                      title="Tamamlanma işaretini geri al"
                                    >
                                      Geri Al
                                    </button>
                                  )}
                                </div>
                              ) : isAssigned ? (
                                isMyTask ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCompleteTask(selectedGroup.id, task.taskIndex)}
                                      className="w-full py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-[11px] transition-all shadow-2xs flex items-center justify-center gap-1"
                                      title={`${task.title} tilavetini tamamlandı olarak işaretle`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Tamamla ✓</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Okunuyor...
                                    </span>
                                  </div>
                                )
                              ) : isAssigningThis ? (
                                /* Specific @Handle input form */
                                <div className="space-y-1.5 animate-in fade-in duration-100">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="örn: @ahmet_kardes"
                                      value={assigneeHandleInput}
                                      onChange={(e) => setAssigneeHandleInput(e.target.value)}
                                      className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg border border-emerald-300 font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                      autoFocus
                                    />
                                    <AtSign className="w-3 h-3 text-emerald-600 absolute left-1.5 top-2" />
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleAssignTask(selectedGroup.id, task.taskIndex, assigneeHandleInput)}
                                      disabled={!assigneeHandleInput.trim()}
                                      className="flex-1 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px] disabled:opacity-50"
                                    >
                                      Ata
                                    </button>
                                    <button
                                      onClick={() => setAssigningTaskIndex(null)}
                                      className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]"
                                    >
                                      İptal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleAssignTask(selectedGroup.id, task.taskIndex)}
                                    className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                                  >
                                    Cüzü Al
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAssigningTaskIndex(task.taskIndex);
                                      setAssigneeHandleInput('');
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium"
                                    title="@Kullanıcıya Ata"
                                  >
                                    <AtSign className="w-3.5 h-3.5 text-emerald-700" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                /* Numbered Assignment Types (Tefriciye, 1000 İhlas) */
                <div className="space-y-4">
                  {/* Add Commitment Form */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Bu Halkaya Okuma Taahhüdü Ekle
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Adet</label>
                        <input
                          type="number"
                          min={1}
                          value={commitCount}
                          onChange={(e) => setCommitCount(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Kimin Adına? (İsteğe bağlı @kullanıcı_adı)
                        </label>
                        <input
                          type="text"
                          placeholder="Boş bırakırsanız sizin adınıza kaydedilir"
                          value={commitMemberHandle}
                          onChange={(e) => setCommitMemberHandle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCommitment(selectedGroup.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Taahhüdü Kaydet
                    </button>
                  </div>

                  {/* Commitments List */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Katılımcı Taahhütleri ({selectedGroup.numberedAssignments?.length || 0})
                    </h4>
                    {selectedGroup.numberedAssignments?.map((assign) => {
                      const isMine =
                        assign.userId === currentUser?.id ||
                        assign.userId === 'current-user' ||
                        (currentUser?.username && assign.userUsername === `@${currentUser.username}`);

                      return (
                        <div
                          key={assign.id}
                          className="p-3 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold font-mono text-emerald-800">
                              {assign.userUsername ? formatUserHandle(assign.userUsername) : '@kardes'}
                            </span>
                            <span className="text-slate-500 ml-2">
                              {assign.completedCount} / {assign.assignedCount} Okundu
                            </span>
                          </div>

                          {isMine && !assign.isCompleted && (
                            <div className="flex items-center gap-1.5">
                              {[10, 50, 100].map((inc) => (
                                <button
                                  key={inc}
                                  onClick={() => handleUpdateCommitment(selectedGroup.id, assign.id, inc)}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[11px]"
                                >
                                  +{inc}
                                </button>
                              ))}
                            </div>
                          )}

                          {assign.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Tamamlandı ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCelebrationGroup(selectedGroup)}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Hatm-i Şerif Duası & Beratını Görüntüle</span>
              </button>

              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hatim Celebration & Certificate Modal (Fikir 4) */}
      {celebrationGroup && (
        <HatimCelebrationModal
          group={celebrationGroup}
          currentUser={currentUser}
          onClose={() => setCelebrationGroup(null)}
        />
      )}

      {/* Create New Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Yeni Dua Halkası Başlat</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Halka Türü</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as GroupType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="hatim">📖 Hatm-i Şerif (30 Cüz)</option>
                  <option value="tefriciye">🤲 Salât-ı Tefriciye (4.444 adet)</option>
                  <option value="1000_ihlas">✨ 1.000 İhlâs-ı Şerif</option>
                  <option value="cevsen">🛡️ Cevşen-ül Kebîr (20 Bölüm)</option>
                  <option value="fetih">⚔️ Fetih Suresi Okuması</option>
                  <option value="yasin">🌿 Yâsîn-i Şerîf Okuması</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Halka Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ramazan Ayı Hatim Halkası"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niyet / Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Halkaya katılanların bilmesi gereken niyet ve detaylar..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Halkayı Başlat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group By Code Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Koda Göre Halkaya Katıl</span>
              </h3>
              <button onClick={() => setIsJoinOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <p className="text-xs text-slate-500">
                Grup kurucusu tarafından sizinle paylaşılan davet kodunu giriniz (Örn: HATIM30TR).
              </p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Davet Kodunu Girin (örn. TEFRIC4444)"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-widest text-slate-900 font-bold uppercase text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {joinMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    joinMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {joinMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Katıl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
