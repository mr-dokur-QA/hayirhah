import React, { useState, useEffect } from 'react';
import { Settings, Bell, Volume2, Shield, Send, Check, Smartphone, Radio, History } from 'lucide-react';
import { ApiService } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'fcm' | 'history'>('general');
  const [method, setMethod] = useState('13'); // Diyanet
  const [azanSound, setAzanSound] = useState('istanbul');
  const [enableNotifs, setEnableNotifs] = useState(true);
  const [enablePrayerPush, setEnablePrayerPush] = useState(true);
  const [enableGroupPush, setEnableGroupPush] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState('15');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadLogs();
    }
  }, [isOpen, activeTab]);

  const loadLogs = async () => {
    const data = await ApiService.getNotificationHistory();
    if (data && data.logs) {
      setNotificationLogs(data.logs);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleSendTestPush = async () => {
    setIsTesting(true);
    setTestStatus('Bildirim gönderiliyor...');
    try {
      const res = await ApiService.sendTestNotification();
      if (res && res.success) {
        setTestStatus('✅ Test bildirimi FCM servisine iletildi!');
        loadLogs();
      } else {
        setTestStatus('⚠️ Bildirim iletildi.');
      }
    } catch (e) {
      setTestStatus('❌ Hata oluştu');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus(null), 4000);
    }
  };

  const handleSendPrayerTestAlert = async () => {
    setIsTesting(true);
    setTestStatus('Ezan vakti bildirimi gönderiliyor...');
    try {
      const res = await ApiService.sendPrayerNotificationAlert({
        prayerName: 'ikindi',
        cityName: 'İstanbul',
        prayerTimeStr: '16:32',
        sound: azanSound,
      });
      if (res && res.success) {
        setTestStatus('🕌 İkindi vakti bildirimi başarıyla dağıtıldı!');
        loadLogs();
      }
    } catch (e) {
      setTestStatus('❌ Hata oluştu');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900">Uygulama & Bildirim Ayarları</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'general' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Genel & Vakitler
          </button>
          <button
            onClick={() => setActiveTab('fcm')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fcm' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>FCM Push Servisi</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bildirim Geçmişi</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {activeTab === 'general' && (
            <>
              {/* Calculation Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Namaz Vakti Hesaplama Usulü</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="13">Diyanet İşleri Başkanlığı (Türkiye)</option>
                  <option value="4">Umm Al-Qura Üniversitesi (Mekke-i Mükerreme)</option>
                  <option value="3">Muslim World League (MWL)</option>
                  <option value="2">Islamic Society of North America (ISNA)</option>
                  <option value="1">Egyptian General Authority of Survey</option>
                </select>
              </div>

              {/* Ezan Sesi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ezan Makamı / Sesi</label>
                <select
                  value={azanSound}
                  onChange={(e) => setAzanSound(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="istanbul">İstanbul Makamı (Hüzzam / Rast)</option>
                  <option value="mekke">Mescid-i Haram (Mekke Ezanı)</option>
                  <option value="medine">Mescid-i Nebevi (Medine Ezanı)</option>
                  <option value="kudus">Mescid-i Aksâ (Kudüs Ezanı)</option>
                </select>
              </div>

              {/* Vakit Bildirimleri Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Vakit Hatırlatıcıları</span>
                  <span className="text-[11px] text-slate-500 block">Vakit girdiğinde cihazda sesli/görsel uyarı ver</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableNotifs}
                  onChange={(e) => setEnableNotifs(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {/* Clear Cache / Reset */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm('Tüm yerel çetele ve hafıza verilerini sıfırlamak istiyor musunuz?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition-colors"
                >
                  Önbelleği ve Verileri Temizle
                </button>
              </div>
            </>
          )}

          {activeTab === 'fcm' && (
            <div className="space-y-3.5">
              {/* FCM Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-bold text-emerald-900 block">Firebase Cloud Messaging (FCM)</span>
                    <span className="text-[10px] text-emerald-700">Mobil & Web bildirim kanalı aktif</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Hazır
                </span>
              </div>

              {/* Prayer Times Push Channel */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">Namaz Vakitleri Push Bildirimi</span>
                    <span className="text-[11px] text-slate-500 block">5 Vakit Ezan ve İmsak hatırlatmaları</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePrayerPush}
                    onChange={(e) => setEnablePrayerPush(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </div>
                {enablePrayerPush && (
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] text-slate-600 font-medium">Önceden Hatırlat:</label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(e.target.value)}
                      className="p-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
                    >
                      <option value="0">Tam vaktinde (0 dk)</option>
                      <option value="15">15 dakika önce</option>
                      <option value="30">30 dakika önce</option>
                      <option value="45">45 dakika önce</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Group Activity Push Channel */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">Dua Halkası Etkinlik Bildirimleri</span>
                    <span className="text-[11px] text-slate-500 block">Cüz devralındığında veya hatim bittiğinde anında haber ver</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableGroupPush}
                    onChange={(e) => setEnableGroupPush(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </div>
              </div>

              {/* Test Notification Triggers */}
              <div className="pt-2 space-y-2">
                <span className="block font-bold text-slate-700">FCM Push Test Araçları</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendTestPush}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Genel Test Push</span>
                  </button>
                  <button
                    onClick={handleSendPrayerTestAlert}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5 text-white" />
                    <span>Vakit Uyarısı Testi</span>
                  </button>
                </div>
                {testStatus && (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-center font-bold text-xs animate-in fade-in">
                    {testStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-slate-700">Son Gönderilen Push Bildirimleri</span>
                <button onClick={loadLogs} className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px]">
                  Yenile
                </button>
              </div>
              {notificationLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p>Henüz kayıtlı bildirim bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{log.body}</p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {log.target}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-bold">● İletildi</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
          >
            Kapat
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
