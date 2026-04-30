---
title: "nb app start"
description: "Referensi perintah nb app start: memulai aplikasi NocoBase atau container Docker dari env yang ditentukan."
keywords: "nb app start,NocoBase CLI,memulai aplikasi,Docker,pm2"
---

# nb app start

Memulai aplikasi NocoBase dari env yang ditentukan. Instalasi npm/Git akan menjalankan perintah aplikasi lokal, instalasi Docker akan memulai container aplikasi yang tersimpan.

## Penggunaan

```bash
nb app start [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dimulai, jika dilewati menggunakan env saat ini |
| `--quickstart` | boolean | Memulai aplikasi dengan cepat |
| `--port`, `-p` | string | Mengganti `appPort` di konfigurasi env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Apakah dijalankan dalam mode daemon, default aktif |
| `--instances`, `-i` | integer | Jumlah instance yang dijalankan |
| `--launch-mode` | string | Mode peluncuran: `pm2` atau `node` |
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
nb app start --env local-docker
```

## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
