import React, { useState } from 'react';
import { Sparkles, Bot, RefreshCw, Copy, Check, Heart, BookOpen, Flame, Award } from 'lucide-react';
import { User, DailyPrayerTracking } from '../types';
import { ApiService } from '../services/api';

interface AIAdvisorProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ user, isOpen, onClose }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateReport = async () => {
    setLoading(true);
    setReportContent(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const tracking = ApiService.getDailyTracking(todayStr);

      const completedFard = Object.values(tracking.fardPrayers || {}).filter((p) => p.isCompleted).length;
      const completedSunnet = Object.values(tracking.fardPrayers || {}).filter((p) => p.completedSunnet).length;
      const completedTesbihat = Object.values(tracking.fardPrayers || {}).filter((p) => p.completedTesbihat).length;
      const nafileCount = Object.values(tracking.sunnahPrayers || {}).filter(Boolean).length;
      const totalKaza = Object.values(tracking.kazaPrayers || {}).reduce((a, b) => a + (b || 0), 0);

      const stats = {
        completedFard,
        totalFard: 5,
        fardPercentage: Math.round((completedFard / 5) * 100),
        completedSunnet,
        completedTesbihat,
        totalQuranPages: tracking.quranReadingPages || 0,
        totalKaza,
        nafileCount,
      };

      const token = ApiService.getToken();
      const res = await fetch('/api/ai-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: reportType,
          prayerStats: stats,
        }),
      });

      const data = await res.json();
      if (data?.report?.content) {
        setReportContent(data.report.content);
      } else {
        setReportContent('Rapor üretilemedi, lütfen tekrar deneyiniz.');
      }
    } catch (e: any) {
      setReportContent('Sunucu ile iletişim kurulurken bir hata meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (reportContent) {
      navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">AI Manevi İbadet Danışmanı</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 text-amber-300 font-bold uppercase">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Kulluk gayretinizi analiz edip kalbe inşirah veren tavsiyeler ve dualar sunar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Rapor Periyodu:</span>
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  reportType === t
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'daily' ? 'Günlük' : t === 'weekly' ? 'Haftalık' : 'Aylık'}
              </button>
            ))}
          </div>

          <button
            id="ai-generate-report-btn"
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Hazırlanıyor...' : 'Rapor Oluştur'}</span>
          </button>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800">Manevi Analiz Hazırlanıyor...</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Namazlarınız, sünnetleriniz, Kur'an sayfalarınız ve dualarınız incelenerek size özel bir tavsiye mektubu derleniyor.
                </p>
              </div>
            </div>
          ) : reportContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  Manevi Muhasebe Mektubu
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 font-serif text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {reportContent}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                <Bot className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-slate-800">Kişiselleştirilmiş Manevi Rapor</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Yukarıdaki "Rapor Oluştur" butonuna basarak bugün kıldığınız namazlar, sünnetler ve okuduğunuz Kur'an ayetleri ışığında AI Manevi Danışmandan samimi bir değerlendirme alabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
