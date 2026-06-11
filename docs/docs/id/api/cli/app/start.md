---
title: "nb app start"
description: "Referensi perintah nb app start: memulai aplikasi NocoBase pada env yang ditentukan; bila berlaku, CLI terlebih dahulu menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini, lalu env lokal secara default akan otomatis menyiapkan instalasi atau upgrade yang diperlukan sebelum startup, dan untuk env Docker, container aplikasi dibuat ulang dari konfigurasi yang tersimpan."
keywords: "nb app start,NocoBase CLI,memulai aplikasi,Docker,pm2"
---

# nb app start

Memulai aplikasi NocoBase dari env yang ditentukan. Bila berlaku, CLI terlebih dahulu menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini. Setelah itu, instalasi npm/Git akan otomatis menyiapkan instalasi atau upgrade yang diperlukan sebelum menjalankan perintah aplikasi lokal, sedangkan instalasi Docker akan membuat ulang container aplikasi dari konfigurasi env yang tersimpan.

## Penggunaan

```bash
nb app start [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dimulai, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--verbose` | boolean | Menampilkan output perintah lokal atau Docker yang mendasarinya |

## Contoh

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Secara default, bila berlaku, CLI terlebih dahulu menjalankan `nb license plugins sync --skip-if-no-license` untuk menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini. Setelah itu, env lokal akan otomatis menyiapkan instalasi atau upgrade yang diperlukan sebelum berjalan di background, sedangkan env Docker akan membuat ulang container aplikasi dari konfigurasi env yang tersimpan. Setiap kali CLI perlu menunggu aplikasi siap, CLI akan memeriksa `__health_check`: pertama menampilkan satu baris waiting, lalu satu baris progress setiap 10 detik sampai aplikasi tersedia atau waktunya habis.
## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
