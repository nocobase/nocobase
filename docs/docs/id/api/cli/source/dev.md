---
title: "nb source dev"
description: "Referensi perintah nb source dev: memulai mode development NocoBase di env yang berasal dari npm atau Git."
keywords: "nb source dev,NocoBase CLI,mode development,hot reload"
---

# nb source dev

Memulai mode development di env yang berasal dari npm atau Git. Untuk env Docker, gunakan [`nb app logs`](../app/logs.md) untuk melihat log runtime.

## Penggunaan

```bash
nb source dev [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang masuk ke mode development, jika dilewati menggunakan env saat ini |
| `--db-sync` | boolean | Sinkronisasi database sebelum memulai mode development |
| `--port`, `-p` | string | Port layanan development |
| `--client`, `-c` | boolean | Hanya memulai client |
| `--server`, `-s` | boolean | Hanya memulai server |
| `--inspect`, `-i` | string | Port inspect Node.js untuk debugging server |

## Contoh

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Perintah Terkait

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
