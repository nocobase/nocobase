---
title: "nb proxy caddy reload"
description: "Referensi perintah nb proxy caddy reload: muat ulang konfigurasi Caddy dengan driver saat ini."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Memuat ulang konfigurasi Caddy dengan driver saat ini.

## Penggunaan

```bash
nb proxy caddy reload
```

## Contoh

```bash
nb proxy caddy reload
```

## Catatan

- Perintah ini biasanya digunakan setelah Anda menghasilkan ulang konfigurasi
- `reload` mengharuskan Caddy sudah berjalan; jika belum, jalankan `nb proxy caddy start` terlebih dahulu
- Driver lokal memuat ulang Caddy lokal, dan driver Docker memuat ulang Caddy di dalam container

## Perintah terkait

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
