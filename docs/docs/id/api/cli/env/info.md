---
title: "nb env info"
description: "Referensi perintah nb env info: melihat konfigurasi aplikasi, database, API, dan autentikasi dari env NocoBase CLI yang ditentukan."
keywords: "nb env info,NocoBase CLI,detail lingkungan,konfigurasi"
---

# nb env info

Melihat informasi detail satu env, termasuk konfigurasi aplikasi, database, API, dan autentikasi.

## Penggunaan

```bash
nb env info [name] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama env CLI yang akan dilihat, jika dilewati menggunakan env saat ini |
| `--env`, `-e` | string | Nama env CLI yang akan dilihat, alternatif dari parameter posisi |
| `--json` | boolean | Output JSON |
| `--show-secrets` | boolean | Menampilkan token, password, dan kunci rahasia lainnya dalam teks biasa |

Jika `[name]` dan `--env` keduanya dimasukkan, keduanya harus konsisten.

## Contoh

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Perintah Terkait

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
