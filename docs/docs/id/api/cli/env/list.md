---
title: "nb env list"
description: "Referensi perintah nb env list: menampilkan daftar env NocoBase CLI yang sudah dikonfigurasi dan status autentikasi API."
keywords: "nb env list,NocoBase CLI,daftar lingkungan,status autentikasi"
---

# nb env list

Menampilkan daftar semua env yang sudah dikonfigurasi, dan menggunakan kredensial Token/OAuth yang tersimpan untuk memeriksa status autentikasi API aplikasi.

## Penggunaan

```bash
nb env list
```

## Output

Tabel output berisi penanda lingkungan saat ini, nama, tipe, App Status, URL, metode autentikasi, dan versi runtime.

`App Status` menunjukkan status yang diperoleh CLI setelah mengakses API aplikasi menggunakan informasi autentikasi env saat ini, seperti `ok`, `auth failed`, `unreachable`, atau `unconfigured`. Untuk status runtime database, gunakan [`nb db ps`](../db/ps.md).

## Contoh

```bash
nb env list
```

## Perintah Terkait

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
