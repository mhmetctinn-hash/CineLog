# CineLog - Geliştirici Günlüğü (Dev-Log)

## 2026-07-11 — Proje Kurulumu, Backend İskeleti, Veritabanı ve Auth

### 1. GitHub Repo Kurulumu
- Yerel git reposu başlatıldı, `main` branch olarak ayarlandı.
- Kök dizine `.gitignore` eklendi (`node_modules/`, `.env`, `dist/`, `build/`, log dosyaları, editör/OS dosyaları).
- Repo `https://github.com/mhmetctinn-hash/CineLog.git` adresine bağlandı ve push edildi.
- İlk commit: proje spesifikasyon belgesi (`cinelog_proje_dokumani claude.md`) ve `.gitignore`.

### 2. Backend İskeleti (Express + TypeScript)
- `backend/` klasörü oluşturuldu, alt klasörler: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/config`, `src/types`.
- `backend/package.json` — bağımlılıklar: `express`, `cors`, `dotenv`; dev bağımlılıklar: `typescript`, `tsx`, `@types/*`.
- `backend/tsconfig.json` — strict mode açık, `commonjs` module, `src` → `dist` derleme.
- `backend/.env.example` — `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `TMDB_API_KEY`, `TMDB_BASE_URL` şablonu.
- `backend/.env` — gerçek değerlerle oluşturuldu (git tarafından yok sayılıyor).
- `backend/src/config/env.ts` — ortam değişkenlerini merkezi okuyan modül.
- `backend/src/app.ts` — Express app tanımı, `GET /api/health` endpoint'i.
- `backend/src/index.ts` — sunucu başlatıcı.
- Test: `/api/health` → `{"status":"ok"}` doğrulandı.
- Commit: "Add backend skeleton: Express + TypeScript setup with health-check endpoint"

### 3. PostgreSQL Bağlantısı (Supabase)
- Veritabanı sağlayıcı olarak **Supabase** seçildi (Neon yerine).
- `pg` ve `@types/pg` kuruldu.
- `backend/src/config/db.ts` — `pg.Pool` ile bağlantı havuzu, SSL etkin (`rejectUnauthorized: false`).
- **Karşılaşılan sorunlar ve çözümleri:**
  - `.env` içinde `DATABASE_URL=DATABASE_URL=...` şeklinde çift yazım hatası → düzeltildi.
  - Supabase'in "Direct connection" host'u (`db.xxxx.supabase.co`) bu ağda DNS çözümlenemedi (`ENOTFOUND`, muhtemelen IPv6-only) → **Connection Pooler** adresine (`aws-0-eu-north-1.pooler.supabase.com:5432`) geçildi.
  - Şifre `.env`'e köşeli parantezli placeholder ile (`[şifre]`) yapıştırılmıştı → parantezler kaldırıldı.
- Bağlantı `SELECT NOW()` sorgusuyla doğrulandı, başarılı.
- Commit: "Add PostgreSQL connection pool (Supabase)"

### 4. JWT Auth Sistemi (Kayıt / Giriş / Çıkış)
- Kuruldu: `bcrypt`, `jsonwebtoken`, `zod`, `cookie-parser` (+ tip paketleri).
- `backend/src/migrations/001_create_users.sql` — `users` tablosu (`id UUID`, `email UNIQUE`, `password_hash`, `created_at`).
- `backend/src/migrations/run.ts` — klasördeki `.sql` dosyalarını sırayla çalıştıran basit migration runner. Supabase üzerinde çalıştırıldı, tablo oluşturuldu.
- `backend/src/types/user.ts` — `User`, `AuthPayload` tipleri.
- `backend/src/services/auth.service.ts` — `registerUser`, `loginUser`, `verifyToken`; bcrypt ile 12 salt round hash, JWT 7 gün geçerlilik. Özel hata sınıfları: `EmailAlreadyRegisteredError`, `InvalidCredentialsError`.
- `backend/src/controllers/auth.controller.ts` — `register`, `login`, `logout`; Zod ile `email`/`password` (min 8 karakter) doğrulaması; token `httpOnly` + `sameSite=lax` cookie olarak set ediliyor.
- `backend/src/middleware/requireAuth.ts` — cookie'deki JWT'yi doğrulayıp `req.auth` içine yazan middleware.
- `backend/src/routes/auth.routes.ts` — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
- `backend/src/app.ts` güncellendi — `cookie-parser` eklendi, `authRouter` bağlandı, örnek korumalı endpoint `GET /api/auth/me`.
- `JWT_SECRET` rastgele 48-byte hex değer üretilip `.env`'e eklendi.
- **Test edilen senaryolar (hepsi başarılı):**
  - Kayıt olma → cookie set ediliyor.
  - Cookie ile `/api/auth/me` → kullanıcı bilgisi dönüyor.
  - Cookie'siz `/api/auth/me` → 401 "Not authenticated".
  - Yanlış şifreyle giriş → 401 "Invalid email or password".
  - Aynı email ile tekrar kayıt → 409 "Email already registered".
  - Test kullanıcısı sonrasında veritabanından silindi.
- Commit: "Add JWT auth: register, login, logout with bcrypt password hashing"

---

## Şu Anki Durum (Nerede Kaldık)
- Roadmap Adım 1-2 tamamlandı (proje hazırlığı, backend + DB + Auth kurulumu).
- **Sıradaki adım:** TMDB API entegrasyonu — backend üzerinden film arama/detay proxy endpoint'leri (`/api/movies/search` vb.), API key `.env` içinde `TMDB_API_KEY` alanına eklenmiş durumda, henüz servis katmanı yazılmadı.
- Frontend (React + Vite + Tailwind + PWA) henüz başlanmadı.
