# Railway'de SQL Migration Çalıştırma

## Yöntem 1: Railway Dashboard'dan Connection String (Önerilen)

### Adım 1: Connection String'i Alın
1. Railway Dashboard'a gidin
2. **Postgres** servisine tıklayın
3. **"Variables"** sekmesine gidin
4. **`DATABASE_URL`** değişkenini bulun
5. **Değerini kopyalayın** (şöyle görünür: `postgresql://postgres:password@host:port/railway`)

### Adım 2: Terminal'de Çalıştırın
```bash
# Connection string'i kullanarak bağlanın
psql "postgresql://postgres:PASSWORD@HOST:PORT/railway" -f migration.sql

# VEYA tek tek çalıştırın:
psql "postgresql://postgres:PASSWORD@HOST:PORT/railway"
```

Sonra SQL komutlarını yapıştırın.

---

## Yöntem 2: Railway CLI ile

```bash
# Railway CLI ile bağlanın
railway connect postgres

# SQL dosyasını çalıştırın
\i migration.sql
```

---

## Yöntem 3: Railway Dashboard SQL Editor (Eğer Varsa)

1. Railway Dashboard → **Postgres** → **Database** sekmesi
2. **"Query"** veya **"SQL Editor"** butonuna tıklayın
3. SQL komutlarını yapıştırın
4. **"Run"** butonuna tıklayın

---

## Yöntem 4: Prisma Migrate (En Kolay - Otomatik)

Railway deployment sırasında otomatik çalışır çünkü `package.json`'da:
```json
"start": "npx prisma migrate deploy && node dist/index.js"
```

Bu komut migration'ları otomatik çalıştırır!

---

## Migration Dosyası Konumu

```
backend/prisma/migrations/20251225_add_numbered_task_assignments/migration.sql
```

---

## Hızlı Test

Migration çalıştıktan sonra kontrol edin:

```sql
-- Railway'de çalıştırın:
SELECT * FROM numbered_task_assignments LIMIT 1;
```

Eğer tablo yoksa hata verir, varsa boş sonuç döner (normal).

