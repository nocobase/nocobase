---
title: "nb app logs"
description: "Referensi perintah nb app logs: melihat log aplikasi NocoBase dari env yang ditentukan."
keywords: "nb app logs,NocoBase CLI,log aplikasi,Docker logs,pm2 logs"
---

# nb app logs

Melihat log aplikasi. Instalasi npm/Git akan membaca log pm2, instalasi Docker akan membaca log container Docker.

## Penggunaan

```bash
nb app logs [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dilihat lognya, jika dilewati menggunakan env saat ini |
| `--tail` | integer | Jumlah baris log terbaru yang ditampilkan sebelum mengikuti log, default `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Apakah terus mengikuti log baru |

## Contoh

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
