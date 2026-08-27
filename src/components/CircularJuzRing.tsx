import React, { useState, useMemo } from 'react';
import { CheckCircle2, Clock, BookOpen, AtSign, Sparkles, User, Filter, RefreshCw, ChevronRight } from 'lucide-react';
import { Group, GroupTask, User as UserType } from '../types';
import { formatUserHandle } from '../services/api';
import { HapticFeedback } from '../services/haptics';

interface CircularJuzRingProps {
  group: Group;
  currentUser: UserType | null;
  onAssignTask: (groupId: string, taskIndex: number, handle?: string) => void;
  onCompleteTask: (groupId: string, taskIndex: number) => void;
  onUncompleteTask: (groupId: string, taskIndex: number) => void;
  onOpenJuzInQuranReader?: (juzNumber: number) => void;
  onOpenCelebrationModal?: () => void;
}

export const CircularJuzRing: React.FC<CircularJuzRingProps> = ({
  group,
  currentUser,
  onAssignTask,
  onCompleteTask,
  onUncompleteTask,
  onOpenJuzInQuranReader,
  onOpenCelebrationModal,
}) => {
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(1);
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);
  const [filterState, setFilterState] = useState<'all' | 'available' | 'mine' | 'completed'>('all');
  const [assigneeHandleInput, setAssigneeHandleInput] = useState<string>('');
  const [isAssigningSpecific, setIsAssigningSpecific] = useState<boolean>(false);

  const tasks = group.tasks || [];
  const totalTasks = tasks.length || 30;

  const isTaskOwnedByCurrentUser = (task: GroupTask) => {
    if (task.status === 'available') return false;
    const currentUserId = currentUser?.id;
    const currentUserHandle = currentUser?.username ? formatUserHandle(currentUser.username).toLowerCase() : '@siz';

    if (task.assignedTo === 'current-user' || (currentUserId && task.assignedTo === currentUserId)) return true;
    if (task.assignedToUsername) {
      const handle = task.assignedToUsername.toLowerCase();
      if (handle === '@siz' || handle === currentUserHandle) return true;
      if (currentUser?.username && handle.replace('@', '') === currentUser.username.replace('@', '').toLowerCase()) return true;
    }
    return false;
  };

  const selectedTask = useMemo(() => {
    if (selectedTaskIndex === null) return tasks[0] || null;
    return tasks.find((t) => t.taskIndex === selectedTaskIndex) || tasks[0] || null;
  }, [tasks, selectedTaskIndex]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const assignedCount = tasks.filter((t) => t.status === 'assigned').length;
  const availableCount = tasks.filter((t) => t.status === 'available').length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalTasks) * 100));

  // Find first available task for quick claim
  const firstAvailableTask = tasks.find((t) => t.status === 'available');
  // Find user's next pending task
  const myPendingTask = tasks.find((t) => isTaskOwnedByCurrentUser(t) && t.status === 'assigned');

  // Math parameters for SVG Circular Layout
  const svgSize = 460;
  const center = svgSize / 2;
  const ringRadius = 175; // Distance from center to nodes
  const nodeRadius = totalTasks > 25 ? 18 : 22;

  // Filter match helper
  const isNodeVisible = (task: GroupTask) => {
    if (filterState === 'all') return true;
    if (filterState === 'available') return task.status === 'available';
    if (filterState === 'mine') return isTaskOwnedByCurrentUser(task);
    if (filterState === 'completed') return task.status === 'completed';
    return true;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
      {/* Visual Ring Stage */}
      <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 rounded-3xl text-white shadow-xl border border-emerald-800/40 w-full max-w-[500px]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-[11px] mb-2 z-10">
          <button
            onClick={() => setFilterState('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterState === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tümü ({totalTasks})
          </button>
          <button
            onClick={() => setFilterState('available')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterState === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Boşta ({availableCount})
          </button>
          <button
            onClick={() => setFilterState('mine')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterState === 'mine' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bana Ait
          </button>
          <button
            onClick={() => setFilterState('completed')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterState === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Okunan ({completedCount})
          </button>
        </div>

        {/* Circular SVG Canvas */}
        <div className="relative w-full aspect-square max-w-[420px] sm:max-w-[440px] flex items-center justify-center">
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="w-full h-full select-none"
          >
            <defs>
              {/* Radial gradient background */}
              <radialGradient id="ring-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#064E3B" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
              </radialGradient>

              {/* Gold gradient for completed outer circle */}
              <linearGradient id="gold-track" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>

              <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sacred Geometry Background Rings */}
            <circle cx={center} cy={center} r={ringRadius + 28} fill="none" stroke="#047857" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
            <circle cx={center} cy={center} r={ringRadius} fill="url(#ring-glow)" stroke="#065F46" strokeWidth="1.5" opacity="0.5" />
            <circle cx={center} cy={center} r={ringRadius - 28} fill="none" stroke="#FBBF24" strokeWidth="0.75" opacity="0.25" />

            {/* Connecting Arc track */}
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Progress Arc */}
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke="url(#gold-track)"
              strokeWidth="3.5"
              strokeDasharray={`${2 * Math.PI * ringRadius}`}
              strokeDashoffset={`${2 * Math.PI * ringRadius * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-700"
            />

            {/* Interactive Nodes */}
            {tasks.map((task, i) => {
              // Calculate angle starting from top (-90 deg = -PI/2)
              const angle = ((2 * Math.PI) / totalTasks) * i - Math.PI / 2;
              const x = center + ringRadius * Math.cos(angle);
              const y = center + ringRadius * Math.sin(angle);

              const isCompleted = task.status === 'completed';
              const isAssigned = task.status === 'assigned';
              const isAvailable = task.status === 'available';
              const isSelected = selectedTask?.taskIndex === task.taskIndex;
              const isHovered = hoveredTaskIndex === task.taskIndex;
              const isMine = isTaskOwnedByCurrentUser(task);
              const isDimmed = !isNodeVisible(task);

              // Colors based on state
              let fillColor = '#1E293B'; // available slate
              let strokeColor = '#334155';
              let textColor = '#94A3B8';

              if (isCompleted) {
                fillColor = isHovered ? '#047857' : '#059669'; // Emerald
                strokeColor = '#FBBF24'; // Gold border
                textColor = '#FFFFFF';
              } else if (isAssigned) {
                fillColor = isMine ? (isHovered ? '#0f766e' : '#0D9488') : (isHovered ? '#b45309' : '#D97706'); // Teal if mine, Amber if others
                strokeColor = isMine ? '#2DD4BF' : '#FCD34D';
                textColor = '#FFFFFF';
              } else {
                fillColor = isHovered ? '#1e293b' : '#0F172A';
                strokeColor = isHovered ? '#34d399' : '#10B981';
                textColor = '#6EE7B7';
              }

              if (isSelected) {
                strokeColor = '#FFFFFF';
              }

              const currentRadius = isSelected ? nodeRadius + 3 : isHovered ? nodeRadius + 2 : nodeRadius;

              return (
                <g
                  key={task.id}
                  onClick={() => {
                    HapticFeedback.selection();
                    setSelectedTaskIndex(task.taskIndex);
                    setIsAssigningSpecific(false);
                  }}
                  onMouseEnter={() => setHoveredTaskIndex(task.taskIndex)}
                  onMouseLeave={() => setHoveredTaskIndex(null)}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.2 : 1}
                  filter={isSelected ? 'url(#node-glow)' : undefined}
                >
                  {/* Invisible static hit target to prevent any jittering */}
                  <circle
                    cx={x}
                    cy={y}
                    r={nodeRadius + 6}
                    fill="transparent"
                  />

                  {/* Outer selection ring if selected */}
                  {isSelected && (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r={nodeRadius + 7}
                        fill="none"
                        stroke="#FDE047"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        className="pointer-events-none opacity-90"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={nodeRadius + 10}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        className="pointer-events-none opacity-40"
                      />
                    </>
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={currentRadius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : isCompleted ? 2 : 1.5}
                    className="pointer-events-none transition-all duration-150"
                  />

                  {/* Text or Icon */}
                  {isCompleted ? (
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none"
                    >
                      ✓
                    </text>
                  ) : (
                    <text
                      x={x}
                      y={y + 3.5}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={totalTasks > 25 ? '10' : '11'}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {task.taskIndex}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Central Meclis HUD / Summary Card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center pointer-events-auto shadow-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                {group.type === 'hatim' ? 'Hatm-i Şerif' : group.type === 'cevsen' ? 'Cevşen Meclisi' : 'Dua Halkası'}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono my-0.5">
                %{progressPercent}
              </div>
              <div className="text-[11px] text-slate-300 font-semibold">
                {completedCount} / {totalTasks} {group.tasks ? 'Cüz' : 'Bölüm'}
              </div>

              {progressPercent === 100 ? (
                <button
                  onClick={onOpenCelebrationModal}
                  className="mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-emerald-950 text-[10px] font-extrabold shadow-md animate-pulse flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-900" />
                  <span>Hatim Duası 🤲</span>
                </button>
              ) : myPendingTask ? (
                <button
                  onClick={() => {
                    setSelectedTaskIndex(myPendingTask.taskIndex);
                  }}
                  className="mt-2 px-2.5 py-1 rounded-full bg-emerald-700/90 hover:bg-emerald-600 text-white text-[10px] font-bold border border-emerald-400/40 shadow-xs flex items-center gap-1"
                >
                  <span>{myPendingTask.taskIndex}. Cüzünüz →</span>
                </button>
              ) : firstAvailableTask ? (
                <button
                  onClick={() => {
                    setSelectedTaskIndex(firstAvailableTask.taskIndex);
                  }}
                  className="mt-2 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1"
                >
                  <span>Boş Cüz Seç ({firstAvailableTask.taskIndex})</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mini Legend Bottom */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-300 pt-2 border-t border-white/10 w-full">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-amber-300" />
            <span>Okundu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Okunuyor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-emerald-500" />
            <span>Boşta (Al)</span>
          </div>
        </div>
      </div>

      {/* Selected Task Details & Action Panel */}
      <div className="w-full lg:flex-1 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
        {selectedTask ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {selectedTask.taskIndex}. Sıra
                  </span>
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                    {selectedTask.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {group.type === 'hatim'
                    ? `Kur'an-ı Kerim ${selectedTask.taskIndex}. Cüz Tilaveti (20 Sayfa)`
                    : `${group.title} kapsamında parça`}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {selectedTask.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Okundu
                  </span>
                ) : selectedTask.status === 'assigned' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Okunuyor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-emerald-700 font-bold text-xs border border-emerald-200">
                    Boşta / Alınabilir
                  </span>
                )}
              </div>
            </div>

            {/* Assigned Member Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Okuyan Kardeşimiz:</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedTask.assignedToUsername
                    ? formatUserHandle(selectedTask.assignedToUsername)
                    : selectedTask.status === 'available'
                    ? 'Henüz kimse almadı'
                    : '@kardes'}
                </span>
              </div>

              {isTaskOwnedByCurrentUser(selectedTask) && (
                <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bu cüzü üzerinize aldınız. Tilavetiniz bitince tamamlandı olarak işaretleyebilirsiniz.</span>
                </div>
              )}
            </div>

            {/* Direct Quran Reading Link */}
            {group.type === 'hatim' && onOpenJuzInQuranReader && (
              <button
                onClick={() => onOpenJuzInQuranReader(selectedTask.taskIndex)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 group"
              >
                <BookOpen className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                <span>{selectedTask.taskIndex}. Cüzü Kur'an-ı Kerim Okuyucuda Aç (Arapça & Meal)</span>
              </button>
            )}

            {/* Interactive Actions based on ownership and status */}
            <div className="pt-2">
              {selectedTask.status === 'completed' ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bu cüzün tilaveti tamamlandı. Allah kabul eylesin.</span>
                  </div>
                  {isTaskOwnedByCurrentUser(selectedTask) && (
                    <button
                      onClick={() => onUncompleteTask(group.id, selectedTask.taskIndex)}
                      className="text-xs text-slate-500 hover:text-rose-600 font-semibold underline px-2"
                    >
                      Geri Al
                    </button>
                  )}
                </div>
              ) : selectedTask.status === 'assigned' ? (
                isTaskOwnedByCurrentUser(selectedTask) ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        HapticFeedback.success();
                        onCompleteTask(group.id, selectedTask.taskIndex);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tamamlandı Olarak İşaretle ✓</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Bu cüz {selectedTask.assignedToUsername} tarafından okunmaktadır.</span>
                    </div>
                  </div>
                )
              ) : isAssigningSpecific ? (
                /* Specific Assign form */
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kardeşinize Cüz Atayın
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="örn: @ahmet_kardes"
                        value={assigneeHandleInput}
                        onChange={(e) => setAssigneeHandleInput(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <AtSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2 top-2.5" />
                    </div>
                    <button
                      onClick={() => {
                        if (assigneeHandleInput.trim()) {
                          onAssignTask(group.id, selectedTask.taskIndex, assigneeHandleInput);
                          setIsAssigningSpecific(false);
                          setAssigneeHandleInput('');
                        }
                      }}
                      disabled={!assigneeHandleInput.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50"
                    >
                      Ata
                    </button>
                    <button
                      onClick={() => setIsAssigningSpecific(false)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                /* Available Actions */
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssignTask(group.id, selectedTask.taskIndex)}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Bu Cüzü Üzerime Alıyorum</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAssigningSpecific(true);
                      setAssigneeHandleInput('');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1"
                    title="@Kullanıcıya Ata"
                  >
                    <AtSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Başkasına Ata</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Lütfen çember üzerinden bir cüz seçiniz.
          </div>
        )}

        {/* Quick helper note */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>İpucu: Çember üzerindeki numaralara dokunarak cüzler arasında hızla gezinebilirsiniz.</span>
        </div>
      </div>
    </div>
  );
};
