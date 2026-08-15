# Type Race Competition
> Teknik Informatika | Universitas Darussalam Gontor

Aplikasi web kompetisi mengetik (*typing race*) yang interaktif, mendukung berbagai bahasa, dan dilengkapi dengan mode *multiplayer realtime*. Proyek ini dibangun menggunakan **Next.js 15 (App Router)** dan **Supabase**.

## 🌟 Fitur Utama

- **Dukungan Multi-Bahasa**: Soal latihan tersedia dalam 3 bahasa (Indonesia 🇮🇩, Inggris 🇬🇧, dan Arab 🇸🇦). Termasuk dukungan *Right-to-Left* (RTL) dinamis untuk bahasa Arab.
- **Solo Race**: Mode latihan mandiri di mana Anda dapat menguji kecepatan mengetik (WPM) dan akurasi Anda secara langsung.
- **Multiplayer Battle**: Balapan mengetik secara langsung (realtime) dengan hingga 10 pemain sekaligus. Menggunakan sistem *Broadcast* yang sangat responsif, sehingga *progress bar* pergerakan lawan terlihat mulus tanpa tertunda.
- **Auto-Sync Language**: Sistem *room code* (contoh: `AR-XYZ12`) otomatis memaksa semua pemain yang bergabung untuk menggunakan bahasa dan soal yang sama dengan pembuat ruangan.
- **Hall of Fame**: Papan peringkat teratas (Top 20) untuk tiap bahasa, dilengkapi dengan filter waktu (Sepanjang Waktu, Hari Ini, Minggu Ini, Bulan Ini).

## 💻 Teknologi yang Digunakan

- **Frontend**: Next.js 15 (React 19), Tailwind CSS, TypeScript
- **State Management**: Zustand (ringan & cepat)
- **Backend & Database**: Supabase (PostgreSQL)
- **Realtime Server**: Supabase Realtime (WebSocket Broadcast & Presence)

## 🚀 Cara Instalasi & Menjalankan (Lokal)

### 1. Kloning Repositori
```bash
git clone https://github.com/nashehannafii/type-race.git
cd type-race-competition
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Supabase
1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Masuk ke **SQL Editor** di dashboard Supabase Anda.
3. Salin dan jalankan seluruh isi kode dari file `supabase-schema.sql` untuk membuat tabel-tabel yang dibutuhkan dan mengatur aturan keamanannya (RLS).
4. Masuk ke menu **Project Settings -> API**.
5. Buka file `.env` di proyek ini, dan isi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=URL_SUPABASE_ANDA
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
   ```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser Anda dan kunjungi `http://localhost:3000`.

## 🌐 Cara Deploy ke Vercel

Aplikasi ini dapat di-*hosting* sepenuhnya secara gratis menggunakan **Vercel** dan **Supabase**.

1. Pastikan kode Anda sudah berada di repositori **GitHub**.
2. Masuk ke [Vercel](https://vercel.com/) dan buat proyek baru (*Add New Project*).
3. Import repositori GitHub Anda.
4. Pada bagian **Environment Variables**, tambahkan:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` | Value: (URL Supabase Anda)
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: (Anon Key Supabase Anda)
5. Klik **Deploy**. Selesai! Aplikasi Anda kini online dan fitur *realtime*-nya akan langsung berfungsi!

## 📝 Lisensi

Aplikasi ini bersifat *Open Source* dan dapat digunakan, dimodifikasi, dan dikembangkan lebih lanjut.
