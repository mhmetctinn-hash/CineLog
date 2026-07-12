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

### 13. Yarım Bırakıldı Durumu, Spoiler/Zengin Metin İnceleme, Cursor-Based Pagination
- Migration `004_add_status_spoiler.sql` — `movie_logs`'a `status` (`'watched' | 'dropped'`, varsayılan `'watched'`) ve `has_spoilers` (boolean) eklendi.
- **Durum:** `MovieDetail` log formunda "İzledim" / "Yarım Bıraktım" seçici; `Profile` sayfasında durum filtresi (Hepsi/İzledim/Yarım Bıraktım — backend'de filtreleniyor). İstatistik hesaplamaları (`getStats`) sadece `status = 'watched'` olan logları sayıyor.
- **Spoiler + zengin metin:** İnceleme formuna "spoiler içeriyor" onay kutusu eklendi; spoiler işaretli incelemeler `SpoilerGuard` ile gizleniyor, tıklayınca açılıyor. Zengin metin için harici bir editör yerine güvenli, minimal bir `**kalın**`/`*italik*`/satır sonu render'ı (`ReviewText.tsx`) yazıldı — HTML parse etmediği için XSS yüzeyi yok.
- **Cursor-based pagination:** `GET /api/logs/page` — `(watched_date, created_at, id)` üzerinden satır karşılaştırmalı (row-wise comparison) cursor, base64url ile encode/decode ediliyor. `Profile` sayfası `useInfiniteQuery` ile bu endpoint'i kullanıyor, "Daha Fazla Yükle" butonuyla sonraki sayfayı çekiyor.
- Backend testlerine `listLogsPage` için 4 yeni test eklendi (toplam 25 test, hepsi geçiyor); frontend build ve mevcut testler (8) yeşil.
- Tarayıcıda uçtan uca doğrulandı: durum değişimi, spoiler gizle/göster, kalın/italik render, durum filtresi, ve stats'ın yarım bırakılan filmi hariç tutması.
- Spesifikasyon (`cinelog_proje_dokumani claude.md`) MVP bölümündeki tüm maddeler artık tamamlandı.
- Commit: "Add watch status, spoiler-flagged rich text reviews, and cursor pagination" (`feature/status-spoiler-pagination` → `develop` → `main`)

---

### 14. Kategori Navigasyonu ve Fragmanlar
- `GET /api/tmdb/discover?genre=&page=` — TMDB'nin discover endpoint'ini popülerliğe göre sıralayıp proxy'liyor (min oy sayısı filtresiyle düşük kaliteli sonuçlar eleniyor).
- Header'a **"Kategoriler"** açılır menüsü eklendi (tüm TMDB türleri, `lib/genres.ts`'teki mevcut listeden), her tür `/category/:genreId` sayfasına gidiyor — sayfalamalı film ızgarası.
- **Fragman:** `getMovieDetails` zaten `append_to_response=videos` ile TMDB'den fragman verisini çekiyordu, sadece frontend'e hiç yansıtılmamıştı. `MovieDetail` sayfasına gömülü YouTube oynatıcı eklendi; `pickBestTrailer` önce TMDB'de Türkçe (`iso_639_1: 'tr'`) video varsa onu, yoksa en resmi fragmanı seçiyor. YouTube embed'ine `cc_lang_pref=tr` parametresi eklendi (fragmanın kendisi Türkçe değilse oynatıcının CC/altyazı düğmesinden değiştirilebileceğine dair bir not gösteriliyor). Tamamen TMDB'nin ücretsiz API'si üzerinden, ek/ücretli bir servise ihtiyaç yok.
- Tarayıcıda doğrulandı: kategori menüsü açılıyor, "Korku" kategorisi popüler filmleri sayfalı listeliyor, Fight Club'ın fragmanı oynatıcıda görünüyor.
- Commit: "Add category navigation and movie trailers" (`feature/categories-trailers` → `develop` → `main`)

---

### 15. Dizi (TV Series) Entegrasyonu
- **Mimari karar:** Filmlerden tamamen ayrı bir şema (`tv_shows`, `tv_logs`, `tv_watchlist` — migration `005_create_tv_shows.sql`). `movies`/`movie_logs`/`watchlist` şemasına dokunulmadı; polymorphic/ortak tablo yaklaşımı yerine hızlı ve az riskli ayrı-tablo yaklaşımı tercih edildi.
- **Backend:** `tmdb.service.ts`'e `searchTvShows`, `getTvShowDetails`, `discoverTvByGenrePaged` eklendi. `tvShow.service.ts` (`getOrCreateTvShowByTmdbId`, movie.service.ts'in dizi karşılığı), `tvLog.service.ts`, `tvWatchlist.service.ts` — hepsi film servislerinin birebir aynısı, sadece dizi şemasına yazıyor. Tek `tv.controller.ts` altında TMDB proxy + log CRUD + watchlist CRUD toplandı; `/api/tv/*` route'ları `tv.routes.ts`'te — `/search`, `/discover`, `/logs`, `/watchlist` sabit path'leri `/:id` catch-all'dan **önce** tanımlandı (aksi halde Express `/:id` route'u `/logs` gibi isteklerle eşleştirip 400 dönüyordu, bu hatayı geliştirme sırasında yakalayıp düzelttik).
- **Frontend:** `api/tv.ts` client'ı; `Search` sayfasına Film/Dizi sekmesi (aynı arama UX'i, farklı endpoint); yeni `TvDetail` sayfası (`MovieDetail`'in birebir dizi karşılığı — durum/puan/spoiler/zengin metin/fragman/paylaşım kartı hepsi çalışıyor); `Profile` ve `Watchlist` sayfalarına Film/Dizi sekmesi eklendi. `MovieCard` bileşenine `linkTo` prop'u eklenerek hem film hem dizi kartlarında yeniden kullanılabilir hale getirildi.
- **Bilinçli olarak bu aşamaya dahil edilmeyenler** (kapsamı büyütmemek için): dizi logları için cursor-based pagination (basit liste kullanıldı, film hacmine ulaşınca eklenebilir), Film Haritası ve İstatistik Paneli'nin dizileri de kapsaması, Kategoriler menüsünün dizi türlerini de içermesi (TMDB'de film ve dizi tür ID'leri farklı kümeler).
- Tarayıcıda uçtan uca doğrulandı: dizi arama (Breaking Bad), detay sayfası (sezon sayısı, tür, fragman notu), log kaydetme (puan/durum), Loglarım ve İzleme Listesi'nde Dizi sekmesi.
- Commit: "Add TV series integration: search, detail, logs, watchlist" (`feature/tv-series-integration` → `develop` → `main`)

---

### 16. Kategoriler Kişisel Koleksiyona Döndürüldü + Ertelenen 3 İş Tamamlandı
- **Önemli yön değişikliği:** Kategori sayfaları artık TMDB'nin tüm kataloğunu (discover/keşfet) çekmiyor — CineLog kişisel bir takip aracı, bir film sitesi değil. `GET /api/tmdb/discover` ve `GET /api/tv/discover` endpoint'leri ve `discoverMoviesByGenrePaged`/`discoverTvByGenrePaged` servis fonksiyonları tamamen kaldırıldı (öneri motorunun kullandığı türe göre tekli `discoverMoviesByGenre` kaldı).
  - `CategoryMenu` artık kullanıcının kendi loglarında/izleme listesinde **gerçekten var olan** türleri gösteriyor ("Filmlerim" / "Dizilerim" iki ayrı bölüm), TMDB'nin sabit tür listesini değil.
  - `Category` sayfası kullanıcının kendi film/dizi koleksiyonunu (log ∪ watchlist, `useUserMovieLibrary`/`useUserTvLibrary` hook'ları ile) genre'ye göre filtreliyor; TMDB sayfalaması kalktı, sayfalamaya gerek yok (kişisel koleksiyon küçük).
  - `watchlist.service.ts` ve `tvWatchlist.service.ts`'in `list` sorgularına `genre_ids` eklendi (önceden sadece log'larda vardı, watchlist'te de kategori filtrelemesi için gerekliydi).
- **Ertelenen 3 iş tamamlandı:**
  1. **TV loglarına cursor pagination:** `tvLog.service.ts`'e `listTvLogsPage` (movie tarafındaki mantığın birebir aynısı), `GET /api/tv/logs/page` endpoint'i, frontend `tvApi.logs.page()`; `Profile` sayfasının Dizi sekmesi artık `useInfiniteQuery` + "Daha Fazla Yükle" kullanıyor (önceden düz liste çekiyordu).
  2. **İstatistik Paneli dizileri kapsıyor:** `getStats` artık `movie_logs` ve `tv_logs`'u birlikte sorgulayıp birleştiriyor; tür dağılımı, aylık aktivite, ortalama puan ve en yüksek puanlılar hem film hem diziden geliyor. `topRated`'a `mediaType` eklendi (tıklanınca `/movie/:id` veya `/tv/:id`'ye doğru yönleniyor).
  3. **Film Haritası dizileri kapsıyor:** `MovieMap` artık hem `logsApi.list()` hem `tvApi.logs.list()`'i çekip birleştiriyor; kümeleme algoritması aynı (en sık geçen tür), node id'leri `mediaType-tmdbId` ile benzersizleştirildi. Seri/devam filmi bağlantıları sadece filmler arasında (dizilerde "collection" kavramı şemada yok).
  - Film/dizi tür ID çakışmasını çözmek için `lib/genreName.ts` — önce film tür haritasına, yoksa dizi tür haritasına bakan `resolveGenreName` fonksiyonu; Stats ve Map bunu kullanıyor.
- Tarayıcıda doğrulandı: Kategoriler menüsü sadece kişisel türleri listeliyor, "Dram" kategorisi TMDB'den değil kendi loglarımdan 5 film gösterdi; İstatistik Paneli'nde Breaking Bad "En Yüksek Puan Verdiklerin" listesinde çıktı ve tıklayınca `/tv/1396`'ya gitti; Harita'da dizi de bir kümede (Dram, 6 öğe) yer aldı.
- Commit: "Restrict categories to the user's own collection; TV parity for pagination, stats, and map" (`feature/personal-categories-and-tv-parity` → `develop` → `main`)

---

### 17. Animasyonlu Logo
- Düz metin logo (`text-highlight` renkli "CineLog" yazısı) yerine yeni `Logo.tsx` bileşeni: inline SVG klaket (clapperboard) ikonu + iki renkli marka yazısı ("Cine" kırmızı + nabız gibi yanıp sönen kırmızı parıltı, "Log" altın rengi ve sürekli parlayan bir ışık huzmesi geçişiyle — sinema tabelası hissi).
- **Hover etkileşimi:** klaket kolu gerçekten "çat" diye kapanıyor (kısa bir sıçrama/geri tepme ile), kapanma anında bir flaş efekti var, ve logo yazısının altından jenerik bir aksiyon silüeti (koşan bir figür) soldan sağa koşarak geçiyor — küçük bir "easter egg".
- **Not (telif hakkı):** Kullanıcı ilhamını Spider-Man ve RDR2/Arthur Morgan'dan almak istedi; bu karakterler Marvel/Disney ve Rockstar'a ait telifli tasarımlar olduğu için birebir çizilmedi. Onun yerine aynı "sinematik enerji" hissini veren özgün bir konsept (klaket + jenerik koşan silüet) uygulandı.
- Tüm animasyonlar `prefers-reduced-motion: reduce` durumunda devre dışı kalıyor (erişilebilirlik).
- Tarayıcıda doğrulandı: `:hover` durumu ve `animation-name` (`clap-swing`, `runner-dash`) CDP ile teyit edildi, konsol hatası yok.
- Commit: "Add animated clapperboard logo with cinematic hover easter egg" (`feature/animated-logo` → `develop` → `main`)

---

### 18. Logo Renkleri: Trabzonspor Esintili
- Logo'nun renk paleti Trabzonspor'un bordo-mavi kimliğine çekildi — **sadece logoya özel**, sitenin geri kalanındaki spesifikasyon kaynaklı sinematik palete (`#121824`/`#D61C2C`/`#FCD116`) dokunulmadı.
- `.logo-mark` içinde scoped CSS custom property'ler: `--ts-bordo: #7a1f3d`, `--ts-bordo-bright: #b23a5d`, `--ts-blue: #1c4f9c`, `--ts-blue-bright: #6fa8ff`.
- "Cine" artık bordo tonunda parıldıyor, "Log" mavi tonunda parlıyor; klaket ikonunun çizgili deseni ve kenarlıkları bordo/mavi, hover'daki koşan silüet bordo renginde.
- **Karşılaşılan sorun:** Değişiklik sonrası tarayıcıda hem eski sekmede hem yeni açılan sekmede logo eski haliyle (animasyonsuz, sade "CineLog" yazısı) göründü. `curl` ile Vite dev server'ın ham çıktısı incelendiğinde `Layout.tsx`'in derlenmiş halinde `Logo` import'unun hiç olmadığı görüldü — bu bir tarayıcı önbelleği değil, **Vite'ın transform önbelleğinin bayatlamasıydı** (dosya değişikliği HMR event'i tetikliyordu ama sunucu hâlâ eski derlenmiş içeriği dönüyordu). `node_modules/.vite` silinip dev server yeniden başlatılarak çözüldü.
- Tarayıcıda doğrulandı: `--ts-bordo`/`--ts-blue` CSS değişkenleri doğru değerlerde, "Cine" rengi `rgb(122, 31, 61)`, hover'da `clap-swing`/`runner-dash` animasyonları ve koşan silüetin bordo dolgusu teyit edildi.
- Commit: "Recolor the logo with a Trabzonspor claret-and-blue palette" (`feature/trabzonspor-logo-colors` → `develop` → `main`)

---

### 19. Logo: Tek Parça Halinde Süpüren Işık
- Kullanıcı geri bildirimi: parlak ışık sadece "Log" kelimesinde kalıyordu, tüm logoyu (ikon + yazı) tek parça halinde aydınlatıp gezmesi istendi.
- "Cine" ve "Log"un kendi ayrı animasyonları (nabız gibi kırmızı parıltı / kayan altın-mavi gradyan) kaldırıldı, ikisi de sabit renkli + sabit hafif parıltılı (statik `text-shadow`) hale getirildi.
- Yerine `.logo-shine-viewport` (ikon+yazıyı saran, `overflow: hidden` + `isolation: isolate` içeren bir kapsayıcı) ve içinde `mix-blend-mode: overlay` ile karışan, eğik (skew) bir beyaz ışık bandı olan `.logo-sheen` eklendi — bu tek ışık huzmesi `logo-sheen-sweep` animasyonuyla ikonun ve yazının **tamamının üzerinden** sürekli geçiyor (hover'a bağlı değil, her zaman çalışıyor).
- Hover'daki koşan silüet efektinin kırpılmaması için kapsayıcıya `pb-3 -mb-3` (padding + negatif margin) eklendi — `overflow: hidden` klipleme kutusunu, silüetin yazının altına taştığı kadar genişletiyor ama sayfa düzenini etkilemiyor.
- Tarayıcıda doğrulandı: `.logo-sheen`'in `transform` değeri 1 saniye arayla ölçülüp gerçekten hareket ettiği teyit edildi (39px → 124px); hover'daki klaket kapanma ve koşan silüet animasyonları bozulmadı.
- Commit: "Sweep a single light band across the whole logo instead of per-word effects" (`feature/logo-unified-sheen` → `develop` → `main`)

### 20. Logo Işığı: Şekillerin İçinden Geçen Parıltı (Blok Değil)
- Kullanıcı geri bildirimi: bir önceki tek-parça sheen dikdörtgen bir "kalıp/blok" gibi görünüyordu; istenen, eski "Log" shimmer'ındaki gibi ışığın **harflerin/şekillerin içinden** geçtiği zarif efektin tüm logoya (ikon + yazı) uygulanmış hali.
- **Yazı:** "Cine" ve "Log" tek bir `.logo-wordmark` span'ine ("CineLog") birleştirildi. İki katmanlı `background`: alt katman sabit iki-tonlu bordo→mavi baz gradyan, üst katman `background-position` ile kayan beyaz bir highlight bandı; `background-clip: text` sayesinde ışık yalnızca glif şekillerinin içinde görünüyor (dikdörtgen yok).
- **İkon:** SVG içine `iconSheen` beyaz gradyan bandı eklendi ve `clipPath="url(#inkClip)"` (klaket gövdesi + döndürülmüş kol şekilleri) ile kırpıldı; `icon-shimmer` keyframe'i (`translateX`) ile band klaketin ink'i boyunca geziyor — dolayısıyla ışık yalnızca klaket şeklinde beliriyor, arka plandaki boş dikdörtgende değil.
- Her iki shimmer da aynı süre (4.5s) ve `ease-in-out` + sonda bekleme ile periyodik bir gleam veriyor; eski `.logo-shine-viewport`/`.logo-sheen` blok-overlay yaklaşımı ve `.cine-text`/`.log-text` kaldırıldı.
- Tarayıcıda doğrulandı: yazı highlight'ı (`background-position` -57% → 3%) ve ikon bandı (`translateX` 30px → 13px) periyodik hareket ediyor, baz gradyan sabit; konsol hatası yok; iki-tonlu bordo/mavi görünüm ve klaket üzerinde gezen ışık teyit edildi.
- Commit: "Confine the logo shimmer to the ink instead of a sweeping block" (`feature/logo-shimmer-through-ink` → `develop` → `main`)

---

### 21. Render Deployment Kurulumu
- Kullanıcı önce Netlify'da denedi: sadece frontend ayağa kalktı, backend (sürekli çalışan Express + Postgres bağlantı havuzu) Netlify'ın statik site + serverless function modeline uymadığı için giriş başarısız oldu.
- **Karar:** Render.com — hem backend (Web Service, Express değişmeden çalışır) hem frontend (Static Site) aynı hesap altında, tamamen ücretsiz katmanda.
- **Deploy'u engelleyecek iki sorun bulunup düzeltildi:**
  1. Frontend'in API client'ı (`/api` göreli path) prod'da frontend ve backend farklı subdomain'lerde olduğu için backend'e ulaşamazdı. **Çözüm:** Render Static Site'ın `routes` rewrite/proxy özelliği — `/api/*` istekleri Render tarafında (tarayıcıya görünmeden) backend servisine proxy'leniyor. Böylece tarayıcı açısından her şey aynı origin, CORS veya `sameSite=None`+cross-site cookie gibi karmaşık ayarlara hiç gerek kalmadı.
  2. `express-rate-limit`, reverse proxy arkasında `trust proxy` ayarlanmazsa X-Forwarded-For header'ını güvenilir bulmayıp hata fırlatabiliyor. `app.set("trust proxy", 1)` eklendi.
- `render.yaml` (repo kökünde) — iki servisi tanımlayan Blueprint: `cinelog-backend` (Node Web Service, `healthCheckPath: /api/health`, `JWT_SECRET` otomatik üretiliyor, `DATABASE_URL`/`TMDB_API_KEY`/`SENTRY_DSN` dashboard'dan elle girilecek secret'lar) ve `cinelog-frontend` (Static Site, `/api/*` rewrite + SPA fallback `/*` → `/index.html`).
- `backend/tsconfig.json`'a `exclude: ["src/__tests__"]` eklendi — prod build'inde artık test dosyaları `dist`'e derlenmiyor (Jest'i etkilemedi, ayrıca doğrulandı).
- Migration'lara production'da yeniden ihtiyaç yok: backend nereden bağlanırsa bağlansın aynı Supabase veritabanını kullanıyor, o veritabanı zaten migrate edilmiş durumda.
- Backend ve frontend prod build'leri lokal olarak doğrulandı (`npm run build` her ikisinde de başarılı), backend testleri (25/25) tekrar koşturuldu.
- **Kalan adımlar (Render dashboard'da, kullanıcı tarafından yapılmalı):** GitHub reposunu Render'a bağlamak, "Blueprint" olarak `render.yaml`'ı deploy etmek, `DATABASE_URL`/`TMDB_API_KEY` secret'larını girmek — bunlar hesap bağlama ve gizli bilgi girişi gerektirdiği için asistan tarafından yapılamaz.
- Commit: "..." (`feature/render-deployment-setup` → `develop` → `main`)

---

## Şu Anki Durum (Nerede Kaldık)
- **Spesifikasyondaki MVP ve 2. Aşama'nın tamamı bitti**, üzerine kategori navigasyonu (kişisel koleksiyon bazlı), fragman, **dizi (TV) entegrasyonu** (arama/detay/log/watchlist/pagination/istatistik/harita — filmlerle tam paritede), Trabzonspor renkli animasyonlu logo, ve Render deployment altyapısı eklendi. CineLog artık uçtan uca kişisel bir film+dizi takip platformu; hiçbir yerde TMDB'nin tüm kataloğu taranmıyor, her şey kullanıcının kendi verisinden türetiliyor.
- **Sıradaki adım:** Kullanıcının Render dashboard'da hesap oluşturup GitHub reposunu bağlaması ve `render.yaml`'ı Blueprint olarak deploy etmesi gerekiyor (secret env var'lar dahil) — bu adım asistan tarafından yapılamaz, kullanıcı tarafında.
- Kalanlar tamamen opsiyonel/ileri seviye: **3. Aşama** çevrimdışı destek (bilinçli olarak MVP dışı bırakılmıştı), gerçek bir Sentry projesine DSN bağlanması.
- **Not:** Bundan sonraki geliştirmeler Gitflow'a uygun şekilde `develop`'tan açılan `feature/*` dallarında yapılmalı. Vite dev server garip/eski davranış sergilerse (değişiklikler yansımıyorsa), önce `node_modules/.vite` silinip sunucu yeniden başlatılmalı — bu oturumda birkaç kez işe yaradı.
