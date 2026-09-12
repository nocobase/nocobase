---
title: "nb env list"
description: "Referensi perintah nb env list: menampilkan env NocoBase CLI yang dikonfigurasi."
keywords: "nb env list,NocoBase CLI,daftar environment,API Base URL"
---

# nb env list

Menampilkan semua env yang sudah dikonfigurasi.

Perintah ini hanya menampilkan konfigurasi yang tersimpan. Gunakan [`nb env status`](./status.md) saat ingin memeriksa status.

## Penggunaan


nb env list

## Output

Tabel output menampilkan penanda env saat ini, nama, jenis, `API Base URL`, tipe autentikasi, dan versi runtime.

- `Current` menandai env yang sedang efektif dengan `*`
- `API Base URL` menampilkan alamat API mentah yang tersimpan
- `Runtime` menampilkan informasi versi runtime yang tersimpan di cache

## Contoh


nb env list

## Perintah Terkait

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
