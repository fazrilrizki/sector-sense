SECTORS HACKATHON IDEA

JOIN TEAM CODE = TTCWVXS5


Focus = Track 3 Market Intelligence

Ringkasan aplikasi yang ingin dibuat : Membuat web apps yang mengubah data fundamental dari sectors API menjadi rekomendasi investasi yang baik dan terstuktur (kalau bisa zero kerugian) dengan dilengkapi simulasi modal, dan keuntungan yang didapat.

Fitur-fitur yang harus ada pada aplikasi :
Signals or scores: Indikator ringkas berupa sinyal beli/tahan atau skor komposit (misal: Financial Health Score: 8.5/10). 
Rankings: Pemeringkatan emiten berdasarkan kriteria buatan timmu (misal: Top 5 Saham Paling Tahan Inflasi di IHSG). 
Screeners with custom logic: Filter pencarian saham yang menggunakan formula perhitungan sendiri, bukan sekadar filter greater than / less than bawaan API. 
Anomaly detection: Fitur pendeteksi keanehan pasar (misal: saham sektor konsumer yang valuasinya tiba-tiba anjlok ekstrem dibanding historis 3 tahun). 
Comparative analysis: Analisis komparasi head-to-head antar-emiten atau antar-subsektor secara multidimensi. 
Synthesized research outputs: Ringkasan tesis investasi yang menyatukan berbagai metrik menjadi kesimpulan terstruktur (misal: Bull vs Bear Case summary). 


Yang Dilarang / Tidak Lolos (What Does Not Qualify) adalah Membuat grafik Recharts atau diagram donut yang sangat estetik akan langsung gugur jika grafik tersebut hanya menampilkan data mentah dari API Sectors tanpa adanya formula, skor, atau logika analisis baru buatan timmu. 

Tips Krusial untuk Hackathon / Rules Aplikasi: 
Jangan Overfit / Terlalu Rumit: Untuk demo hackathon, gunakan model machine learning yang cepat di-training dan mudah dijelaskan (seperti LightGBM, Random Forest, atau regresi event study) dibanding memaksakan Deep Learning rumit yang lambat saat demo.
Tampilkan UI/UX yang Jelas: Siapkan visualisasi perbandingan sektor (misal: grafik tren valuasi sektor dengan marker tanggal aksi korporasi dan garis proyeksi/ramalan).
Siapkan Metrik Evaluasi: Sajikan metrik evaluasi model (misal: MAPE, RMSE, atau akurasi arah tren F1-score) di slide presentasi agar ramalan dinilai memiliki dasar ilmiah yang valid.

Boundaries/Batasan (PENTING)
Esensi Produk di Atas Tampilan: Jika aplikasi didominasi oleh alur percakapan LLM bolak-balik, juri bisa memindahkannya ke track AI Agents & Assistants. Agar tetap sah di Track 3, produkmu harus berfokus penuh pada kualitas model analitik dan skor data pasarnya (LLM hanya bertindak sebagai asisten pembantu ekstraksi input).
Kewajiban Sumber Data: Wajib mengonsumsi Sectors MCP atau Sectors REST API sebagai sumber data utama.
Larangan Eksekusi Otomatis: Sistem dilarang keras mengeksekusi order trading ke bursa/broker secara otomatis (automated trade execution is prohibited). 
Rekomendasi Alur kerja:
User Profiling (Preferensi):
Sistem menanyakan preferensi dasar: ingin investasi santai jangka panjang atau cepat, siap menghadapi risiko penurunan harga atau tidak, dan berapa modal yang ingin diputar.
Kumpulkan Data Pasar & Jadwal Bagi Dividen (Intelligence Aggregator):
Aplikasi otomatis menarik data kesehatan keuangan perusahaan dari Sectors API, sekaligus mengecek kalender jadwal perusahaan mana saja yang sebentar lagi akan membagikan keuntungan (dividen) kepada pemegang saham.
Forecasting Engine (Ramalan Hitung Untung-Rugi & Jebakan Harga Turu
Sistem menghitung apakah dividen yang didapat sepadan dengan risiko penurunan harga sahamnya. Tujuannya menghindari "jebakan dividen", yaitu kondisi saat dapat dividen 5%, tetapi harga sahamnya langsung anjlok 8% tepat setelah tanggal pembagian dividen lewat.
Bandingkan dengan Saham Saingan di Sektor Serupa (Comparative Synthesis Layer)
Aplikasi tidak langsung menyuruh beli saham tersebut, melainkan menyandingkannya dengan perusahaan pesaing:
Cek Saingan: Membandingkan saham incaran dengan 2–3 saham sejenis (misalnya sesama bank atau sesama perusahaan tambang).
Hitung Untung Alternatif: Menilai apakah uang modal lebih aman dan menguntungkan jika dibelikan saham saingannya yang valuasinya lebih murah, daripada memaksakan beli saham yang sedang ramai karena bagi dividen.
Berikan Pilihan Keputusan Nyata (Actionable Recommendation & Signal Matrix)
Pengguna disajikan dua opsi perbandingan yang jelas:
Pilihan A (Ambil Dividen): Masuk ke saham incaran karena potensi penurunan harganya dinilai minim dan dividennya tinggi.
Pilihan B (Pindah ke Saham Saingan): Hindari saham incaran karena rawan jebakan penurunan harga, lalu alihkan modal ke saham saingannya yang fundamentalnya lebih sehat dan harganya belum terlalu mahal.

Daftar Fitur Minimum Viable Product (MVP)
User Profiling & Preferensi Modal
Modul input sederhana untuk menangkap preferensi pengguna: horizon investasi (santai/jangka panjang vs cepat), toleransi risiko, dan besaran modal investasi.
Intelligence Aggregator (Integrasi Sectors API)
Sistem penarikan otomatis data kesehatan keuangan emiten dan kalender jadwal pembagian dividen dari Sectors API.
Core Engine (Skor, Sinyal, & Screener)
Financial Health Score & Signals: Skor komposit kesehatan keuangan emiten beserta indikator ringkas (Beli / Tahan).
Custom Logic Screener & Ranking: Pemeringkatan saham berdasarkan kriteria/formula buatan tim (misal: Top Saham Tahan Inflasi).
Forecasting Engine (Dividend Trap Detector): Simulasi kalkulasi potensi dividen vs risiko penurunan harga saham untuk menghindari dividend trap.
Comparative Synthesis Layer
Fitur analisis komparasi head-to-head antara saham pilihan pengguna dengan 2–3 saham pesaing sejenis di subsektor yang sama.
Actionable Recommendation & Synthesized Output
Ringkasan tesis investasi terstruktur (Bull vs Bear Case summary).
Rekomendasi aksi nyata berdasar perbandingan (misal: Pilihan A - Ambil Dividen vs Pilihan B - Pindah ke Saham Saingan).


# User Stories - Sectors Hackathon (Track 3)
## Epic: Guest Access (Teaser Experience)
* **US G.1:** Sebagai *Guest*, saya ingin bisa langsung **mengakses Dashboard dan mencari 1 saham di Smart Analyzer** tanpa harus mendaftar, sehingga saya bisa menilai apakah aplikasi ini bermanfaat untuk saya.
* **US G.2:** Sebagai *Guest*, saat saya sudah mencari lebih dari 3 saham (dilacak melalui penyimpanan *client-side* seperti `localStorage` / `cookies`), sistem harus **menampilkan pop-up "Limit Tercapai, Silakan Login"**, sehingga saya terdorong untuk membuat akun gratis.
* **US G.3:** Sebagai *Guest*, saya ingin mencoba **Capital Simulator** dengan modal *default*, namun saya paham bahwa riwayat perhitungannya tidak akan tersimpan setelah saya menutup *browser*.

## Epic 1: Onboarding & User Profiling
* **US 1.1:** Sebagai *investor ritel*, saya ingin bisa **membuat akun dan login**, sehingga preferensi investasi saya dapat tersimpan dengan aman.
* **US 1.2:** Sebagai *investor*, saya ingin **mengisi form profil risiko** (konservatif/agresif, horizon waktu, dan alokasi modal), sehingga aplikasi dapat memberikan rekomendasi yang sesuai dengan batas toleransi kerugian saya.

## Epic 2: Intelligence Aggregator & Anomaly Detection
* **US 2.1:** Sebagai *pengguna*, saya ingin melihat **kalender jadwal bagi dividen (Corporate Radar)**, sehingga saya tahu saham apa saja yang sedang menjadi incaran pasar dalam waktu dekat.
* **US 2.2:** Sebagai *analis pasar*, saya ingin sistem **mendeteksi anomali valuasi secara otomatis**, sehingga saya mendapat notifikasi jika ada saham berfundamental bagus yang harganya tiba-tiba anjlok tajam (undervalued).

## Epic 3: Custom Screening & Rankings
* **US 3.1:** Sebagai *investor*, saya ingin melihat **daftar peringkat saham (Rankings)** berdasarkan kriteria unik buatan sistem (contoh: "Top 5 Saham Tahan Inflasi"), sehingga saya mendapat ide investasi baru.
* **US 3.2:** Sebagai *investor advanced*, saya ingin memfilter saham menggunakan **Custom Screener** dengan formula khusus, sehingga pencarian saya lebih akurat dibanding filter *greater/less than* biasa.

## Epic 4: Forecasting Engine (Dividend Trap Analysis)
* **US 4.1:** Sebagai *investor pemburu dividen*, saya ingin melihat **grafik proyeksi tren harga saham (Forecasting)** pasca tanggal pembagian dividen (*ex-date*) yang dihitung oleh *Hybrid Engine* (kombinasi *Backend Event-Study / Mathematical Engine* untuk risiko penurunan harga dan Gemini/Claude LLM *Structured JSON mode* untuk *reasoning*), sehingga saya bisa menilai apakah saham tersebut rawan terkena jebakan harga turun (*dividend trap*).
* **US 4.2:** Sebagai *juri hackathon / pengguna*, saya ingin melihat **metrik evaluasi model (MAPE/RMSE untuk event-study & Accuracy/F1-Score untuk sinyal)** yang ditampilkan secara transparan pada **halaman khusus Model Performance Panel / Dashboard Analytics di dalam UI aplikasi**, sehingga saya yakin bahwa proyeksi tren dan sinyal rekomendasi memiliki dasar perhitungan ilmiah yang valid (mengingat submission berupa web app + video demo tanpa pitch deck).

## Epic 5: Comparative Synthesis Layer
* **US 5.1:** Sebagai *investor*, saya ingin melihat **Financial Health Score (Skor Komposit 1-10)** dari saham incaran saya, sehingga saya bisa menilai kualitas fundamentalnya dalam satu lirikan.
* **US 5.2:** Sebagai *pengambil keputusan*, saya ingin **membandingkan saham incaran saya head-to-head dengan 2-3 emiten pesaing** di sektor yang sama secara visual (tabel/grafik), sehingga saya tahu siapa pemimpin industri sebenarnya.
* **US 5.3:** Sebagai *investor pemula*, saya ingin membaca **Synthesized Research (Ringkasan Tesis Bull vs Bear)** yang digenerate oleh AI, sehingga saya memahami poin positif dan negatif dari perusahaan tersebut tanpa membaca laporan keuangan yang panjang.

## Epic 6: Actionable Recommendation & Simulation
* **US 6.1:** Sebagai *pengguna*, saya ingin diberikan **dua opsi keputusan yang jelas (Opsi A: Ambil Dividen vs Opsi B: Pindah ke Saingan)** berdasarkan hasil komparasi, sehingga saya tidak bingung harus mengambil tindakan apa.
* **US 6.2:** Sebagai *investor*, saya ingin memasukkan nominal uang saya ke dalam **Capital Simulator**, sehingga saya bisa melihat estimasi nilai uang saya beserta proyeksi potensi untung/rugi dalam Rupiah sebelum benar-benar membelinya di bursa.

# Business Requirements Document (BRD)

## 1. Project Information
* **Project Name:** SmartInvest / DividendShield (Opsional)
* **Team Code:** TTCWVXS5
* **Hackathon Track:** Track 3 - Market Intelligence
* **Core Objective:** Mengubah data fundamental dari Sectors API menjadi rekomendasi investasi terstruktur (dengan mitigasi risiko *dividend trap*), lengkap dengan simulasi modal dan keuntungan.

## 2. Executive Summary
Aplikasi ini adalah platform *market intelligence* berbasis web yang dirancang untuk membantu investor ritel mengambil keputusan investasi berbasis data. Platform menggunakan formula kustom untuk menghasilkan skor kesehatan finansial, pemeringkatan, deteksi anomali, serta rekomendasi komparatif (Opsi A vs Opsi B). Tujuannya adalah meminimalisir risiko kerugian (mendekati *zero loss*) dengan mencegah investor terjebak dalam *dividend trap* (penurunan harga pasca pembagian dividen).

## 3. Project Scope
### In-Scope:
* **Integrasi Data & Caching:** Integrasi data fundamental & kalender dividen via **Sectors MCP / REST API** dengan Next.js Data Cache / Upstash Redis.
* **Hybrid Forecasting & Research Synthesis Engine:** Kombinasi kalkulasi *Event-Study / Mathematical Engine* di Next.js Backend (menghitung risiko *ex-date price drop* & metrik MAPE/RMSE) dengan Gemini/Claude LLM (*Structured Output / JSON Mode*) untuk ekstraksi tesis investasi *Bull vs Bear* dan logika rekomendasi terstruktur.
* **Custom Indicators & Analytics:** "Financial Health Score", Rankings, dan Custom Screener.
* **Visualisasi Komparasi & Keputusan:** Analisis komparasi *head-to-head* antar emiten dan matriks rekomendasi aksi nyata (Opsi A vs Opsi B).
* **Simulasi Modal:** *Capital Simulator* berbasis modal riil pengguna dalam Rupiah.

### Out-of-Scope (Disqualified if implemented):
* **Automated Trade Execution:** Sistem DILARANG mengeksekusi order *trading* secara langsung ke bursa.
* **Pure Raw Data Visualization:** Dilarang hanya menampilkan grafik mentah API tanpa formula buatan tim.
* **Pure Chatbot / Interactive Chat:** DILARANG keras menyediakan antarmuka *chat* atau Percakapan interaktif LLM bolak-balik agar tetap sepenuhnya mematuhi aturan Track 3 Market Intelligence (LLM hanya digunakan untuk *one-shot structured JSON output*).

## 4. User Workflow
1. **User Profiling:** Input toleransi risiko dan modal.
2. **Intelligence Aggregator:** Pengecekan jadwal aksi korporasi (dividen) terdekat.
3. **Forecasting Engine:** Kalkulasi *risk-reward ratio* (potensi dividen vs risiko harga anjlok).
4. **Comparative Synthesis:** Perbandingan *head-to-head* target emiten dengan 2-3 pesaing sejenis.
5. **Actionable Recommendation:** Keputusan Opsi A (Ambil Dividen target) atau Opsi B (Pindah ke saham pesaing yang lebih sehat/murah).

## 5. Functional Requirements
* **FR1 - Signals/Scores:** Kalkulasi "Financial Health Score" (0-10).
* **FR2 - Rankings:** Top-N saham berdasarkan kriteria kustom (Tahan Inflasi, dll).
* **FR3 - Custom Screener:** Filter pencarian dengan formula matematika/logika investasi.
* **FR4 - Anomaly Detection:** Deteksi anjloknya valuasi atau lonjakan utang secara ekstrem.
* **FR5 - Comparative Analysis:** Fitur komparasi finansial target vs pesaing.
* **FR6 - Synthesized Research:** Ringkasan tesis *Bull vs Bear* dari output data.
* **FR7 - Capital Simulation:** Kalkulator konversi rekomendasi menjadi potensi Rupiah riil berdasarkan modal *user*.

## 6. Model Evaluation (UI Integration)
Wajib ditampilkan secara langsung pada UI Web App (*Model Performance Panel / Badge*) di dalam aplikasi:
* **Regression / Event-Study Drop Risk:** MAPE (Mean Absolute Percentage Error) dan RMSE.
* **Classification / Signal Direction:** Accuracy dan F1-Score.



# Database Schema

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| USER_PROFILES : "has one"
    USERS ||--o{ SIMULATIONS : "creates"
    USERS ||--o{ WATCHLISTS : "tracks"

    USERS {
        uuid id PK
        string full_name
        string email
        string password_hash
        timestamp created_at
    }

    USER_PROFILES {
        uuid id PK
        uuid user_id FK
        enum risk_tolerance "CONSERVATIVE, MODERATE, AGGRESSIVE"
        enum investment_horizon "SHORT, MEDIUM, LONG"
        decimal base_capital "10000000.00"
        timestamp updated_at
    }

    SIMULATIONS {
        uuid id PK
        uuid user_id FK
        string target_symbol "e.g., BBCA"
        string competitor_symbol "e.g., BMRI"
        enum chosen_option "OPTION_A, OPTION_B"
        decimal allocated_capital
        decimal projected_pnl "Profit and Loss Projection"
        timestamp created_at
    }

    WATCHLISTS {
        uuid id PK
        uuid user_id FK
        string stock_symbol
        timestamp added_at
    }

## Fullstack Next.js Recommended Architecture & Caching Schema
Relational DB (PostgreSQL via Supabase / Neon dengan Prisma ORM / Drizzle ORM):
Mempertahankan tabel `USERS`, `USER_PROFILES`, `SIMULATIONS`, dan `WATCHLISTS`.
Menambahkan tabel `MODEL_METRICS` (id UUID, model_name VARCHAR, mape DECIMAL, rmse DECIMAL, f1_score DECIMAL, accuracy DECIMAL, last_trained_at TIMESTAMP) untuk menyajikan metrik evaluasi secara live pada UI Model Performance Panel.
Caching & Data Pipeline Strategy (Next.js Data Cache + Upstash Redis):
Menggunakan Next.js `unstable_cache` atau Upstash Redis untuk menyimpan raw payloads dari Sectors API (misal: `sectors:financials:{symbol}`, `sectors:dividends:{symbol}`) serta kalkulasi `HEALTH_SCORES` guna meminimalkan latensi API dan mencegah rate limits.

Pembagian Tugas Pengembang (4 Developer Parallel) & Ambuitas Requirement
Tabel Pembagian Tugas Paralel (4 Developer)
Developer
Scope / Modul Utama
Fitur & User Stories yang Dikerjakan
Prerequisites / Setup Tasks
Kontrak Input/Output (Interface)
Developer 1 (Frontend, Auth & Guest)
UI Shell, Auth, Guest Teaser, Profile & Capital Simulator UI
- US G.1, G.2, G.3 (Guest Access & Client-side localStorage Limit 3x Search)
- US 1.1, 1.2 (Auth & User Risk Profile Form)
- US 6.2 (Capital Simulator UI)
- DB: USERS, USER_PROFILES, SIMULATIONS
Setup Next.js Frontend Repository & UI Component Library (Shadcn UI/Tailwind), setup Auth (Supabase/NextAuth). Tidak tergantung backend fitur lain (bisa pakai Mock API terlebih dahulu).
Inputs: Form user & modal.
Outputs: Stored user profile & simulation payloads ke DB/localStorage.
Developer 2 (Data Pipeline & Aggregator)
Sectors API Integration, Caching, Corporate Radar & Anomaly Detection
- US 2.1 (Kalender Bagi Dividen / Corporate Radar)
- US 2.2 (Anomaly Valuation & Debt Surge Detector)
- FR4 (Anomaly Detection Engine)
Setup Sectors API Integration Client & Caching Layer (Upstash Redis / Next.js Data Cache), pastikan API Key & Environment Variables terkonfigurasi.
Inputs: Query Ticker/Sector ke Sectors API.
Outputs: Clean JSON data dividen & list anomali emiten.
Developer 3 (Core Analytics & Event-Study ML Engine)
Financial Health Score, Custom Screener/Ranking, Dividend Trap Event-Study Engine
- US 3.1, 3.2 (Rankings & Custom Formula Screener)
- US 4.1, 4.2 (Backend Event-Study / Mathematical Engine & Evaluasi MAPE/RMSE/F1/Accuracy di UI)
Setup Next.js Backend Mathematical/Event-Study Engine & kalkulasi metrik (MAPE/RMSE/F1) ke tabel MODEL_METRICS. Menggunakan data dari Dev 2 atau static dump awal.
Inputs: Ticker & historical metrics.
Outputs: Financial Health Score (0-10), Ex-date price drop risk percentage, Ranking list, & Model Performance Metrics JSON.
Developer 4 (LLM Integration & Comparative Synthesis)
Head-to-Head Comparison, LLM Bull vs Bear Synthesis, Actionable Recommendation
- US 5.1, 5.2, 5.3 (Comparative Synthesis & Gemini/Claude LLM Structured JSON Output Bull vs Bear Summary)
- US 6.1 (Decision Matrix: Option A vs Option B)
Setup Gemini/Claude LLM Client API & Structured JSON Prompting Pipelines. Menyepakati Skema Standard JSON Output dari Dev 2 & Dev 3. Bisa di-mock selama Dev 2 & Dev 3 bekerja.
Inputs: Target Ticker + Competitor Tickers + Scores + Event-study risk.
Outputs: Comparison Matrix, Bull/Bear Structured JSON Summary, Option A vs B Decision Matrix.


Granular Task Breakdown & Execution Roadmap (Jira / GitHub / Trello Ready)

Phase 1: Foundation & Project Setup (Urutan Paling Awal / Critical Path)
[TASK-01] Repository & UI Framework Setup (Priority: P0 | Seq: 1)
GitHub Issue: #1 - Repository & UI Framework Setup | Labels: p0, setup, frontend, foundation
Description: Inisialisasi repositori utama menggunakan Next.js (App Router), konfigurasi Tailwind CSS, serta integrasi komponen Shadcn UI dan Lucide Icons. Menyusun struktur folder standar industri (app, components, lib, hooks, types), serta mengatur konfigurasi ESLint, Prettier, dan alias impor TypeScript untuk efisiensi koding tim.
Deliverable: Repositori yang dapat di-clone dan di-build tanpa error dengan pustaka UI siap pakai.
[TASK-02] Database Schema & ORM Initialization (Priority: P0 | Seq: 2)
GitHub Issue: #2 - Database Schema & ORM Initialization | Labels: p0, database, backend, foundation
Description: Konfigurasi instance database PostgreSQL pada Supabase/Neon dan inisialisasi ORM (Prisma/Drizzle). Menyusun dan mengeksekusi migrasi skema tabel dasar: USERS (autentikasi), USER_PROFILES (profil risiko/horizon), SIMULATIONS (riwayat kalkulator), WATCHLISTS (pantauan emiten), serta MODEL_METRICS (log evaluasi ML).
Deliverable: File schema ORM, script migrasi terverifikasi, dan koneksi DB yang stabil.
[TASK-03] Authentication & Session Pipeline (Priority: P0 | Seq: 3)
GitHub Issue: #3 - Authentication & Session Pipeline | Labels: p0, auth, security, foundation
Description: Mengimplementasikan sistem otentikasi berbasis Supabase Auth / NextAuth untuk registrasi dan login (email/password & OAuth). Mengonfigurasi Next.js Middleware guna memproteksi route privat, serta membuat handler session/token khusus untuk memfasilitasi akses pengguna sementara (Guest Access Session).
Deliverable: API/SDK otentikasi siap pakai, proteksi middleware, dan manajemen session teruji.
[TASK-04] Sectors API Integration Client & Caching Layer (Priority: P0 | Seq: 4)
GitHub Issue: #4 - Sectors API Integration Client & Caching Layer | Labels: p0, api, redis, backend, foundation
Description: Membuat modul HTTP Client terisolasi untuk mengonsumsi API Sectors (REST / MCP). Mengintegrasikan layer caching menggunakan Upstash Redis / Next.js Data Cache (`unstable_cache`) dengan strategi revalidasi berkala guna mengurangi jumlah panggil API langsung, mencegah hit rate-limit, dan mempercepat respons data pasar.
Deliverable: Wrapper API Sectors lengkap dengan mekanisme caching otomatis berbasis Redis/Data Cache.
[TASK-05] LLM Client & Structured JSON Pipeline (Priority: P0 | Seq: 5)
GitHub Issue: #5 - LLM Client & Structured JSON Pipeline | Labels: p0, ai, llm, zod, foundation
Description: Menyiapkan integrasi SDK AI (Google Generative AI / Anthropic API). Merancang pipeline 1-shot prompt yang dipadu dengan validasi skema Zod (Structured JSON Output / Response Schema) untuk memastikan output analisis tesis Bull vs Bear selalu dalam format JSON konsisten tanpa halusinasi sintaks.
Deliverable: Service LLM yang menghasilkan output JSON tervalidasi skema Zod secara konsisten.

Phase 2: Core Data Engine & Aggregator (Sectors API Integration)
[TASK-06] Financial Data Fetcher & Cache Store (Priority: P1 | Seq: 6 | Dep: TASK-04)
GitHub Issue: #6 - Financial Data Fetcher & Cache Store | Labels: p1, backend, data-pipeline
Description: Mengembangkan service penarik data laporan keuangan emiten (balance sheet, income statement, cash flow) secara komprehensif dari API Sectors. Melakukan normalisasi format data finansial dan menyimpannya ke cache key (`sectors:financials:{symbol}`) untuk konsumsi modul analitik internal.
Deliverable: Endpoint/service internal penyuplai data keuangan emiten yang sudah bersih dan ter-cache.
[TASK-07] Corporate Radar & Dividend Calendar Engine (Priority: P1 | Seq: 7 | Dep: TASK-04)
GitHub Issue: #7 - Corporate Radar & Dividend Calendar Engine | Labels: p1, backend, dividends, radar
Description: Membuat engine agregasi jadwal pembagian dividen dan aksi korporasi emiten dari API Sectors. Menyusun struktur kalender aksi korporasi mendatang (Cum Date, Ex Date, Payment Date) beserta histori yield dividen untuk mengidentifikasi emiten yang potensial masuk radar investasi.
Deliverable: Service agregator jadwal dividen dan kalender aksi korporasi terkini.
[TASK-08] Anomaly Detection Engine (Priority: P1 | Seq: 8 | Dep: TASK-06)
GitHub Issue: #8 - Anomaly Detection Engine | Labels: p1, backend, analytics, anomaly-detection
Description: Merancang logika kuantitatif untuk mendeteksi anomali kondisi pasar dan pasar emiten secara otomatis. Engine akan membandingkan valuasi saat ini terhadap rata-rata historis (misal: penurunan PE/PBV ekstrem >2 standar deviasi) dan mendeteksi lonjakan rasio utang (DER) atau lonjakan arus kas mendadak.
Deliverable: Algoritma pemindai anomali yang menghasilkan daftar alert dan status anomali emiten.

Phase 3: Core Analytics & Mathematical ML Engine
[TASK-09] Financial Health Score Calculator (Priority: P1 | Seq: 9 | Dep: TASK-06)
GitHub Issue: #9 - Financial Health Score Calculator | Labels: p1, analytics, scoring, ml-engine
Description: Mengembangkan formula pembobotan khusus untuk menghitung skor komposit kesehatan finansial emiten dalam skala 0–10. Algoritma mengevaluasi 5 pilar utama: Profitabilitas (ROE/ROA), Solvabilitas (DER), Likuiditas (Current Ratio), Pertumbuhan pendapatan, dan Keberlanjutan Dividen.
Deliverable: Modul kalkulator skor kesehatan finansial yang menghasilkan nilai kuantitatif beserta breakdown indikatornya.
[TASK-10] Custom Logic Screener & Ranking Engine (Priority: P1 | Seq: 10 | Dep: TASK-06, TASK-09)
GitHub Issue: #10 - Custom Logic Screener & Ranking Engine | Labels: p1, analytics, screener, ranking
Description: Membangun engine pemeringkatan emiten berdasarkan logika kustom kuis/formula investasi internal (misalnya: "Top 5 Saham Tahan Inflasi", "Dividen Aristokrat Indonesia"). Menghindari penggunaan filter standar API biasa dan menggantinya dengan skor komposit kustom buatan tim.
Deliverable: Endpoint screener kuantitatif dengan formula kustom yang menghasilkan array emiten terurut.
[TASK-11] Event-Study Dividend Trap Forecasting Engine (Priority: P1 | Seq: 11 | Dep: TASK-07)
GitHub Issue: #11 - Event-Study Dividend Trap Forecasting Engine | Labels: p1, ml-engine, forecasting, dividend-trap
Description: Membangun model matematika/metode event-study backend untuk memprediksi besaran penurunan harga saham tepat saat ex-date dividen. Engine membandingkan estimasi penurunan harga dengan persentase yield dividen untuk menentukan risiko jebakan dividen (Dividend Trap Risk Level).
Deliverable: Service matematika penghitung estimasi penurunan harga dan tingkat risiko dividend trap.
[TASK-12] Model Performance Evaluator & Metrics Logger (Priority: P1 | Seq: 12 | Dep: TASK-11)
GitHub Issue: #12 - Model Performance Evaluator & Metrics Logger | Labels: p1, ml-engine, metrics, evaluation
Description: Mengembangkan modul pengujian dan validasi ilmiah untuk mengukur performa model prediksi. Menghitung metrik regresi (MAPE, RMSE) untuk akurasi nilai dan metrik klasifikasi (Accuracy, F1-Score) untuk arah sinyal tren, lalu menyimpan datanya secara otomatis ke tabel `MODEL_METRICS`.
Deliverable: Logger performa model automatik yang mengekspos metrik ilmiah valid ke database.

Phase 4: Comparative Synthesis & Recommendation Engine (LLM)
[TASK-13] Head-to-Head Peer Comparison Engine (Priority: P1 | Seq: 13 | Dep: TASK-06, TASK-09)
GitHub Issue: #13 - Head-to-Head Peer Comparison Engine | Labels: p1, backend, analytics, comparison
Description: Membangun service agregator perbandingan multidimensi antara emiten target pengguna dengan 2–3 pesaing utamanya pada subsektor yang sama. Mengompilasi data Financial Health Score, rasio valuasi, pertumbuhan laba, dan margin secara berdampingan.
Deliverable: Data struktur matriks komparasi emiten target vs kompetitor.
[TASK-14] LLM Structured Research Generator (Bull vs Bear) (Priority: P1 | Seq: 14 | Dep: TASK-05, TASK-13)
GitHub Issue: #14 - LLM Structured Research Generator (Bull vs Bear) | Labels: p1, ai, llm, research-synthesis
Description: Mengintegrasikan pipeline LLM (dari TASK-05) dengan data komparasi (TASK-13). Menghasilkan sintesis tesis investasi terstruktur yang merangkum skenario optimis (Bull Case) dan skenario pesimis (Bear Case) secara otomatis dan instan tanpa interaksi chat bolak-balik.
Deliverable: Generator tesis investasi ringkas berbasis JSON yang berisi poin Bull vs Bear.
[TASK-15] Actionable Decision Matrix Engine (Option A vs B) (Priority: P1 | Seq: 15 | Dep: TASK-11, TASK-14)
GitHub Issue: #15 - Actionable Decision Matrix Engine (Option A vs B) | Labels: p1, decision-matrix, analytics
Description: Mengembangkan logika pengambil keputusan akhir yang memetakan hasil perhitungan risiko dividend trap dan sintesis komparasi menjadi dua pilihan aksi yang jelas: Opsi A (Tetap Ambil Dividen Target) atau Opsi B (Beralih ke Saham Saingan yang Lebih Sehat/Murah).
Deliverable: Core decision engine yang mengekspos rekomendasi biner (Opsi A vs B) beserta justifikasinya.

Phase 5: Frontend Interface & User Experience
[TASK-16] UI Shell & Dashboard Layout (Priority: P1 | Seq: 16 | Dep: TASK-01)
GitHub Issue: #16 - UI Shell & Dashboard Layout | Labels: p1, frontend, ui, layout
Description: Membangun kerangka halaman utama web application meliputi header navigasi, sidebar responsif, tombol pengubah tema (light/dark mode), komponen modal global, serta container layout tempat widget analisis ditampilkan secara rapi.
Deliverable: Layout visual utama aplikasi yang responsif dan siap ditempeli modul-modul UI.
[TASK-17] Guest Access & Teaser Limits Handler (Priority: P1 | Seq: 17 | Dep: TASK-03, TASK-16)
GitHub Issue: #17 - Guest Access & Teaser Limits Handler | Labels: p1, frontend, guest-access, ux
Description: Membangun antarmuka untuk pengguna Guest yang memungkinkan pencarian emiten secara bebas hingga maksimal 3 kali search. Mengimplementasikan pencatat kuota pada `localStorage`/`cookies` yang secara otomatis memunculkan pop-up modal "Limit Pencarian Tercapai" untuk mendorong pendaftaran akun gratis.
Deliverable: Flow pengalaman pengguna Guest beserta komponen pop-up pembatas kuota pencarian.
[TASK-18] User Profiling & Risk Questionnaire UI (Priority: P1 | Seq: 18 | Dep: TASK-02, TASK-16)
GitHub Issue: #18 - User Profiling & Risk Questionnaire UI | Labels: p1, frontend, onboarding, user-profile
Description: Merancang dan menguji form interaktif (wizard/stepper) onboarding pengguna untuk menangkap preferensi modal awal dalam Rupiah, toleransi risiko (Konservatif/Moderat/Agresif), dan horizon waktu investasi, serta menyimpannya ke profil pengguna.
Deliverable: Halaman/modal profil interaktif yang terhubung langsung dengan tabel DB `USER_PROFILES`.
[TASK-19] Smart Analyzer & Corporate Radar UI (Priority: P1 | Seq: 19 | Dep: TASK-07, TASK-08, TASK-09)
GitHub Issue: #19 - Smart Analyzer & Corporate Radar UI | Labels: p1, frontend, smart-analyzer, corporate-radar
Description: Membangun antarmuka Smart Analyzer yang menampilkan widget visualisasi Financial Health Score (gauge chart/badge), tampilan kalender aksi korporasi (Corporate Radar), dan badge peringatan visual saat anomali pasar terdeteksi.
Deliverable: Tampilan visual Smart Analyzer, radar dividen, dan indikator anomali yang informatif.
[TASK-20] Head-to-Head Comparison & Decision Matrix UI (Priority: P1 | Seq: 20 | Dep: TASK-13, TASK-15)
GitHub Issue: #20 - Head-to-Head Comparison & Decision Matrix UI | Labels: p1, frontend, comparison-ui, decision-matrix
Description: Merancang tabel komparasi interaktif yang membandingkan metrik emiten target vs kompetitor, serta menampilkan rekomendasi kartu aksi utama (Opsi A vs Opsi B) lengkap dengan tab sintesis tesis Bull vs Bear secara visual.
Deliverable: Tampilan tabel komparasi emiten dan kartu rekomendasi keputusan investasi yang intuitif.
[TASK-21] Capital Simulator UI & PnL Calculator (Priority: P1 | Seq: 21 | Dep: TASK-15, TASK-18)
GitHub Issue: #21 - Capital Simulator UI & PnL Calculator | Labels: p1, frontend, simulator, pnl-calculator
Description: Membangun antarmuka kalkulator kalkulasi simulasi modal riil (dalam Rupiah). Pengguna dapat memasukkan estimasi dana investasi untuk melihat perbandingan proyeksi keuntungan/kerugian bersih (PnL) antara memilih Opsi A vs Opsi B sebelum mengeksekusi secara mandiri.
Deliverable: Modul UI simulator modal interaktif beserta grafik proyeksi estimasi hasil Rupiah.
[TASK-22] Model Performance Analytics Dashboard UI (Priority: P1 | Seq: 22 | Dep: TASK-12)
GitHub Issue: #22 - Model Performance Analytics Dashboard UI | Labels: p1, frontend, analytics-dashboard, model-metrics
Description: Membangun halaman / panel khusus "Model Performance & Validity" pada UI aplikasi untuk menampilkan indikator transparan terkait keandalan ilmiah model (nilai live MAPE, RMSE, Accuracy, dan F1-Score) guna meyakinkan juri dan pengguna.
Deliverable: Panel Analytics UI yang menampilkan metrik validasi ilmiah model ML secara dinamis.

Phase 6: Compliance Audit, QA & Deployment
[TASK-23] Hackathon Rules & Boundaries Compliance Audit (Priority: P0 | Seq: 23)
GitHub Issue: #23 - Hackathon Rules & Boundaries Compliance Audit | Labels: p0, audit, compliance, qa
Description: Melakukan pengujian kepatuhan ketat terhadap batasan Track 3: Memastikan tidak ada eksekusi order trading otomatis, memverifikasi tidak ada interface chat/chatbot bolak-balik (hanya 1-shot JSON), serta memastikan seluruh visualisasi grafik menerapkan formula kustom internal.
Deliverable: Laporan checklist verifikasi kepatuhan seluruh batasan aturan Hackathon Track 3.
[TASK-24] End-to-End Testing & Production Deployment (Priority: P0 | Seq: 24 | Dep: All tasks)
GitHub Issue: #24 - End-to-End Testing & Production Deployment | Labels: p0, deployment, e2e-testing, devops
Description: Menguji alur lengkap dari Onboarding Guest hingga Simulasi Modal. Melakukan deployment aplikasi siap pakai ke Vercel/Cloud Platform, mengonfigurasi environment variables, serta memastikan performa aplikasi stabil saat demo.
Deliverable: URL produksi aplikasi web terintegrasi yang stabil dan siap dipresentasikan.


Strategi Pembagian Tugas Developer (Pola Eksekusi Fleksibel)
Untuk mengoptimalkan beban kerja tim dalam pengerjaan 24 task di atas, tim dapat menerapkan dua pilihan pendekatan alokasi tugas sesuai dengan dinamika dan keahlian anggota:
Pendekatan A: Lintas Fase Berbasis Spesialisasi (Spesialis / Vertical Ownership)
Sangat ideal jika masing-masing anggota memiliki keahlian yang terdefinisi dengan jelas (misal: murni Frontend, Backend/Data, Machine Learning, atau AI/LLM):
Developer 1 (Frontend & UX Specialist): Memegang kendali penuh pada TASK-01, TASK-16, TASK-17, TASK-18, TASK-19, TASK-20, TASK-21, dan TASK-22.
Developer 2 (Data Engineering & Backend Specialist): Memegang kendali pada TASK-02, TASK-03, TASK-04, TASK-06, TASK-07, dan TASK-08.
Developer 3 (Quantitative / ML Specialist): Memegang kendali pada TASK-09, TASK-10, TASK-11, TASK-12, dan berkontribusi pada TASK-22.
Developer 4 (AI / LLM & QA Lead): Memegang kendali pada TASK-05, TASK-13, TASK-14, TASK-15, TASK-23, dan TASK-24.
Pendekatan B: Eksekusi Paralel Berbasis Fase (Full-Stack / Sequential Feature Ownership)
Sangat ideal jika anggota tim memiliki keahlian Full-Stack yang merata. Tim menyelesaikan fondasi awal bersama-sama, lalu membagi fitur secara horizontal per fase:
Fase 1 (Foundation): Dikerjakan bersama-sama oleh seluruh anggota tim (TASK-01 s/d TASK-05) hingga critical path siap.
Fase 2 s/d 5 (Feature Execution): Pengembang mengambil tanggung jawab penuh secara end-to-end (API backend hingga UI frontend) untuk satu fitur utuh (misal: Dev A memegang seluruh alur Dividen Radar, Dev B memegang alur Head-to-Head Comparison, dsb).
