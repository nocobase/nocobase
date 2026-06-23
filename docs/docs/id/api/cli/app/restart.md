---
title: "nb app restart"
description: "Referensi perintah nb app restart: me-restart aplikasi NocoBase pada env yang ditentukan; bila berlaku, CLI terlebih dahulu menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini, lalu env lokal secara default akan otomatis menyiapkan instalasi atau upgrade yang diperlukan saat restart, dan untuk env Docker, container aplikasi dibuat ulang dari konfigurasi yang tersimpan."
keywords: "nb app restart,NocoBase CLI,me-restart aplikasi,Docker"
---

# nb app restart

Menghentikan lalu memulai kembali aplikasi NocoBase dari env yang ditentukan. Bila berlaku, CLI terlebih dahulu menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini. Setelah itu, env lokal memakai ulang alur `nb app stop` dan `nb app start` dan, secara default, akan otomatis menyiapkan instalasi atau upgrade yang diperlukan sebelum memulai kembali; env Docker akan menghapus container saat ini lebih dulu, lalu membuat ulang container aplikasi dari konfigurasi env yang tersimpan.

## Penggunaan

```bash
nb app restart [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan di-restart, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--verbose` | boolean | Menampilkan output perintah stop dan start yang mendasarinya |

## Contoh

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Secara default, bila berlaku, CLI terlebih dahulu menjalankan `nb license plugins sync --skip-if-no-license` untuk menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini. Setelah itu, env lokal akan otomatis menyiapkan instalasi atau upgrade yang diperlukan sebelum memulai kembali, sedangkan env Docker menyelesaikan langkah ini sebelum membuat ulang container. Setiap kali CLI perlu menunggu aplikasi siap, CLI akan memeriksa `__health_check`: pertama menampilkan satu baris waiting, lalu satu baris progress setiap 10 detik sampai aplikasi tersedia atau waktunya habis.

## Script hook

Jika env saat ini menyimpan hook dengan `nb init --hook-script`, `nb app restart` menjalankan `afterAppStart(context)` sekali setelah app restart dan lolos `__health_check`. Hook menerima `context.phase = 'app-start'` dan `context.command = 'app:restart'`.

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
