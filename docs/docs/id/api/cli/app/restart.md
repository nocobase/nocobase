---
title: "nb app restart"
description: "Referensi perintah nb app restart: me-restart aplikasi NocoBase pada env yang ditentukan dan, untuk env Docker, membuat ulang container aplikasi dari konfigurasi yang tersimpan."
keywords: "nb app restart,NocoBase CLI,me-restart aplikasi,Docker"
---

# nb app restart

Menghentikan lalu memulai kembali aplikasi NocoBase dari env yang ditentukan. Env lokal memakai ulang alur `nb app stop` dan `nb app start`; env Docker akan menghapus container saat ini lebih dulu, lalu membuat ulang container aplikasi dari konfigurasi env yang tersimpan.

## Penggunaan

```bash
nb app restart [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan di-restart, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--quickstart` | boolean | Memulai aplikasi dengan cepat setelah dihentikan |
| `--port`, `-p` | string | Menimpa `appPort` pada konfigurasi env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Apakah dijalankan dalam mode daemon setelah dihentikan, default aktif |
| `--instances`, `-i` | integer | Jumlah instance yang dijalankan setelah dihentikan |
| `--launch-mode` | string | Mode start: `pm2` atau `node` |
| `--verbose` | boolean | Menampilkan output perintah stop dan start yang mendasarinya |

## Contoh

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local --verbose
nb app restart --env local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Setiap kali CLI perlu menunggu aplikasi siap, CLI akan memeriksa `__health_check`: pertama menampilkan satu baris waiting, lalu satu baris progress setiap 10 detik sampai aplikasi tersedia atau waktunya habis. Jika Anda memberikan `--no-daemon` untuk env lokal, aplikasi akan berjalan di foreground, jadi CLI tidak akan terus menunggu pemeriksaan readiness setelah startup.

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
