---
title: "nb app start"
description: "Referensi perintah nb app start: memulai aplikasi NocoBase pada env yang ditentukan dan, untuk env Docker, membuat ulang container aplikasi dari konfigurasi yang tersimpan."
keywords: "nb app start,NocoBase CLI,memulai aplikasi,Docker,pm2"
---

# nb app start

Memulai aplikasi NocoBase dari env yang ditentukan. Instalasi npm/Git akan menjalankan perintah aplikasi lokal, instalasi Docker akan membuat ulang container aplikasi dari konfigurasi env yang tersimpan.

## Penggunaan

```bash
nb app start [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dimulai, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--quickstart` | boolean | Memulai aplikasi dengan cepat |
| `--port`, `-p` | string | Menimpa `appPort` pada konfigurasi env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Apakah dijalankan dalam mode daemon, default aktif |
| `--instances`, `-i` | integer | Jumlah instance yang dijalankan |
| `--launch-mode` | string | Mode start: `pm2` atau `node` |
| `--verbose` | boolean | Menampilkan output perintah lokal atau Docker yang mendasarinya |

## Contoh

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local --verbose
nb app start --env local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Secara default, env lokal dijalankan di background, sedangkan env Docker akan membuat ulang container aplikasi dari konfigurasi env yang tersimpan. Setiap kali CLI perlu menunggu aplikasi siap, CLI akan memeriksa `__health_check`: pertama menampilkan satu baris waiting, lalu satu baris progress setiap 10 detik sampai aplikasi tersedia atau waktunya habis.

Jika Anda memberikan `--no-daemon` untuk env lokal, aplikasi akan berjalan di foreground. Dalam kasus itu, CLI tidak akan terus menunggu pemeriksaan readiness setelah startup.

## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
