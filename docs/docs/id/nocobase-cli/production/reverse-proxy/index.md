---
title: "Proksi terbalik lingkungan produksi"
description: "Hasilkan dan kelola konfigurasi proksi terbalik untuk env NocoBase yang dihosting CLI berdasarkan nb proxy nginx dan nb proxy caddy."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy, reverse proxy, Nginx, Caddy, lingkungan produksi"
---


# Membalikkan proksi

Artikel ini hanya berlaku untuk aplikasi yang diinstal menggunakan `nb init`.

Di NocoBase, proksi terbalik lingkungan produksi melakukan lebih dari sekadar meneruskan permintaan ke proses aplikasi. Seringkali detail WebSockets, subjalur, sumber daya statis front-end, direktori unggahan, dan halaman cadangan SPA juga ditangani secara bersamaan.

Fungsi `nb proxy` adalah untuk mengumpulkan detail yang mudah terlewatkan ini ke dalam kumpulan entri perintah yang stabil.

## Proses inti

Jika hanya melihat proses inti saja, cukup mengingat tiga perintah ini:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Jika Anda menggunakan Caddy, ganti saja `nginx` pada perintah dengan `caddy`.

`use local` dan `use docker` dapat dinilai secara langsung seperti ini:

- Jika Nginx atau Caddy telah diinstal secara lokal, gunakan `use local`
- Tidak ada instalasi lokal. Jika Anda ingin CLI menggunakan Docker untuk mengelola agen, gunakan `use docker`

Di sebagian besar skenario, cukup mengeksekusi `use` terlebih dahulu, lalu `generate`, dan terakhir `reload`. Untuk detail Nginx atau Caddy, lanjutkan ke halamannya masing-masing.

## Kapan memilih Nginx dan kapan memilih Caddy

Biasanya dapat dinilai seperti ini:

| Skenario | Rekomendasi |
| --- | --- |
| Anda sudah menggunakan Nginx untuk mengelola situs, sertifikat, cache, atau kontrol akses | [Nginx](./nginx.md) |
| Anda sudah memiliki nama domain dan ingin menjalankan HTTPS sesegera mungkin dan menyimpan beberapa detail TLS untuk dipelihara | [Caddy](./caddy.md) |

## Lanjutkan membaca di bawah

| saya ingin... | Di mana mencarinya |
| --- | --- |
| Ikuti pintu masuk situs manajemen Nginx | [Nginx](./nginx.md) |
| Hubungkan HTTPS sesegera mungkin | [Caddy](./caddy.md) |
| Sesuaikan terlebih dahulu konfigurasi env yang akan mempengaruhi hasil proxy, seperti `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Konfirmasikan terlebih dahulu instalasi dan konfigurasi env aplikasi | [Instal menggunakan CLI (disarankan)](../../installation/cli.md) |
