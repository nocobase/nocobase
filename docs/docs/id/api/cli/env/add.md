---
title: "nb env add"
description: "Referensi perintah nb env add: menyimpan alamat API NocoBase dan metode autentikasi, lalu mengubahnya menjadi env saat ini."
keywords: "nb env add,NocoBase CLI,menambah lingkungan,alamat API,autentikasi"
---

# nb env add

Menyimpan endpoint API NocoBase dengan nama tertentu, dan mengubah CLI untuk menggunakan env tersebut. Saat memilih metode autentikasi `oauth`, akan otomatis masuk ke alur login [`nb env auth`](./auth.md).

## Penggunaan

```bash
nb env add [name] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama lingkungan; jika dilewati di TTY akan ada prompt untuk mengisi, di non-TTY wajib diisi |
| `--verbose` | boolean | Menampilkan progress detail saat menulis konfigurasi |
| `--locale` | string | Bahasa prompt CLI: `en-US` atau `zh-CN` |
| `--api-base-url`, `-u` | string | Alamat API NocoBase, termasuk prefix `/api` |
| `--auth-type`, `-a` | string | Metode autentikasi: `token` atau `oauth` |
| `--access-token`, `-t` | string | API key atau access token yang digunakan untuk metode autentikasi `token` |

## Contoh

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Perintah Terkait

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
