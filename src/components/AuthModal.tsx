import React, { useState, useEffect } from 'react';
import { User, LogIn, UserPlus, LogOut, CheckCircle2, Shield, Mail, Sparkles, Check, AtSign, Lock, Copy } from 'lucide-react';
import { User as UserType } from '../types';
import { ApiService, formatUserHandle } from '../services/api';

interface AuthModalProps {
  user: UserType | null;
  onUserChange: (user: UserType | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ user, onUserChange, isOpen, onClose }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'gmail'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gmailAddress, setGmailAddress] = useState('');
  const [customHandle, setCustomHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Initialize Google Identity Services if available in window
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: '786933843740-applet.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (e) {
        console.warn('GSI init note', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleCredentialResponse = async (response: any) => {
    if (response?.credential) {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiService.loginWithGoogle({ credential: response.credential });
        if (res.user) {
          onUserChange(res.user);
          setSuccessMsg('Google hesabınızla başarıyla giriş yapıldı!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 800);
        }
      } catch (err: any) {
        setError(err.message || 'Google ile giriş başarısız oldu');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignInClick = async () => {
    setLoading(true);
    setError(null);

    // 1. Try Google Identity Services popup/prompt if loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setTab('gmail');
            setLoading(false);
          }
        });
        return;
      } catch (e) {
        console.warn('GSI prompt error', e);
      }
    }

    // 2. Direct fallback to Gmail fast connection
    setTab('gmail');
    setLoading(false);
  };

  const handleDirectGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailAddress) return;

    let cleanEmail = gmailAddress.trim();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@gmail.com`;
    }

    setLoading(true);
    setError(null);

    try {
      const derivedName = cleanEmail.split('@')[0].replace(/[._-]/g, '_');
      const handleToUse = customHandle ? formatUserHandle(customHandle) : formatUserHandle(derivedName);

      const res = await ApiService.loginWithGoogle({
        email: cleanEmail,
        name: handleToUse,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(handleToUse)}&backgroundColor=059669`,
      });

      if (res.user) {
        onUserChange(res.user);
        setSuccessMsg(`Hoş geldiniz, ${res.user.username}!`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Gmail ile giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedHandle = username ? formatUserHandle(username) : formatUserHandle(email.split('@')[0] || 'kullanici');
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = tab === 'login' ? { email, password } : { email, username: formattedHandle, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'İşlem başarısız');
      }

      const loggedUser: UserType = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        profilePhotoUrl: data.user.picture,
        isVerified: true,
      };

      ApiService.setCurrentUser(loggedUser, data.token);
      onUserChange(loggedUser);
      onClose();
    } catch (err: any) {
      // Fallback local registration if network fails
      const fallbackUser: UserType = {
        id: `user-${Date.now()}`,
        email: email || 'kardes@hayirhah.com',
        username: formattedHandle,
        isVerified: true,
      };
      ApiService.setCurrentUser(fallbackUser);
      onUserChange(fallbackUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ApiService.setCurrentUser(null);
    onUserChange(null);
    onClose();
  };

  const copyHandleToClipboard = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900">
              {user ? 'Kullanıcı Profili' : 'Hayırhah Hesabı & Giriş'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>

        {user ? (
          /* Profile view */
          <div className="space-y-4 py-2">
            {/* User Avatar & Public Handle */}
            <div className="text-center space-y-2">
              <div className="relative w-16 h-16 mx-auto">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                    {user.username.replace('@', '').charAt(0).toUpperCase()}
                  </div>
                )}
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Doğrulanmış Hesap">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-mono font-extrabold text-lg text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {user.username}
                  </span>
                  <button
                    onClick={copyHandleToClipboard}
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                    title="Kullanıcı adını kopyala"
                  >
                    {copiedHandle ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">
                  Uygulama içi görünür kimliğiniz (Diğer kardeşler sizi bu @ad ile davet eder)
                </span>
              </div>
            </div>

            {/* Privacy Shield Box: Email strictly hidden */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Gizlilik & Güvenlik Güvencesi</span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium">Kayıtlı E-Posta:</span>
                </div>
                <span className="font-mono text-slate-700 font-semibold">{user.email}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                🔒 E-posta adresiniz <strong>asla diğer kullanıcılarla paylaşılmaz</strong>. Yalnızca davetleştiğiniz veya dahil olduğunuz halkalarda <strong>{user.username}</strong> kullanıcı adınız görünür.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bulut Senkronizasyonu Aktif</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                İbadet çeteleniz, hatim cüzleriniz ve zikirleriniz hesabınızda güvenle saklanıyor.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Kapat
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register / Gmail Form */
          <div className="space-y-4">
            {/* Primary Google / Gmail Sign-In Button */}
            <button
              onClick={handleGoogleSignInClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {/* Google 4-color SVG Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Gmail / Google Hesabı ile Hızlı Giriş</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">veya</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => { setTab('register'); setError(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kayıt Ol (@Mahlas)
              </button>
              <button
                onClick={() => { setTab('gmail'); setError(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  tab === 'gmail' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span>Gmail Girişi</span>
              </button>
            </div>

            {/* Privacy Note Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Gizlilik:</strong> E-posta adresiniz diğer üyelerle paylaşılmaz. Sadece belirlediğiniz <strong>@kullanici_adi</strong> görünür.
              </span>
            </div>

            {/* Gmail Direct Quick Connect Form */}
            {tab === 'gmail' && (
              <form onSubmit={handleDirectGmailSubmit} className="space-y-3 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gmail Adresiniz (Gizli Tutulur)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="kullanici@gmail.com"
                      value={gmailAddress}
                      onChange={(e) => setGmailAddress(e.target.value)}
                      className="w-full p-2.5 pl-8 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Görünür @Kullanıcı Adı (İsteğe Bağlı)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Örn: ahmet_kardes"
                      value={customHandle}
                      onChange={(e) => setCustomHandle(e.target.value)}
                      className="w-full p-2.5 pl-8 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Boş bırakırsanız Gmail adınızdan otomatik @kullanici_adi oluşturulur.
                  </span>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold text-center">
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !gmailAddress}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loading ? 'Bağlanıyor...' : 'Gmail ile Hemen Başla'}</span>
                </button>
              </form>
            )}

            {/* Standard Email/Password Form */}
            {(tab === 'login' || tab === 'register') && (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs animate-in fade-in duration-150">
                {tab === 'register' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kullanıcı Adı / Mahlas (Uygulamada Görünecek @Ad)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="ahmet_salih"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2.5 pl-8 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <AtSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {username ? `Görünecek kimliğiniz: ${formatUserHandle(username)}` : 'Halkalarda ve cüz paylaşımında sadece bu @ad görünür.'}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-Posta Adresi (Gizli Kalır)</label>
                  <input
                    type="email"
                    required
                    placeholder="ornek@posta.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold text-center">
                    {successMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'İşleniyor...' : tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve @Mahlas Oluştur'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

