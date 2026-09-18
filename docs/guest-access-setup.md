# Panduan Aktivasi & Konfigurasi Fitur Masuk Sebagai Tamu (Guest Access)

Fitur **Akses Pengguna Sementara (Guest Access Session)** di **Sector Sense** memungkinkan pengguna langsung menjelajahi platform, mencoba simulasi alokasi portofolio saham, dan melihat metrik model AI tanpa perlu mendaftarkan email di awal.

Secara default, Supabase menonaktifkan fitur *Anonymous Sign-Ins* untuk setiap proyek baru. Ikuti langkah-langkah di bawah ini untuk mengaktifkannya di Supabase Dashboard Anda.

---

## 🛠️ Langkah 1: Mengaktifkan Anonymous Sign-Ins di Supabase Dashboard

1. Buka dan login ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih proyek Anda.
3. Pada bilah navigasi kiri, pilih menu **Authentication** (ikon gembok).
4. Klik tab/submenu **Providers** (atau **Sign In / Up** tergantung versi antarmuka Supabase).
5. Gulir ke bawah hingga menemukan bagian **Anonymous Sign-ins** (atau **Allow Anonymous Sign-ins**).
6. Aktifkan toggle switch menjadi **ON / Enabled**.
7. Klik tombol **Save** di pojok kanan bawah untuk menyimpan perubahan.

> [!NOTE]
> Setelah opsi ini aktif, backend Supabase akan menerima permintaan otentikasi dari fungsi SDK `supabase.auth.signInAnonymously()`.

---

## 🌐 Langkah 2: Konfigurasi Redirect URL (Penting untuk Verifikasi Email)

Agar tautan verifikasi email pendaftaran dan proses callback otentikasi dapat otomatis mengarahkan pengguna kembali ke aplikasi lokal maupun produksi:

1. Di menu **Authentication**, pilih submenu **URL Configuration**.
2. **Site URL**:
   - Untuk pengembangan lokal: `http://localhost:3000`
   - Untuk produksi: masukkan domain website Anda (misal: `https://sectorsense.com`).
3. **Redirect URLs**:
   Tambahkan URL callback berikut pada daftar *Redirect URLs*:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - *(Jika di produksi, tambahkan juga domain produksi seperti `https://yourdomain.com/auth/callback`)*
4. Klik **Save**.

---

## 🧠 Bagaimana Fitur Tamu Bekerja Secara Teknis?

Arsitektur sesi tamu di Sector Sense dirancang secara *hybrid* dengan keamanan penuh:

```
[Pengguna Klik "Masuk sebagai Tamu"]
            │
            ▼
[Server Action: signInAsGuest()]
            │
            ├─► 1. Supabase Auth: signInAnonymously()
            │      └─► Menghasilkan UUID pengguna anonim di auth.users (is_anonymous = true).
            │
            ├─► 2. Database PostgreSQL Trigger: handle_new_user()
            │      └─► Otomatis membuat baris di tabel public.user_profiles dengan:
            │          full_name = 'Tamu (Guest)' & is_guest = true.
            │
            ├─► 3. Penyematan Cookie Sesi: sector_guest_session
            │      └─► Menyimpan token sesi tamu yang aman (HTTP-only) berdurasi 7 hari.
            │
            ▼
[Next.js 16 Proxy: proxy.ts]
            │
            ├─► Mengizinkan akses ke rute simulasi (/dashboard, /simulations).
            ├─► Membatasi rute murni pengguna terdaftar (/profile, /settings).
            └─► Menampilkan Guest Banner di bagian atas layar.
```

---

## 🔄 Bagaimana Cara Kerja Upgrade Akun Tamu?

Ketika pengguna tamu memutuskan untuk mendaftar akun permanen:
1. Pengguna mengeklik tombol **"Simpan Akun Permanen"** pada Guest Banner.
2. Pengguna mengisi Nama, Email, dan Password di form registrasi.
3. Fungsi `upgradeGuestAccount()` di `lib/auth/actions.ts` memanggil:
   ```typescript
   await supabase.auth.updateUser({
     email,
     password,
     data: { full_name, is_guest: false }
   })
   ```
4. **Keunggulan Utama**: Supabase mengubah akun anonim menjadi akun email/password permanen **tanpa mengubah UUID pengguna**.
5. Seluruh data simulasi portofolio dan watchlist yang sebelumnya telah dibuat selama sesi tamu **tetap tersimpan utuh** dan kini terikat secara permanen pada akun pengguna baru.
