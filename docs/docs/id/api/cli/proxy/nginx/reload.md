---
title: "nb proxy nginx reload"
description: "Referensi perintah nb proxy nginx reload: muat ulang konfigurasi Nginx dengan driver saat ini."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Memuat ulang konfigurasi Nginx dengan driver saat ini.

## Penggunaan

```bash
nb proxy nginx reload
```

## Contoh

```bash
nb proxy nginx reload
```

## Catatan

- Perintah ini biasanya digunakan setelah Anda menghasilkan ulang konfigurasi
- `reload` mengharuskan Nginx sudah berjalan; jika belum, jalankan `nb proxy nginx start` terlebih dahulu
- Driver lokal memuat ulang Nginx lokal, dan driver Docker memuat ulang Nginx di dalam container

## Perintah terkait

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
