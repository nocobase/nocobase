---
pkg: '@nocobase/plugin-auth'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Kebijakan Keamanan Token

## Pendahuluan

Kebijakan Keamanan Token adalah konfigurasi fungsional yang dirancang untuk melindungi keamanan sistem dan meningkatkan pengalaman pengguna. Kebijakan ini mencakup tiga item konfigurasi utama: "Masa Berlaku Sesi", "Masa Berlaku Token", dan "Batas Waktu Refresh Token Kedaluwarsa".

## Titik Akses Konfigurasi

Titik akses konfigurasi terletak di Pengaturan Plugin - Keamanan - Kebijakan Token:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Masa Berlaku Sesi

**Definisi:**

Masa Berlaku Sesi mengacu pada durasi maksimum yang diizinkan sistem bagi pengguna untuk mempertahankan sesi aktif setelah masuk.

**Fungsi:**

Setelah Masa Berlaku Sesi terlampaui, pengguna akan menerima respons kesalahan 401 saat mengakses sistem, dan kemudian akan dialihkan ke halaman masuk untuk otentikasi ulang.
Contoh:
Jika Masa Berlaku Sesi diatur ke 8 jam, sesi akan kedaluwarsa 8 jam setelah pengguna masuk, dengan asumsi tidak ada interaksi tambahan.

**Pengaturan yang Direkomendasikan:**

- Skenario operasi jangka pendek: Direkomendasikan 1-2 jam untuk meningkatkan keamanan.
- Skenario kerja jangka panjang: Dapat diatur hingga 8 jam untuk mengakomodasi kebutuhan bisnis.

## Masa Berlaku Token

**Definisi:**

Masa Berlaku Token mengacu pada siklus hidup setiap Token yang diterbitkan oleh sistem selama sesi aktif pengguna.

**Fungsi:**

Ketika Token kedaluwarsa, sistem akan secara otomatis menerbitkan Token baru untuk mempertahankan aktivitas sesi.
Setiap Token yang telah kedaluwarsa hanya diizinkan untuk di-refresh sekali.

**Pengaturan yang Direkomendasikan:**

Demi alasan keamanan, direkomendasikan untuk mengaturnya antara 15 hingga 30 menit.
Penyesuaian dapat dilakukan berdasarkan kebutuhan skenario. Contoh:
- Skenario keamanan tinggi: Masa Berlaku Token dapat dipersingkat menjadi 10 menit atau kurang.
- Skenario risiko rendah: Masa Berlaku Token dapat diperpanjang secara tepat hingga 1 jam.

## Batas Waktu Refresh Token Kedaluwarsa

**Definisi:**

Batas Waktu Refresh Token Kedaluwarsa mengacu pada jendela waktu maksimum yang diizinkan bagi pengguna untuk mendapatkan Token baru melalui operasi refresh setelah Token kedaluwarsa.

**Karakteristik:**

- Jika batas waktu refresh terlampaui, pengguna harus masuk kembali untuk mendapatkan Token baru.
- Operasi refresh tidak memperpanjang Masa Berlaku Sesi, melainkan hanya akan meregenerasi Token.

**Pengaturan yang Direkomendasikan:**

Demi alasan keamanan, direkomendasikan untuk mengaturnya antara 5 hingga 10 menit.