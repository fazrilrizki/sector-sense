# Sector Sense

Sector Sense adalah platform analisis dan simulasi saham berbasis AI yang dibangun dengan [Next.js](https://nextjs.org) (App Router), React 19, TypeScript, Tailwind CSS, dan [Supabase](https://supabase.com).

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
- [Node.js](https://nodejs.org) v20 atau lebih baru
- Akun [Supabase](https://supabase.com) (cloud) atau Supabase CLI untuk lokal

### 2. Instalasi Dependensi
Clone repository dan pasang paket yang diperlukan:

```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin template konfigurasi dari `.env.example` ke file `.env.local`:

```bash
cp .env.example .env.local
# atau di Windows PowerShell:
# Copy-Item .env.example .env.local
```

Buka `.env.local` dan isi nilai variabel yang diperoleh dari Supabase Dashboard:
- Buka **Supabase Dashboard** &rarr; Pilih Proyek Anda &rarr; Masuk ke menu **Project Settings** &rarr; **API**.
- Salin **Project URL** ke `NEXT_PUBLIC_SUPABASE_URL`.
- Salin **anon (public)** key ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Salin **service_role (secret)** key ke `SUPABASE_SERVICE_ROLE_KEY` (*hanya digunakan di server/backend, jangan pernah di-commit atau diekspos ke client*).

---

## 🗄️ Menjalankan Database Migration

Skema database project ini dirancang dengan pendekatan best practice Supabase (Opsi A):
- Data otentikasi (email, password hash terenkripsi) dikelola penuh oleh Supabase Auth (`auth.users`).
- Profil pengguna dan preferensi investasi dikelola oleh tabel `public.user_profiles` yang berelasi 1-to-1 dengan `auth.users(id)`.
- Ketika user mendaftar via Supabase Auth, PostgreSQL trigger secara otomatis membuat record profil baru.

File migration database terletak di:
📁 **`supabase/migrations/20260917000001_initial_schema.sql`**

Anda dapat menjalankan migrasi ini menggunakan salah satu dari dua metode berikut:

### Metode 1: Melalui Supabase Web Dashboard (Paling Mudah)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyek Anda.
2. Pada navigasi sidebar kiri, klik menu **SQL Editor**.
3. Klik tombol **New query**.
4. Buka file `supabase/migrations/20260917000001_initial_schema.sql`, salin seluruh isinya, dan tempel ke dalam SQL Editor.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter` / `Cmd + Enter`).
6. Verifikasi tabel dan fungsi:
   - Masuk ke menu **Table Editor** untuk memastikan tabel `user_profiles`, `simulations`, `watchlists`, dan `model_metrics` telah terbuat beserta Row Level Security (RLS)-nya.
   - Masuk ke menu **Database** &rarr; **Triggers** untuk memastikan trigger `on_auth_user_created` aktif.

### Metode 2: Menggunakan Supabase CLI
Jika Anda mengelola database melalui CLI:

```bash
# Login ke Supabase CLI
npx supabase login

# Tautkan proyek lokal ke proyek Supabase cloud Anda (ambil project-ref dari dashboard URL)
npx supabase link --project-ref <your-project-ref>

# Jalankan seluruh migrasi yang belum terpasang
npx supabase db push
```

---

## 🏃 Menjalankan Development Server

Setelah konfigurasi `.env.local` dan migration selesai dijalankan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Verifikasi & Testing Kode

Untuk menjalankan pengujian unit otentikasi, type checking, dan build:

```bash
# Menjalankan pengujian unit otentikasi & proteksi route proxy
npm test

# Type check & production build Next.js 16
npm run build
```

---

## 🔐 Arsitektur Otentikasi & Sesi

Platform ini menggunakan sistem otentikasi siap pakai berbasis **Supabase Auth SSR** dan **Next.js 16 Proxy**:
1. **Email & Password**: Registrasi akun baru dengan verifikasi email otomatis, serta login dengan validasi kredensial.
2. **Guest Access Session (Akses Tamu)**: Memungkinkan pengguna menjelajah dan menjalankan simulasi portofolio tanpa login awal, dengan kemampuan *upgrade* ke akun permanen secara langsung tanpa kehilangan data. Panduan aktivasi lengkap di Supabase Dashboard dapat dibaca di [docs/guest-access-setup.md](docs/guest-access-setup.md).
3. **Proteksi Route (`proxy.ts`)**: Route guard otomatis untuk rute privat (`/dashboard`), redirect pengguna terotentikasi dari halaman `/login` dan `/register`, serta penanganan token refresh yang aman.
4. **Alur Verifikasi Email & Auto-Login**: Pengguna mendaftar &rarr; diarahkan ke `/login` dengan notifikasi &rarr; klik tautan di email &rarr; otomatis login masuk ke `/dashboard`.

