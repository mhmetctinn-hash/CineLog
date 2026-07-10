# 🎬 CineLog: Profesyonel Film Günlüğü ve Analiz Platformu
## Proje Spesifikasyon ve Mimari Tasarım Belgesi (Specification Document)

---

## 1. Proje Özeti ve Vizyonu
**CineLog**, kullanıcıların izledikleri veya izleyecekleri filmleri modern, akıcı ve yüksek performanslı bir arayüzle kayıt altına almalarını sağlayan kişisel bir sinema günlüğü ve analiz platformudur. 

Bu projenin temel vizyonu, fiziksel uygulama mağazalarına (App Store / Google Play) bağımlı kalmadan, hem web hem de mobil cihazlarda **Native App** (yerel uygulama) kararlılığında ve hızında çalışan, frontend ve backend katmanları tamamen ayrıştırılmış kurumsal düzeyde (enterprise-grade) bir mimari ortaya koymaktır.

---

## 2. UI/UX Tasarım Konsepti: "Cinematic High-Contrast"
Tasarım dili, uzun süreli kullanımlarda gözü yormayan modern bir sinematik karanlık mod (Dark Mode) üzerine inşa edilmiştir. Arayüzün görsel karakteristiği, popüler kültüre yön veren ikonik yapımların renk paletlerinden ilham alarak dinamik bir kontrast sunar.

### 🎨 Renk Paleti ve İlham Kaynakları
* **Ana Arka Plan ve Katmanlar (Base & Surface):** *Freier Fall* filminden ilham alan, dumanlı füme, derin gece mavisi ve çelik grisi tonları. Göz sağlığını korurken derinlik hissi uyandırır.
    * `#121824` (Derin Arka Plan)
    * `#1A2333` (Kart ve Katman Yüzeyleri)
* **Aksiyon ve Kritik Tetikleyiciler (CTA & Alerts):** *La Casa de Papel* dizisinin ikonik Dali kırmızısı.
    * `#D61C2C` (Birincil Butonlar, "İzledim" işaretlemeleri, Silme/İptal aksiyonları)
* **Yıldız Puanlaması ve Vurgular (Highlight):** *Vis a Vis* dizisinin karakteristik sarı/oksit tonu.
    * `#FCD116` (Yıldız Değerlendirmeleri, Premium/Özel rozetler, İstatistik özetleri)
* **Hover ve Aktif Sekme Geçişleri (Interactions):** *Spider-Man* kostümünün dinamik kontrastından esinlenen canlı elektrik mavisi ve kırmızı geçişleri.
    * `#007BFF`'den kırmızının tonlarına uzanan mikro geçişler.

### 🧠 Kullanıcı Deneyimi Standartları
* **Cam Morfizm (Glassmorphism):** Film afişlerinin arkasında hafif bulanık (blur: 10px), yarı şeffaf katmanlar kullanılarak sinematik bir katman derinliği oluşturulacaktır.
* **Mikro Etkileşimler (60fps Animations):** Puanlama yıldızlarının üzerine gelindiğinde (hover) büyümesi, kartların akıcı bir şekilde genişlemesi gibi tüm animasyonlar donanım ivmeli (hardware-accelerated) ve native stabilitede olacaktır.

---

## 3. Sistem Mimarisi ve Teknoloji Yığını (Tech Stack)
Proje, monolitik olmayan, birbirine gevşek bağlı (loosely coupled) **Ayrık Mimari (Decoupled Architecture)** prensibiyle geliştirilecektir. Frontend ve Backend tamamen bağımsız sunucularda (veya servislerde) barındırılacak ve birbirleriyle güvenli bir REST API/JSON katmanı üzerinden haberleşecektir.

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND KATMANI (Client App)              │
│         React.js (Vite) + Tailwind CSS + PWA Engine      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ (HTTPS / Secure JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND KATMANI (API Server)              │
│         Node.js + Express (TypeScript)                  │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│     VERİ TABANI       │         │    KÜRESEL APİ        │
│      PostgreSQL       │         │   TMDB Movie API      │
│                       │         │  (yalnızca backend     │
│                       │         │   proxy üzerinden)     │
└───────────────────────┘         └───────────────────────┘
```

> **Not (Stack Kararı):** Proje, tartışmayı ve dağınıklığı önlemek adına tek bir stack üzerinde netleştirilmiştir: **React.js (Vite) + Node.js/Express (TypeScript) + PostgreSQL**. Next.js, FastAPI ve MongoDB gibi alternatifler değerlendirilmiş ancak mevcut geliştirme deneyimiyle uyum ve ekstra soyutlama katmanı gerektirmemesi nedeniyle kapsam dışı bırakılmıştır.

### 🧱 Katman Detayları
1.  **Frontend (İstemci):**
    * **Teknoloji:** React.js (Vite ile) + Tailwind CSS.
    * **Platform Dağıtımı:** **PWA (Progressive Web App)** standartlarında geliştirilecektir. Kullanıcılar tarayıcı üzerinden giriş yaptıktan sonra uygulamayı mobil cihazlarına veya masaüstlerine "Ana Ekrana Ekle" diyerek yükleyebilecek, tarayıcı barları olmadan native bir uygulama deneyimi yaşayacaktır.
    * **Çevrimdışı Mod (Offline Capability):** MVP kapsamına dahil değildir; ayrıntılar için bkz. **Bölüm 4 – 3. Aşama**.
2.  **Backend (Sunucu):**
    * **Teknoloji:** Node.js + Express (TypeScript).
    * **Görevi:** İş mantığının (business logic) yürütülmesi, JWT tabanlı oturum yönetimi, veri tabanı CRUD işlemleri ve TMDB API entegrasyonunun güvenli bir şekilde sunulması. TMDB'ye giden **tüm** istekler backend üzerinden proxy'lenir; API anahtarı hiçbir koşulda frontend koduna veya tarayıcıya sızmaz (bkz. Bölüm 5 – Güvenlik).
3.  **Veri Tabanı & Dış Servisler:**
    * **Veri Tabanı:** PostgreSQL (ilişkisel veri modeli — kullanıcılar, filmler, incelemeler arasındaki ilişkiler için uygun).
    * **Veri Sağlayıcı:** Film kapak fotoğrafları, türler, oyuncular ve vizyon tarihi gibi bilgileri manuel girmemek adına **TMDB (The Movie Database) API** entegrasyonu.

---

## 4. Gelişmiş Özellik Seti (Feature Set)

### 📌 1. Aşama: MVP (Minimum Uygulanabilir Ürün)
* **Güvenli Oturum Yönetimi:** E-posta/Şifre ile kayıt olma ve giriş yapma.
* **Akıllı Film Arama (TMDB):** Arama barına yazılan film ismine göre anlık (Debounce mekanizmalı) sonuç listeleme. Doğru film seçildiğinde kapak resmi, kategorisi, süresi ve yönetmen bilgisinin otomatik backend üzerinden çekilip forma doldurulması.
* **Kişisel Değerlendirme Alanı:** * 1-5 arası yıldız puanlaması (0.5 buçuklu puan desteği).
    * İzleme tarihi seçici (Zaman Damgası).
    * Spoiler içeren/içermeyen bayrağı (flag) olan zengin metin (Rich Text) inceleme not alanı.
* **Kategorizasyon ve Filtreleme:** Filmleri türlerine (Dram, Aksiyon, Bilim Kurgu) ve kullanıcı durumuna (İzlendi, İzlenecek, Yarım Bırakıldı) göre dinamik filtreleme.
* **Sayfalama (Pagination):** Film listeleme ve filtreleme endpoint'lerinde performansı korumak için **cursor-based pagination** uygulanacaktır (büyüyen koleksiyonlarda offset-based yönteme göre daha tutarlı ve verimlidir). Frontend'de sonsuz kaydırma (infinite scroll) ile entegre edilecektir.

### 📌 2. Aşama: Gelişmiş İstatistik ve Sosyal Entegrasyon
* **Sinematik İstatistik Paneli (Dashboard):** Kullanıcının izleme alışkanlıklarını analiz eden grafikler (Pie Chart, Bar Chart). En çok izlenen türler, aylık izleme süreleri, favori yönetmen ve oyuncu analizleri.
* **Sosyal Paylaşım Kartı (Export Feature):** Seçilen bir film incelemesini ve puanını, Instagram Story veya Twitter formatına uygun, estetik bir görsel kart (PNG) olarak dışa aktarma özelliği.
    * **Teknik Yaklaşım:** Kart, tamamen **client-side** olarak (`html2canvas` veya `dom-to-image` kütüphanesi ile) bir DOM bileşeninden PNG'ye render edilecektir. Bu sayede backend'de ek bir görsel işleme yükü oluşmaz; kullanıcı doğrudan tarayıcıdan indirebilir veya paylaşabilir.
* **Yapay Zeka Öneri Motoru (AI Recommendation):** Kullanıcının yüksek puan verdiği kategorileri ve filmleri baz alarak TMDB üzerinden benzer filmleri öneren mikro algoritma.

### 📌 3. Aşama: Çevrimdışı Destek (Offline Mode)
MVP kapsamında yer almayan, sonraki bir fazda değerlendirilecek gelişmiş bir özelliktir:
* **Service Worker Entegrasyonu:** İnternet bağlantısı kopsa dahi önbellekteki filmlerin görüntülenebilmesi.
* **Yerel Senkronizasyon:** Yeni eklenen not/puanlamaların IndexedDB'de tutulup bağlantı geldiğinde sunucuyla senkronize edilmesi (conflict resolution stratejisi ayrıca tasarlanmalıdır).
* Bu özellik, MVP'nin karmaşıklığını artırmaması için bilinçli olarak sonraya bırakılmıştır.

---

## 5. Profesyonel Yazılım Geliştirme Kuralları (Best Practices)

Projenin sürdürülebilir, güvenli ve ölçeklenebilir (scalable) olması için kodlama aşamasında aşağıdaki endüstri standartlarına kesin olarak uyulacaktır:

### 📑 Kod Kalitesi ve Tasarım Prensipleri
* **SOLID Prensipleri:** Özellikle *Single Responsibility* (Tek Sorumluluk) prensibine uyulacak; her bileşen (component) ve API endpoint'i yalnızca tek bir işten sorumlu olacaktır.
* **Clean Code & Tip Güvenliği:** Sihirli sayılar (magic numbers) ve anlamsız isimlendirmeler yasaktır. Projenin tamamında veri tiplerinin derleme aşamasında doğrulanması için **TypeScript** (veya Python tarafında Tip İpuçları/Pydantic) zorunlu olarak kullanılacaktır.
* **Kuru Kod İlkesi (DRY - Don't Repeat Yourself):** Tekrarlayan UI bileşenleri (örn: Butonlar, Film Kartları, Yıldız Component'ı) ve ortak backend fonksiyonları (örn: Tarih formatlayıcılar, hata yakalayıcılar) ortak modüllere taşınacaktır.

### 🔒 Güvenlik ve Kimlik Doğrulama
* **Şifre Güvenliği:** Kullanıcı şifreleri veri tabanına asla yalın metin (plain text) olarak kaydedilmez. **Bcrypt** veya **Argon2** algoritmaları kullanılarak güçlü bir şekilde salt edilip hash'lenecektir.
* **Oturum Yönetimi (Stateless JWT):** Kullanıcı doğrulaması **JWT (JSON Web Token)** ile yapılacaktır. Token'lar frontend tarafında güvenlik açığı oluşturmayacak şekilde (`HttpOnly` ve `Secure` çerezler - cookies) saklanacaktır.
* **Veri Güvenliği (Sanitization & Validation):** Kullanıcıdan gelen tüm girdiler SQL Injection ve XSS (Cross-Site Scripting) risklerine karşı temizlenecektir. Backend tarafında katı şema doğrulaması (Zod veya Pydantic) uygulanacaktır.
* **API Hız Sınırlaması (Rate Limiting):** Kötü niyetli bot veya DDoS saldırılarını engellemek adına backend tarafında IP başına dakika bazlı istek sınırlaması uygulanacaktır.
* **Üçüncü Parti API Anahtarı Koruması (TMDB Proxy):** TMDB API anahtarı yalnızca backend `.env` dosyasında tutulur ve **hiçbir zaman** frontend'e (JS bundle, network response, vb.) gönderilmez. Frontend, film arama/detay isteklerini kendi backend'ine (`/api/movies/search` gibi) yapar; backend bu isteği TMDB'ye kendi adına iletip sonucu döner. Bu sayede anahtar sızması ve TMDB kotasının kötüye kullanımı önlenir.

### 🚀 Performans ve Optimizasyon
* **Akıllı Önbellekleme (Caching):** Sayfa geçişlerinde tekrarlayan API isteklerini önlemek ve native uygulama hızına ulaşmak için frontend katmanında **React Query (TanStack Query)** veya **SWR** kütüphaneleri kullanılacaktır.
* **Görsel Optimizasyonu:** TMDB API'den gelen büyük boyutlu kapak fotoğrafları, frontend tarafında modern görsel formatları (WebP) ve tembel yükleme (Lazy Loading) mekanizmalarıyla optimize edilerek render edilecektir.

### 🧪 Test Stratejisi
* **Backend Testleri:** İş mantığı ve endpoint'ler için **Jest** (unit test) ve **Supertest** (HTTP entegrasyon testleri) kullanılacaktır. Auth, CRUD ve TMDB proxy katmanları öncelikli test kapsamına alınır.
* **Frontend Testleri:** Bileşenler için **Vitest** + **React Testing Library**; kritik kullanıcı akışları (kayıt, film ekleme, puanlama) için en az temel düzeyde uçtan uca (E2E) testler (**Playwright**) hedeflenir.
* **Kapsam Hedefi:** MVP için kritik iş mantığında (auth, veri doğrulama) asgari %70 test kapsamı hedeflenir; %100 kapsam zorunlu tutulmaz, öncelik riskli/kritik alanlardadır.

### 🛠️ Versiyon Kontrolü ve DevOps
* **Gitflow Workflow:** Geliştirmeler doğrudan ana daldan (main branch) yapılmayacaktır. `main` (canlı ortam), `develop` (geliştirme ortamı) ve her yeni özellik için `feature/ozellik-adi` dalları açılarak düzenli PR (Pull Request) süreçleriyle ilerlenecektir.
* **Çevre Değişkenleri (Environment Variables):** Veri tabanı bağlantı adresleri, JWT gizli anahtarları ve TMDB API Key gibi kritik veriler asla kod içine yazılmayacak; `.env` dosyalarında tutulacak ve sunucu yönetim panellerinden (Vercel, Render, AWS vb.) güvenli bir şekilde enjekte edilecektir.
* **CI/CD Pipeline:** **GitHub Actions** ile her PR'da otomatik lint + test çalıştırılacak; `main` dalına merge sonrası otomatik deployment tetiklenecektir.
* **Hata İzleme (Monitoring):** Canlı ortamdaki hataların yakalanması ve izlenmesi için **Sentry** (veya benzeri bir hata izleme servisi) hem frontend hem backend katmanına entegre edilecektir.

---

## 6. Proje Yol Haritası (Roadmap)

1.  **Aşamaya Hazırlık:** Tasarımların Figma üzerinde netleştirilmesi ve TMDB API erişiminin test edilmesi.
2.  **Veri Tabanı ve Backend Kurulumu:** Kullanıcı şemalarının oluşturulması, Auth (JWT) sisteminin yazılması ve TMDB servis entegrasyonu.
3.  **Frontend ve PWA Kurulumu:** Projenin PWA altyapısının kurulması, temel sayfa yapılarının ve tema renklerinin (`#121824`, `#D61C2C`, `#FCD116`) sisteme tanımlanması.
4.  **Entegrasyon ve Test:** UI katmanının API ile bağlanması, çevrimdışı çalışma senaryolarının ve güvenlik testlerinin (XSS, Rate Limit vb.) tamamlanması.
5.  **Dağıtım (Deployment):** Frontend'in Vercel/Netlify, Backend'in ise Render/DigitalOcean gibi platformlarda canlıya alınması.
