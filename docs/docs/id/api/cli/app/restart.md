---
title: "nb app restart"
description: "Referensi perintah nb app restart: me-restart aplikasi NocoBase atau container Docker dari env yang ditentukan."
keywords: "nb app restart,NocoBase CLI,me-restart aplikasi,Docker"
---

# nb app restart

Menghentikan lalu memulai kembali aplikasi NocoBase dari env yang ditentukan.

## Penggunaan

```bash
nb app restart [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan di-restart, jika dilewati menggunakan env saat ini |
| `--quickstart` | boolean | Memulai aplikasi dengan cepat setelah dihentikan |
| `--port`, `-p` | string | Mengganti `appPort` di konfigurasi env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Apakah dijalankan dalam mode daemon setelah dihentikan, default aktif |
| `--instances`, `-i` | integer | Jumlah instance yang dijalankan setelah dihentikan |
| `--launch-mode` | string | Mode peluncuran: `pm2` atau `node` |
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
nb app restart --env local-docker
```

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
