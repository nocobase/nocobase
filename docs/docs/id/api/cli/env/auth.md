---
title: "nb env auth"
description: "Referensi perintah nb env auth: melakukan login OAuth pada env NocoBase yang tersimpan."
keywords: "nb env auth,NocoBase CLI,OAuth,login,autentikasi"
---

# nb env auth

Melakukan login OAuth pada env yang ditentukan. Saat nama lingkungan dilewati, menggunakan env saat ini.

## Penggunaan

```bash
nb env auth [name]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama lingkungan, jika dilewati menggunakan env saat ini |

## Penjelasan

Secara internal menggunakan alur PKCE: memulai layanan callback lokal, membuka browser untuk otorisasi, menukar token, dan menyimpannya ke file konfigurasi.

## Contoh

```bash
nb env auth
nb env auth prod
```

## Perintah Terkait

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
