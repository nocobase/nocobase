---
title: 'nb env info'
description: 'Referensi perintah nb env info: lihat konfigurasi aplikasi, database, API, dan autentikasi dari env NocoBase CLI yang ditentukan.'
keywords: 'nb env info,NocoBase CLI,detail lingkungan,konfigurasi'
---

# nb env info

Lihat informasi detail untuk satu env, termasuk konfigurasi aplikasi, database, API, dan autentikasi.

## Penggunaan

```bash
nb env info [name] [flags]
```

## Parameter

| Parameter        | Tipe    | Deskripsi                                                                                                     |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Nama lingkungan yang sudah dikonfigurasi untuk dilihat; jika dihilangkan, env saat ini akan digunakan         |
| `--json`         | boolean | Keluarkan JSON                                                                                                |
| `--field`        | string  | Hanya mengembalikan satu field dengan jalur bertitik, misalnya `app.url`, `app.appPath`, atau `api.auth.type` |
| `--show-secrets` | boolean | Tampilkan token, kata sandi, dan rahasia lainnya dalam teks biasa                                             |

## Contoh

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Perintah terkait

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
