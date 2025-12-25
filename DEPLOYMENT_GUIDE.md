# 🚀 Hayırhah - Küçük Ölçekli Production Test Rehberi

## Hızlı Başlangıç Özeti

| Yöntem | Maliyet | Kurulum | Kapasite | Zorluk |
|--------|---------|---------|----------|--------|
| Ngrok (Lokal) | Ücretsiz | 10 dk | 5-10 kişi | ⭐ Kolay |
| Railway | Ücretsiz→$10/ay | 1 saat | 500 kişi | ⭐⭐ Orta |
| Supabase+Vercel | Ücretsiz→$25/ay | 3 saat | 1000+ kişi | ⭐⭐⭐ Zor |

---

## 🎯 Seçenek 1: Ngrok ile Lokal Test (En Hızlı)

### Adım 1: Backend'i Başlat
```bash
cd backend
npm install
npm run dev
```

### Adım 2: PostgreSQL'in Çalıştığından Emin Ol
```bash
# macOS
brew services start postgresql

# Veya Docker ile
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14
```

### Adım 3: Ngrok Kurulumu
```bash
# Ngrok'u indir: https://ngrok.com/download
# Veya npm ile
npm install -g ngrok

# Ngrok hesabı oluştur (ücretsiz): https://dashboard.ngrok.com/signup
# Auth token'ı ekle
ngrok config add-authtoken YOUR_TOKEN

# Backend'i internete aç
ngrok http 3000
```

### Adım 4: Flutter App'i Güncelle
```dart
// lib/core/config/api_config.dart
class ApiConfig {
  // Ngrok URL'sini buraya yapıştır
  static const String baseUrl = 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app';
}
```

### Adım 5: APK Oluştur ve Paylaş
```bash
flutter build apk --release
# APK: build/app/outputs/flutter-apk/app-release.apk
```

**⚠️ Önemli:**
- Ngrok ücretsiz planda URL her seferinde değişir
- Bilgisayar kapatılınca backend durur
- Sadece kısa süreli testler için uygundur

---

## 🎯 Seçenek 2: Railway ile Production Test (Tavsiye Edilen)

### Neden Railway?
- ✅ GitHub'dan otomatik deploy
- ✅ PostgreSQL dahil
- ✅ Ücretsiz tier yeterli
- ✅ Custom domain desteği
- ✅ Kolay kurulum

### Adım 1: Railway Hesabı Oluştur
1. https://railway.app adresine git
2. GitHub ile giriş yap

### Adım 2: PostgreSQL Ekle
1. "New Project" → "Provision PostgreSQL"
2. Database URL'sini kopyala

### Adım 3: Backend'i Deploy Et

**Yöntem A: GitHub Entegrasyonu (Önerilen)**
1. Backend kodunu GitHub'a push et
2. Railway'de "New Project" → "Deploy from GitHub Repo"
3. Repository'yi seç
4. Environment variables ekle:

```env
DATABASE_URL=postgresql://...  # Railway'den al
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
NODE_ENV=production
PORT=3000
```

**Yöntem B: CLI ile Deploy**
```bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login

# Proje oluştur
cd backend
railway init

# Deploy
railway up
```

### Adım 4: Domain Al
Railway otomatik bir URL verir:
`https://your-app-production.up.railway.app`

### Adım 5: Flutter App'i Güncelle
```dart
// lib/core/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'https://your-app-production.up.railway.app';
}
```

### Railway Ücretsiz Limitler
| Kaynak | Limit |
|--------|-------|
| Execution Hours | 500 saat/ay |
| Memory | 512MB |
| Storage | 1GB |
| Bandwidth | 100GB |

**💡 Not:** 500 saat ≈ 20 gün kesintisiz çalışma. Test için yeterli!

---

## 🎯 Seçenek 3: Supabase + Vercel (Profesyonel)

### Supabase Kurulumu (Database + Auth)

1. https://supabase.com'da hesap oluştur
2. New Project oluştur
3. Project Settings → API'den URL ve Key'leri al

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR...
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
```

### Vercel'e Backend Deploy

```bash
# Vercel CLI
npm install -g vercel

# Deploy
cd backend
vercel
```

### Supabase Ücretsiz Limitler
| Kaynak | Limit |
|--------|-------|
| Database | 500MB |
| Storage | 1GB |
| Bandwidth | 2GB |
| Auth Users | 50,000 |
| Edge Functions | 500K invocations |

---

## 📱 Mobil App Dağıtımı

### Android APK Dağıtımı

#### Firebase App Distribution (Tavsiye Edilen)
```bash
# Firebase CLI kur
npm install -g firebase-tools

# Login
firebase login

# APK oluştur
flutter build apk --release

# APK'yı Firebase'e yükle
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers"
```

#### Manuel Dağıtım
1. APK'yı Google Drive'a yükle
2. Linki test edenlerle paylaş
3. Test edenler "Bilinmeyen kaynaklara izin ver" açmalı

### iOS TestFlight Dağıtımı
```bash
# iOS build (Mac gerekli)
flutter build ipa --release

# App Store Connect'e yükle
xcrun altool --upload-app -f build/ios/ipa/*.ipa \
  -t ios -u YOUR_APPLE_ID -p YOUR_APP_SPECIFIC_PASSWORD
```

**⚠️ iOS için Apple Developer Account ($99/yıl) gerekli**

---

## 🔧 Production Öncesi Checklist

### Backend
- [ ] Environment variables production için ayarlandı
- [ ] JWT secrets güçlü ve güvenli
- [ ] Rate limiting aktif
- [ ] CORS sadece app için açık
- [ ] Database backup planı var

### Mobile App
- [ ] API URL production'a çevrildi
- [ ] Debug modları kapatıldı
- [ ] App version numarası güncellendi
- [ ] Release signing yapıldı

### Test Süreci
- [ ] Test kullanıcı grubu belirlendi
- [ ] Feedback toplama mekanizması kuruldu (Google Forms)
- [ ] Bug reporting sistemi hazır (GitHub Issues)
- [ ] Analytics entegre edildi (Firebase Analytics)

---

## 💰 Maliyet Karşılaştırması

### Geliştirme/Test Aşaması (1-50 kullanıcı)
| Platform | Maliyet |
|----------|---------|
| Ngrok + Lokal | **Ücretsiz** |
| Railway | **Ücretsiz** |
| Render | **Ücretsiz** |
| Supabase | **Ücretsiz** |

### Küçük Ölçek Production (50-500 kullanıcı)
| Platform | Maliyet/ay |
|----------|------------|
| Railway | ~$10 |
| Render | ~$7 |
| Supabase | ~$25 |
| DigitalOcean | ~$15 |

### Orta Ölçek Production (500-5000 kullanıcı)
| Platform | Maliyet/ay |
|----------|------------|
| Railway Pro | ~$20-50 |
| AWS (minimal) | ~$50-100 |
| GCP (minimal) | ~$50-100 |

---

## 🚦 Önerilen Yol Haritası

```
Hafta 1-2: Ngrok ile Lokal Test
    ↓
    5-10 kişiyle temel fonksiyonları test et
    ↓
Hafta 3-4: Railway'e Geçiş
    ↓
    50+ kişiyle genişletilmiş test
    ↓
Hafta 5-6: Geri bildirimlere göre iyileştirme
    ↓
Hafta 7-8: App Store'a hazırlık (opsiyonel)
```

---

## 📞 Destek ve Kaynaklar

- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Firebase App Distribution:** https://firebase.google.com/docs/app-distribution
- **Flutter Release Build:** https://docs.flutter.dev/deployment

---

*Bu rehber, Hayırhah uygulamasının küçük ölçekli production testleri için hazırlanmıştır.*

