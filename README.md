# Weather App

Weather App modern berbasis **TypeScript + Vite** dengan fitur:
- pencarian cuaca berdasarkan nama kota
- deteksi lokasi pengguna (geolocation)
- menampilkan suhu dan kelembapan
- forecast beberapa hari ke depan

UI sudah memakai gaya modern (glassmorphism, gradient glow, responsive layout).

## Tech Stack

- TypeScript
- Vite
- OpenWeather API

## Fitur Utama

- **Search by city**: cari cuaca berdasarkan nama kota.
- **Use My Location**: ambil koordinat lokasi pengguna dari browser.
- **Current weather**: tampilkan kondisi, ikon, suhu, dan kelembapan.
- **Multi-day forecast**: tampilkan forecast beberapa hari.
- **One Call first, fallback otomatis**:
  - aplikasi mencoba One Call 3.0 terlebih dulu
  - jika One Call tidak aktif untuk akun/key, aplikasi fallback ke endpoint standar agar tetap berfungsi

## Cara Menjalankan

1. Install dependencies:

```bash
npm install
```

2. Buat file `.env` di root project (contoh ada di `.env.example`):

```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

3. Jalankan mode development:

```bash
npm run dev
```

4. Build production:

```bash
npm run build
```

5. Preview build:

```bash
npm run preview
```

## Catatan OpenWeather API

- Key API harus aktif dan valid.
- Untuk endpoint **One Call 3.0**, akun biasanya perlu subscription **One Call by Call**.
- Jika One Call belum aktif, aplikasi akan menampilkan data dari endpoint standar secara otomatis.

## Struktur File Penting

- `src/main.ts` → logic fetch API, geolocation, render data
- `src/style.css` → styling modern UI
- `.env.example` → contoh konfigurasi API key

## Troubleshooting

- Jika muncul `Invalid API key (401)`:
  - pastikan key benar di `.env`
  - restart server dev (`Ctrl + C`, lalu `npm run dev`)
  - tunggu beberapa menit jika key baru dibuat

- Jika One Call 3.0 gagal:
  - cek subscription One Call di akun OpenWeather
  - aplikasi tetap jalan dengan mode fallback endpoint standar
