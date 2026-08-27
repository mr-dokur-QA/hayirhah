import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, Copy, Check, Heart, BookOpen, Users, Share2, Award, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Group, User } from '../types';
import { formatUserHandle } from '../services/api';
import { CrescentStarLogo } from './CrescentStarLogo';
import confetti from 'canvas-confetti';

interface HatimCelebrationModalProps {
  group: Group;
  currentUser: User | null;
  onClose: () => void;
}

export const HatimCelebrationModal: React.FC<HatimCelebrationModalProps> = ({
  group,
  currentUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dua' | 'participants' | 'card'>('dua');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#FDE047', '#059669'],
    });
  }, []);

  // Aggregate participant stats from tasks or numbered assignments
  const participantsSummary = React.useMemo(() => {
    const map = new Map<string, { count: number; tasks: string[] }>();

    if (group.tasks && group.tasks.length > 0) {
      group.tasks.forEach((t) => {
        if (t.status === 'completed' || t.status === 'assigned') {
          const handle = t.assignedToUsername ? formatUserHandle(t.assignedToUsername) : '@kardes';
          const existing = map.get(handle) || { count: 0, tasks: [] };
          existing.count += 1;
          existing.tasks.push(t.title);
          map.set(handle, existing);
        }
      });
    } else if (group.numberedAssignments && group.numberedAssignments.length > 0) {
      group.numberedAssignments.forEach((a) => {
        const handle = a.userUsername ? formatUserHandle(a.userUsername) : '@kardes';
        const existing = map.get(handle) || { count: 0, tasks: [] };
        existing.count += (a.completedCount || a.assignedCount);
        existing.tasks.push(`${a.completedCount || a.assignedCount} Adet`);
        map.set(handle, existing);
      });
    }

    return Array.from(map.entries()).map(([username, data]) => ({
      username,
      count: data.count,
      tasks: data.tasks,
    }));
  }, [group]);

  const totalCompleted = group.tasks
    ? group.tasks.filter((t) => t.status === 'completed').length
    : group.currentProgress;

  const totalTarget = group.targetCount || 30;

  // Generate WhatsApp / Telegram share text
  const getShareText = () => {
    const participantsList = participantsSummary
      .map((p) => `• ${p.username} (${p.count} ${group.tasks ? 'Cüz' : 'Adet'})`)
      .join('\n');

    return `✨ *HAYIRHAH DUA MECLİSİ - HATİM BERAATI* ✨\n\n` +
      `📖 *Halka:* ${group.title}\n` +
      `🎯 *Tamamlanan:* ${totalCompleted} / ${totalTarget} ${group.tasks ? 'Cüz' : 'Parça'}\n` +
      `🗓️ *Tarih:* ${new Date().toLocaleDateString('tr-TR')}\n\n` +
      `🤲 *Halka Katılımcıları:*\n${participantsList}\n\n` +
      `"Allah'ım! Okunan bu hatm-i şerifi ve zikirleri dergâh-ı izzetinde kabul eyle. Hâsıl olan sevabı başta Sevgili Peygamberimiz Hz. Muhammed (s.a.v.)'in aziz ruhuna, ehl-i beytine, ashabına, şehitlerimize, geçmişlerimize ve bu halkada hissesi olan tüm kardeşlerimize bağışladık. Âmin!"\n\n` +
      `Hayırhah Kardeşliği ile tamamlandı. 🌙`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getShareText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Download High-Res Canvas Image Certificate
  const handleDownloadImage = () => {
    setIsDownloading(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsDownloading(false);
      return;
    }

    // 1. Background Rich Deep Emerald Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 900);
    bgGrad.addColorStop(0, '#064E3B');
    bgGrad.addColorStop(0.5, '#022C22');
    bgGrad.addColorStop(1, '#064E3B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 900);

    // 2. Ornate Golden Border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1120, 820);

    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1090, 790);

    // Corner rosettes
    const drawCorner = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawCorner(55, 55);
    drawCorner(1145, 55);
    drawCorner(55, 845);
    drawCorner(1145, 845);

    // 3. Header Text (Islamic Calligraphy feel)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّح۪يمِ', 600, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('HATM-İ ŞERİF BERAATI', 600, 190);

    ctx.fillStyle = '#A7F3D0';
    ctx.font = '22px sans-serif';
    ctx.fillText('Hayırhah İbadet ve Dua Kardeşliği Meclisi', 600, 230);

    // 4. Group Title & Badge Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(160, 270, 880, 100, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(group.title, 600, 325);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Tamamlanan: ${totalCompleted} / ${totalTarget} ${group.tasks ? 'Cüz Tilaveti' : 'Zikir'} • Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 600, 355);

    // 5. Participants List Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.roundRect(160, 395, 880, 220, 20);
    ctx.fill();

    ctx.fillStyle = '#6EE7B7';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('HALKA KATILIMCILARI VE CÜZ KARDEŞLERİ', 600, 435);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    const topParticipants = participantsSummary.slice(0, 12);
    const colWidth = 260;
    topParticipants.forEach((p, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const px = 240 + col * colWidth;
      const py = 480 + row * 38;
      ctx.textAlign = 'left';
      ctx.fillText(`${p.username} (${p.count} Cüz)`, px, py);
    });

    // 6. Sincere Hatim Dua Excerpt
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'italic 19px serif';
    ctx.fillText('"Rabbimiz! Okunan bu hatm-i şerifi dergâh-ı izzetinde makbul eyle."', 600, 670);
    ctx.fillText('"Sevabını Sevgili Peygamberimiz (s.a.v.)\'e, ehl-i beytine ve bu mecliste hissesi olan kardeşlerimize bağışladık."', 600, 700);

    // 7. Footer Stamp & Crescent
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('HAYIRHAH DUA HALKASI • MÜMİNİN MÜMİNE GÖNÜL DUASI', 600, 810);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Hayirhah-Hatim-Berati-${group.inviteCode || 'Hatim'}.png`;
    link.href = dataUrl;
    link.click();

    setTimeout(() => setIsDownloading(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-start justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" />
                Hatm-i Şerif Meclisi
              </span>
              <span className="text-emerald-200 text-xs font-semibold">
                {totalCompleted}/{totalTarget} Tamamlandı
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{group.title}</h3>
            <p className="text-xs text-emerald-100/90">
              Kardeşlerimizin müşterek tilavet ve zikirleriyle tamamlanan hayırlı hatim meclisi.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-4">
          <button
            onClick={() => setActiveTab('dua')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'dua'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Hatim Duası Metni</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'participants'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Halka Kardeşleri ({participantsSummary.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'card'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Tebrik & Berat Kartı</span>
          </button>
        </div>

        {/* Modal Body Viewport */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[60vh]">
          {/* TAB 1: Hatim Duası */}
          {activeTab === 'dua' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Arabic Traditional Hatim Invocation */}
              <div className="p-5 rounded-3xl bg-emerald-950 text-white space-y-4 border border-emerald-800 shadow-inner text-center">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block">
                  دُعَاءُ خَتْمِ الْقُرْآنِ الْكَرِيمِ
                </span>
                <p className="font-arabic text-xl sm:text-2xl leading-loose text-amber-100 text-right dir-rtl">
                  صَدَقَ اللهُ الْعَظِيمُ، وَبَلَّغَ رَسُولُهُ الْكَرِيمُ، وَنَحْنُ عَلَى ذَلِكَ مِنَ الشَّاهِدِينَ وَالشَّاكِرِينَ.
                  اللَّهُمَّ رَبَّنَا تَقَبَّلْ مِنَّا خَتْمَ الْقُرْآنِ الْعَظِيمِ، وَاجْعَلْهُ لَنَا نُوراً وَهُدًى وَرَحْمَةً وَشِفَاءً.
                </p>
                <div className="text-xs text-emerald-200 font-serif italic pt-2 border-t border-emerald-800/80">
                  "Sadakallâhül-azîm. Ve beleğa rasûlühül-kerîm. Ve nahnü alâ zâlike mineş-şâhidîne veş-şâkirîn..."
                </div>
              </div>

              {/* Türkçe Bağışlama & İcazet Duası */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-3">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Müşterek Hatim Bağışlama Duası (Birlikte Âmin)</span>
                </h4>
                <p>
                  <strong>Elhamdülillâhi Rabbi'l-âlemîn.</strong> Es-salâtü ve's-selâmü alâ Rasûlinâ Muhammedin ve alâ âlihî ve sahbihî ecmaîn.
                </p>
                <p>
                  Ey yerleri ve gökleri yoktan var eden, kalplerimize iman ve Kur'an sevgisini nakşeden Yüce Rabbimiz! 
                  Senin rızan doğrultusunda, kardeşlerimizle el ve gönül birliği yaparak okuduğumuz bu <strong>{group.title}</strong> tilavetini, salavatları ve zikirleri dergâh-ı izzetinde en güzel şekilde kabul eyle.
                </p>
                <p>
                  Hâsıl olan sevabı; evvela Âlemlere Rahmet olarak gönderdiğin Sevgili Peygamberimiz Hz. Muhammed Mustafa (s.a.v.)'in pâk ve aziz ruhuna hediye eyledik, vâsıl eyle Ya Rabbi!
                </p>
                <p>
                  Bütün peygamberlerin, sahabe-i kiramın, ehl-i beytin, şehitlerimizin, gazilerimizin ve bu dünyadan ahirete göç etmiş tüm ecdadımızın, anne-babalarımızın ve yakınlarımızın ruhlarına hediye eyledik, haberdar eyle Ya Rabbi!
                </p>
                <p className="bg-emerald-100/60 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-950 dark:text-emerald-200">
                  🤲 Özel İntisap: Bu hatim halkasında cüz alan, okuyan, vesile olan ve amin diyen bütün kardeşlerimizin hanelerine huzur, gönüllerine inşirah, rızıklarına bereket, bedenlerine afiyet ve sıhhat ihsan eyle. İki cihanda aziz ve bahtiyar eyle. Âmin!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Halka Katılımcıları */}
          {activeTab === 'participants' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Cüz ve Zikir Kardeşliği Listesi</h4>
                  <p className="text-xs text-slate-500">Bu halkada emeği ve hissesi bulunan kardeşlerimiz:</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {participantsSummary.length} Mümin Kardeş
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participantsSummary.map((part, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {part.username.charAt(1).toUpperCase() || 'K'}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                          {part.username}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {part.tasks.join(', ')}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      {part.count} {group.tasks ? 'Cüz' : 'Adet'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Tebrik & Berat Kartı (Görsel ve WhatsApp Paylaşımı) */}
          {activeTab === 'card' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Card Preview Frame */}
              <div
                ref={certificateRef}
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white border-4 border-amber-400/80 shadow-2xl relative overflow-hidden space-y-5 text-center"
              >
                {/* Background ambient lighting */}
                <div className="absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent pointer-events-none" />

                {/* Card Header */}
                <div className="space-y-1 relative z-10">
                  <div className="flex justify-center mb-2">
                    <CrescentStarLogo className="w-12 h-12" />
                  </div>
                  <span className="text-amber-300 font-arabic text-lg block">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّح۪يمِ</span>
                  <h3 className="font-black text-xl sm:text-2xl text-amber-200 tracking-tight">
                    HATM-İ ŞERİF BERAATI
                  </h3>
                  <span className="text-xs text-emerald-200 font-medium tracking-wide uppercase">
                    Hayırhah İbadet & Dua Kardeşliği
                  </span>
                </div>

                {/* Group Details in Certificate */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs relative z-10 space-y-1">
                  <h4 className="font-bold text-base text-white">{group.title}</h4>
                  <p className="text-xs text-emerald-200">
                    {totalCompleted} / {totalTarget} {group.tasks ? 'Cüz Tilaveti' : 'Zikir'} İkmal Edildi
                  </p>
                  <div className="text-[11px] text-slate-300 font-mono pt-1">
                    Halka Kodu: #{group.inviteCode} • {new Date().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {/* Contributor tags */}
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold block mb-2">
                    Bu Hatimde Hissesi Olan Kardeşlerimiz:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-24 overflow-y-auto">
                    {participantsSummary.map((p, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-[11px] font-mono font-semibold text-emerald-100"
                      >
                        {p.username} ({p.count})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sincere concluding prayer */}
                <p className="text-xs text-amber-100/90 italic font-serif relative z-10 pt-2 border-t border-white/15">
                  "Rabbimiz yapılan hatimleri, çekilen zikirleri ve edilen duaları kabul buyursun. Âmin."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCopyText}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{isCopied ? 'Metin Kopyalandı ✓' : 'WhatsApp İçin Metni Kopyala'}</span>
                </button>

                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>{isDownloading ? 'Görsel Hazırlanıyor...' : 'Görsel Kart Olarak İndir'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Halka ID: <strong className="font-mono">{group.inviteCode}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
