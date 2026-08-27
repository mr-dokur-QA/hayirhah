# 📱 Hayırhah - Mobil Uygulama (Play Store & App Store) Yayınlama Rehberi

Bu proje, modern **Capacitor 8** mimarisi ile hem **Google Play Store (Android)** hem de **Apple App Store (iOS)** platformlarında native (yerel) bir mobil uygulama olarak derlenip yayınlanmaya hazır şekilde yapılandırılmıştır.

---

## 🛠️ 1. Geliştirme Ortamı Gereksinimleri

### Android (Play Store) için:
- **Node.js** (v18+)
- **Android Studio** (Koala veya daha yeni sürüm)
- **Java Development Kit (JDK 17 or 21)**
- Android SDK & Build-Tools

### iOS (App Store) için:
- **macOS** işletim sistemi
- **Xcode** (15 veya daha yeni sürüm)
- **CocoaPods** (`sudo gem install cocoapods`)
- Apple Developer Hesabı

---

## 🚀 2. Hızlı Kurulum ve Platformları Eklemek

Projeyi bilgisayarınıza ZIP / Git olarak indirdikten sonra terminalde proje dizinine gidin:

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Web çıktısını derleyin ve Capacitor ile senkronize edin
npm run cap:build

# 3. Android ve iOS platformlarını projeye ilk defa ekleyin (bir defaya mahsus):
npx cap add android
npx cap add ios

# 4. Yapılan güncellemeleri native projelere aktarın
npx cap sync
```

---

## 🤖 3. Google Play Store (Android) için Derleme & Yayınlama

### Adım 1: Android Studio'yu Açın
```bash
npm run cap:android
# veya
npx cap open android
```

### Adım 2: Gerekli İzinleri Kontrol Edin
`android/app/src/main/AndroidManifest.xml` dosyasında şu izinlerin tanımlı olduğundan emin olun:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Adım 3: Release AAB (Android App Bundle) Üretin
1. Android Studio menüsünden: **Build > Generate Signed Bundle / APK...**
2. **Android App Bundle (.aab)** seçeneğini işaretleyin.
3. Yeni bir Keystore (imzalama anahtarı) oluşturun veya mevcut olanı seçin.
4. Build Type olarak **release** seçin ve **Create** butonuna basın.
5. Oluşan `.aab` dosyasını **Google Play Console** paneline yükleyin.

---

## 🍎 4. Apple App Store (iOS) için Derleme & Yayınlama

### Adım 1: Xcode'u Açın
```bash
npm run cap:ios
# veya
npx cap open ios
```

### Adım 2: iOS İzin Metinleri (`Info.plist`)
`ios/App/App/Info.plist` dosyasına Apple inceleme kuralları gereği açıklama metinleri eklenmelidir:
```xml
<!-- Kıble Pusulası ve Namaz Vakitleri Konumu için -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Namaz vakitlerini bulunduğunuz şehre göre hesaplamak ve kıble pusulasını doğru yönlendirmek için konum izni gereklidir.</string>

<!-- Ezan ve Hatim Bildirimleri için -->
<key>NSUserNotificationsUsageDescription</key>
<string>Vakit ezanı ve hatim halkası bildirimlerini iletebilmek için bildirim izni gereklidir.</string>
```

### Adım 3: Signing & Capabilities
1. Xcode'da sol taraftan **App** hedefini seçin.
2. **Signing & Capabilities** sekmesine gelin.
3. **Automatically manage signing** kutusunu işaretleyip **Apple Developer** takımınızı seçin.
4. Bundle Identifier: `com.hayirhah.app` olarak belirlenmiştir.

### Adım 4: Archive ve App Store Connect'e Yükleme
1. Cihaz hedefi olarak **Any iOS Device (arm64)** seçin.
2. Menüden: **Product > Archive** seçeneğine tıklayın.
3. Arşivleme tamamlandığında **Distribute App > App Store Connect > Upload** adımlarını takip edin.

---

## 🎨 5. Mobil İkon ve Açılış Ekranı (Splash Screen) Otomasyonu

Uygulamanın tüm Android ve iOS cihaz ekranlarına göre ikon ve splash screen görsellerini otomatik üretmek için:

```bash
# @capacitor/assets aracını çalıştırın
npx @capacitor/assets generate --iconBackgroundColor '#064E3B' --splashBackgroundColor '#064E3B'
```

---

## ✨ Uygulamada Hazır Olan Yerel Mobil Yetenekler

* ✅ **iOS Dynamic Island & Android Safe-Area:** Ekran çentiği ve ev barı ile kusursuz uyum (`viewport-fit=cover`, `pb-safe`).
* ✅ **Dokunsal Titreşim (Haptics):** Zikirmatik sayımlarında, cüz seçimlerinde ve hatim tamamlamada gerçekçi dokunma hissi.
* ✅ **Dinamik Durum Çubuğu (Status Bar):** Gündüz zümrüt yeşili, gece modunda derin gece mavisi senkronizasyonu.
* ✅ **Geri Butonu & Touch Optimizasyonları:** Çift dokunma gecikmeleri ve metin seçme engellendi; native his sağlandı.
