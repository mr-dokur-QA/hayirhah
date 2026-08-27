import React, { useState, useEffect } from 'react';
import { Heart, Plus, MessageCircle, Sparkles, CheckCircle2, Send, AtSign, Filter, BookOpen, Clock } from 'lucide-react';
import { PrayerRequest, User } from '../types';
import { ApiService, formatUserHandle } from '../services/api';
import confetti from 'canvas-confetti';

interface GroupPrayerRequestsProps {
  groupId?: string;
  currentUser: User | null;
}

export const GroupPrayerRequests: React.FC<GroupPrayerRequestsProps> = ({ groupId, currentUser }) => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [aminAnimatingId, setAminAnimatingId] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<PrayerRequest['category']>('shifa');
  const [formTitle, setFormTitle] = useState('');
  const [formIntention, setFormIntention] = useState('');
  const [formDhikrType, setFormDhikrType] = useState('Fâtiha');
  const [formTargetCount, setFormTargetCount] = useState<number>(100);

  const loadRequests = () => {
    const data = ApiService.getPrayerRequests(groupId);
    setRequests(data);
  };

  useEffect(() => {
    loadRequests();
  }, [groupId]);

  const handleRespond = (
    requestId: string,
    type: 'amin' | 'fatiha' | 'ihlas' | 'salavat' | 'shafi' | 'message',
    count: number = 1,
    msg?: string
  ) => {
    if (type === 'amin') {
      setAminAnimatingId(requestId);
      setTimeout(() => setAminAnimatingId(null), 1000);
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#10b981', '#f59e0b', '#fbbf24'],
      });
    }

    ApiService.respondToPrayerRequest(requestId, type, count, msg);
    loadRequests();
  };

  const handleSendMessage = (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    handleRespond(requestId, 'message', 0, replyMessage.trim());
    setReplyMessage('');
    setReplyingToId(null);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formIntention.trim()) return;

    ApiService.addPrayerRequest({
      groupId,
      category: formCategory,
      title: formTitle.trim(),
      intention: formIntention.trim(),
      targetDhikrType: formDhikrType,
      targetCount: formTargetCount || 100,
    });

    setIsCreateOpen(false);
    setFormTitle('');
    setFormIntention('');
    loadRequests();

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#059669', '#34d399', '#fef08a'],
    });
  };

  const getCategoryBadge = (cat: PrayerRequest['category']) => {
    switch (cat) {
      case 'shifa':
        return { label: '🩺 Şifâ & Sağlık', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'exam_work':
        return { label: '🎓 İlim & Sınav/İş', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'vefat':
        return { label: '🕊️ Ruhuna Fâtiha', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'hacet':
        return { label: '🤲 Hâcet & Kolaylık', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' };
      case 'shukur':
        return { label: '🌸 Şükür & Bereket', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      default:
        return { label: '🌿 Ruhi Ferahlık', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Request Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white shadow-lg border border-emerald-700/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">Kardeşimin Duasına Âmin</h3>
          </div>
          <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
            "Bir müminin din kardeşi için gıyabında yaptığı dua makbuldür." Birbirimizin hacet, şifa ve sevinçlerine duayla omuz verelim.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0 hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Dua Talebi Aç</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Tüm Dualar ({requests.length})
        </button>
        {[
          { key: 'shifa', label: '🩺 Şifâ Duaları' },
          { key: 'hacet', label: '🤲 Hâcet & Niyet' },
          { key: 'exam_work', label: '🎓 İlim & Sınav' },
          { key: 'vefat', label: '🕊️ Geçmişlerin Ruhuna' },
          { key: 'shukur', label: '🌸 Şükür & Bereket' },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const badge = getCategoryBadge(req.category);
            const isFinished = req.isCompleted || (req.targetCount && req.currentCount >= req.targetCount);
            const percent = req.targetCount ? Math.min(100, Math.round((req.currentCount / req.targetCount) * 100)) : 0;
            const isReplying = replyingToId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Top Category & User */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-emerald-600" />
                      {req.authorUsername ? formatUserHandle(req.authorUsername) : '@kardes'}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-2">{req.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                    "{req.intention}"
                  </p>
                </div>

                {/* Target Progress Bar (if targeted) */}
                {req.targetCount && req.targetCount > 0 && (
                  <div className="space-y-1.5 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                      <span>Hedef ({req.targetDhikrType || 'Zikir'}):</span>
                      <span className="font-bold font-mono">
                        {req.currentCount} / {req.targetCount} (%{percent})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-emerald-200/70 dark:bg-emerald-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sincere Interaction Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    {/* Amin Button */}
                    <button
                      onClick={() => handleRespond(req.id, 'amin', 1)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                        aminAnimatingId === req.id
                          ? 'bg-rose-500 text-white scale-105'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${aminAnimatingId === req.id ? 'fill-white' : 'fill-rose-500'}`} />
                      <span>Âmin ({req.aminCount || 0})</span>
                    </button>

                    {/* Dhikr Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRespond(req.id, 'fatiha', 1, '1 Fâtiha-i Şerife hediye edildi.')}
                        className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold"
                        title="1 Fâtiha Okudum"
                      >
                        +1 Fâtiha
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'ihlas', 1, '1 İhlâs-ı Şerif hediye edildi.')}
                        className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold"
                        title="1 İhlas Okudum"
                      >
                        +1 İhlâs
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'salavat', 10, '10 Salavât-ı Şerife hediye edildi.')}
                        className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold"
                        title="10 Salavat Çektim"
                      >
                        +10 Salavât
                      </button>
                    </div>

                    {/* Message Toggle */}
                    <button
                      onClick={() => setReplyingToId(isReplying ? null : req.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                      title="Dua Mesajı Bırak"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{req.responses?.length || 0}</span>
                    </button>
                  </div>

                  {/* Messages Dropdown & Form */}
                  {isReplying && (
                    <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                      {/* Recent responses */}
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {req.responses && req.responses.length > 0 ? (
                          req.responses.map((resp) => (
                            <div
                              key={resp.id}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex flex-col gap-0.5"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span className="font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                                  {resp.userUsername}
                                </span>
                                <span>{new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 text-[11px] font-medium">
                                {resp.message || (resp.type === 'amin' ? '🤲 Âmin dedi' : `${resp.count} adet ${resp.type} okudu.`)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 py-1 text-center">İlk dua mesajını siz bırakın.</div>
                        )}
                      </div>

                      {/* Reply Input Form */}
                      <form onSubmit={(e) => handleSendMessage(e, req.id)} className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Manevi destek ve dua cümleniz..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          disabled={!replyMessage.trim()}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Bu kategoride henüz dua talebi bulunmuyor</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Halkadaki kardeşlerinizden şifa, hacet veya geçmişlerinizin ruhu için Fatiha ve zikir talep etmek için yeni bir dua talebi başlatabilirsiniz.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            İlk Dua Talebini Aç
          </button>
        </div>
      )}

      {/* New Prayer Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Kardeşlik Dua Talebi Aç</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {/* Pious Preset Quick Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Hazır Şablonlar (Hızlı Seçim)
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFormCategory('shifa');
                    setFormTitle('Şifa Bekleyen Hastamız İçin');
                    setFormIntention('Hastalığı sebebiyle şifa bekleyen kardeşimizin tez vakitte sağlığına kavuşması niyetiyle.');
                    setFormDhikrType('Yâ Şâfî (c.c.)');
                    setFormTargetCount(391);
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-left font-semibold border border-rose-200 dark:border-rose-900"
                >
                  🩺 Şifâ Niyeti (Yâ Şâfî)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormCategory('vefat');
                    setFormTitle('Geçmişlerimizin Ruhuna Fâtiha');
                    setFormIntention('Ahirete irtihal eden yakınlarımızın kabirlerinin pür-nur olması ve rahmet niyetiyle.');
                    setFormDhikrType('Fâtiha');
                    setFormTargetCount(70);
                  }}
                  className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-left font-semibold border border-purple-200 dark:border-purple-900"
                >
                  🕊️ Vefat & Ruhuna Fâtiha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormCategory('exam_work');
                    setFormTitle('Sınav ve İlim Muvaffakiyeti');
                    setFormIntention('Sınava ve mülakata girecek genç kardeşlerimizin zihin açıklığı ve hayırlı neticeler alması duası.');
                    setFormDhikrType('Âyetel Kürsi');
                    setFormTargetCount(100);
                  }}
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-left font-semibold border border-blue-200 dark:border-blue-900"
                >
                  🎓 Sınav & Zihin Açıklığı
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormCategory('hacet');
                    setFormTitle('Hayırlı Yuva ve Rızık Kapısı');
                    setFormIntention('Hayırlı bir evlilik ve helal rızık kapılarının açılması niyetiyle Salavat-ı Şerife halkası.');
                    setFormDhikrType('Salavât-ı Şerife');
                    setFormTargetCount(1000);
                  }}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-left font-semibold border border-amber-200 dark:border-amber-900"
                >
                  🤲 Hayırlı Kapı & Rızık
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dua Kategorisi</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PrayerRequest['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="shifa">🩺 Şifâ & Sağlık</option>
                  <option value="hacet">🤲 Hâcet & Kolaylık</option>
                  <option value="exam_work">🎓 İlim & Sınav/İş</option>
                  <option value="vefat">🕊️ Vefat & Ruhuna Fâtiha</option>
                  <option value="shukur">🌸 Şükür & Sevinç Paylaşımı</option>
                  <option value="general">🌿 Ruhi Ferahlık</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Şifa Bekleyen Kardeşimiz İçin"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niyet & Dua Detayı</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Kardeşlerinizin hangi niyetle dua etmesini arzu ettiğinizi kısaca yazın..."
                  value={formIntention}
                  onChange={(e) => setFormIntention(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hediye Edilecek Zikir/Sure</label>
                  <select
                    value={formDhikrType}
                    onChange={(e) => setFormDhikrType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Fâtiha">Fâtiha-i Şerîfe</option>
                    <option value="İhlâs-ı Şerif">İhlâs-ı Şerîf</option>
                    <option value="Âyetel Kürsi">Âyetel Kürsi</option>
                    <option value="Salavât-ı Şerife">Salavât-ı Şerîfe</option>
                    <option value="Yâ Şâfî (c.c.)">Yâ Şâfî (c.c.)</option>
                    <option value="Kelime-i Tevhid">Lâ ilâhe illallâh</option>
                    <option value="İstiğfar">Estağfirullah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hedef Adet</label>
                  <input
                    type="number"
                    min={1}
                    value={formTargetCount}
                    onChange={(e) => setFormTargetCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Dua Talebini Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
