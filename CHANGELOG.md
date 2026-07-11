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

### 5. TMDB API Entegrasyonu
- `backend/src/services/tmdb.service.ts` — `searchMovies`, `getMovieDetails` (credits + videos ile birlikte).
- `backend/src/routes/tmdb.routes.ts` — `GET /api/movies/search`, `GET /api/movies/:id`.
- Commit: "Add TMDB API proxy: movie search and details endpoints"

### 6. Film Logları ve İzleme Listesi
- Migration `002_create_movies_logs_watchlist.sql` — `movies`, `movie_logs`, `watchlist` tabloları.
- `backend/src/services/movie.service.ts` — `getOrCreateMovieByTmdbId` (TMDB'den çekip yerel `movies` tablosuna cache'liyor).
- `backend/src/services/log.service.ts`, `watchlist.service.ts` ve ilgili controller/route'lar — log CRUD, watchlist ekleme/çıkarma, `tmdbId` ile filtreleme.
- Commit: "Add movie logs and watchlist: schema, endpoints, and tmdbId filtering"

### 7. Frontend (React + Vite + PWA)
- `frontend/` — React 19 + Vite + Tailwind 4 + `vite-plugin-pwa`.
- Sayfalar: `Login`, `Register`, `Search`, `MovieDetail`, `Profile` (Loglarım), `Watchlist`.
- `AuthContext`, `ProtectedRoute`, API client katmanı (`api/auth.ts`, `logs.ts`, `tmdb.ts`, `watchlist.ts`), bileşenler (`Layout`, `MovieCard`, `StarRating`).
- Commit: "Add React + Vite frontend with PWA support and auth/me endpoint"

### 8. Film Haritası ve Loglarım Filtreleri
- `movies` tablosuna `genre_ids`, `collection_id`, `collection_name` eklendi (migration `003_add_genre_collection.sql`); mevcut kayıtlar TMDB'den geriye dönük dolduruldu.
- **Loglarım sayfası**: başlığa göre arama, **kendi verdiğin puana göre** minimum eşik filtresi, tarih/puan sıralaması.
- **Yeni `/map` sayfası (Film Haritası)**: d3-force ile yazılan özel SVG grafik.
  - **Kümeleme algoritması** (sahte veri yok, tamamen kullanıcının kendi loglarından türetiliyor): filtrelenmiş film kümesinde her türün sıklığı sayılıyor, her film kendi tür listesindeki **en sık geçen türe** atanıyor; bu şekilde otomatik kategoriler (ör. "Dram (3)", "Bilim Kurgu (1)") oluşuyor.
  - Node'lar gerçek TMDB poster görselleri + puan rozeti ile gösteriliyor; aynı seriye ait devam filmleri arasına bağlantı çizgisi çiziliyor.
  - Tür bazlı çoklu seçim filtresi (kullanıcının verisinde geçen türlerden dinamik oluşturuluyor) ve minimum puan filtresi.
- **Karşılaşılan sorunlar ve çözümleri:**
  - İlk denemede `react-force-graph-2d` kullanıldı; React 19 ile uyumsuz çıktı (react-kapsule eski hook deseni), kaldırılıp `d3-force` ile özel SVG render'a geçildi.
  - Bileşen `Map` olarak adlandırılmıştı — bu, JS'in yerleşik `Map` sınıfını gölgeleyip kod içindeki `new Map()` çağrılarının kendi component fonksiyonunu çağırmasına (ve React hook hatalarına) yol açtı. Bileşen `MovieMap` olarak yeniden adlandırılarak düzeltildi.
- Tarayıcıda gerçek verilerle (5 film, farklı tür/seri kombinasyonları) test edildi; filtreler, tıklama ile film detayına yönlendirme ve kümeleme doğrulandı.
- Commit: "Add movie map page and rating-based log filters"

---

### 9. İstatistik Paneli (Dashboard)
- `backend/src/services/log.service.ts` — `getStats(userId)`: toplam log sayısı, ortalama kişisel puan, tür dağılımı (`genre_ids` üzerinden sayım), aylık izleme aktivitesi (`watched_date` → `YYYY-MM` gruplama), en yüksek puanlı 5 film.
- `GET /api/logs/stats` endpoint'i eklendi.
- Yeni `/stats` sayfası: özet kartları (toplam film, ortalama puan, favori tür, en yoğun ay), tür dağılımı için yatay bar chart, aylık aktivite için dikey bar chart, en yüksek puanlı filmler için poster ızgarası. Grafikler harici kütüphane kullanılmadan özel SVG/CSS ile yazıldı (Film Haritası'ndaki `react-force-graph-2d` uyumsuzluğu tekrarlanmasın diye), spesifikasyondaki marka renkleri (`#fcd116`, `#007bff`) kullanıldı.
- Commit: "Add statistics dashboard page"

### 10. Sosyal Paylaşım Kartı (PNG Export)
- `html2canvas` kuruldu.
- `frontend/src/components/ShareCard.tsx` — film posteri, başlık/yıl, yıldız puanı, inceleme alıntısı (220 karakterle sınırlı), izleme tarihi ve CineLog markası içeren sinematik bir kart; "PNG Olarak İndir" butonuyla tamamen client-side (backend'e görsel işleme yükü yok) PNG'ye render ediliyor.
- `MovieDetail` sayfasına, mevcut bir log varsa görünen "Paylaş" butonu eklendi.
- **Karşılaşılan sorun ve çözümü:** `<img crossOrigin="anonymous">` özniteliği TMDB CDN görselinin tarayıcıda hiç render edilmemesine yol açtı (`naturalWidth: 0`). Attribute kaldırıldı; `html2canvas`'ın kendi `useCORS: true` seçeneği görseli canvas'a aktarmak için yeterli.
- Commit: "Add social share card PNG export"

### 11. Öneri Motoru (AI Recommendation)
- `backend/src/services/tmdb.service.ts` — `getMovieRecommendations` (TMDB `/movie/{id}/recommendations`) ve `discoverMoviesByGenre` (TMDB `/discover/movie`) eklendi.
- `backend/src/services/recommendation.service.ts` — algoritma: kullanıcının 7/10+ puan verdiği loglar "seed" olarak seçiliyor (en fazla 5), her seed için TMDB önerileri toplanıp kaç seed tarafından önerildiğine göre puanlanıyor (eşitlikte TMDB `vote_average` ile); zaten loglanmış/watchlist'teki filmler eleniyor. Yeterli seed yoksa kullanıcının en sık logladığı türe göre TMDB `discover` ile tamamlanıyor.
- `GET /api/tmdb/recommendations` endpoint'i eklendi.
- Frontend: `Search` sayfasında arama kutusu boşken **"Senin İçin Önerilenler"** bölümü — her öneri kartında "hangi filmi sevdiğin için önerildiği" gösteriliyor.
- Gerçek test verisiyle doğrulandı (Godfather → Godfather Part II/GoodFellas/Casino, Fight Club → Requiem for a Dream/Trainspotting, Passengers → Interstellar/Her gibi mantıklı eşleşmeler).
- Commit: "Add AI-style recommendation engine"

### 12. Altyapı Sertleştirme: Rate Limiting, Testler, CI/CD, Sentry, Gitflow
- **Rate limiting:** `express-rate-limit` — `/api` altında IP başına dakikada 100 istek, `/api/auth` altında (brute-force'u yavaşlatmak için) dakikada 10 istek.
- **Backend testleri:** Jest + Supertest, `pool.query` mock'lanarak gerçek veritabanına ihtiyaç duymadan. Kapsam: auth (kayıt/giriş/`me`, 401'ler, şifre asla düz metin saklanmıyor), log CRUD'unun kullanıcı sahipliğine göre sınırlanması, TMDB proxy'sinin auth zorunluluğu ve API anahtarının response'a asla sızmaması.
- **Frontend testleri:** Vitest + Testing Library — `StarRating`'in puan matematiği (1-10 ölçek ↔ 5 yıldız) ve TMDB poster URL yardımcı fonksiyonu.
- **CI/CD:** `.github/workflows/ci.yml` — `main` ve `develop`'a push/PR'da backend (typecheck + test) ve frontend (lint + typecheck + test) paralel job olarak çalışıyor.
- **Sentry:** `@sentry/node` ve `@sentry/react`, `SENTRY_DSN`/`VITE_SENTRY_DSN` ortam değişkeni verilmezse tamamen no-op (DSN gerektirmiyor, kurulum zorunlu değil). Backend'e global hata middleware'i + `unhandledRejection`/`uncaughtException` yakalayıcıları eklendi (Express 4 async hataları otomatik iletmediği için). Frontend `App`'i bir `Sentry.ErrorBoundary` ile sarmalıyor.
- **Gitflow:** `develop` branch'i oluşturuldu; bu değişiklikler `feature/infra-hardening` dalında yapılıp `develop`'a, oradan da `main`'e merge edildi. Bundan sonraki özellikler `develop`'tan açılan `feature/*` dallarında geliştirilip PR ile birleştirilecek.
- Commit: "Add rate limiting, test suites, CI, and Sentry error tracking"

---

## Şu Anki Durum (Nerede Kaldık)
- Roadmap Adım 1-4 tamamlandı: proje hazırlığı, backend + DB + Auth, TMDB entegrasyonu, loglar/watchlist, frontend (React + Vite + PWA), Film Haritası + gelişmiş log filtreleri, İstatistik Paneli, Sosyal Paylaşım Kartı, Öneri Motoru, ve altyapı sertleştirme (rate limiting, testler, CI/CD, Sentry, Gitflow).
- Spesifikasyon belgesine (`cinelog_proje_dokumani claude.md`) göre henüz eksik olanlar:
  - **MVP:** "Yarım Bırakıldı" izleme durumu (şu an sadece İzlendi/İzlenecek var), spoiler bayraklı/zengin metin inceleme notu, cursor-based pagination.
- **Sıradaki adım için düşünülebilecekler:** yukarıdaki eksiklerden biri, gerçek bir Sentry projesi bağlanması (DSN eklenmesi), veya çok sayıda film loglandığında Film Haritası'ndaki tür kümelerinin okunabilirliğini korumak.
- **Not:** Bundan sonraki geliştirmeler Gitflow'a uygun şekilde `develop`'tan açılan `feature/*` dallarında yapılmalı.
