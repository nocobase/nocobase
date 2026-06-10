---
title: "Reverse proxy di produksi"
description: "Gunakan nb proxy nginx dan nb proxy caddy untuk menghasilkan dan mengelola konfigurasi reverse proxy bagi env NocoBase yang dikelola CLI."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,produksi"
---

# Reverse proxy di produksi

Di NocoBase CLI, titik masuk yang direkomendasikan untuk reverse proxy produksi adalah:

- `nb proxy nginx`
- `nb proxy caddy`

Di sini:

- `proxy` mengelola lapisan entry
- `nginx` dan `caddy` adalah implementasi provider
- `docker` dan `local` adalah driver runtime
- `--env <name>` memilih env CLI yang ingin dibuatkan konfigurasinya

Selama aplikasi Anda sudah disimpan sebagai env yang dikelola CLI dan env tersebut bertipe `local` atau `docker`, membiarkan CLI menghasilkan dan mengelola konfigurasi reverse proxy biasanya sudah cukup. Dengan pendekatan ini, penanganan WebSocket, subpath, halaman fallback SPA, dan pembaruan berikutnya tetap selaras di satu tempat.

Jika aplikasinya bukan env yang dikelola CLI, atau Anda memang ingin memelihara seluruh konfigurasi proxy secara manual, lanjutkan ke bagian konfigurasi manual di halaman provider terkait.

## Sebelum memulai

Pastikan bahwa:

- aplikasi sudah bisa diakses secara internal, misalnya `http://127.0.0.1:13000`
- aplikasi sudah disimpan sebagai env CLI, dan env tersebut bertipe `local` atau `docker`
- env tersebut sudah memiliki `appPort`

Jika perintah mengatakan env belum memiliki `appPort`, perbarui terlebih dahulu dengan [`nb env update`](../../../api/cli/env/update.md).

Jika nanti Anda mengubah pengaturan seperti `app-port` atau `app-public-path` yang memengaruhi perilaku proxy, jalankan ulang perintah `generate` yang sesuai.

## Alur default

Untuk Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Untuk Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Peran tiap langkah adalah:

- `use docker|local`: memilih driver runtime untuk provider saat ini
- `generate --env <name> --host <domain>`: menghasilkan konfigurasi reverse proxy untuk satu env
- `start`: menjalankan proses lokal atau container Docker untuk provider saat ini

Jika Anda memperbarui konfigurasi setelah itu, `reload` biasanya menjadi pilihan pertama. Gunakan `restart` bila Anda membutuhkan restart penuh pada lapisan entry.

## Pembagian grup perintah

Menggunakan Nginx sebagai contoh:

| Perintah | Tujuan |
| --- | --- |
| `nb proxy nginx use docker` | Mengganti runtime Nginx ke Docker |
| `nb proxy nginx use local` | Mengganti runtime Nginx ke proses lokal |
| `nb proxy nginx current` | Menampilkan driver runtime saat ini |
| `nb proxy nginx generate --env <name> --host <domain>` | Menghasilkan konfigurasi Nginx untuk satu env |
| `nb proxy nginx start` | Menjalankan Nginx |
| `nb proxy nginx reload` | Memuat ulang konfigurasi Nginx |
| `nb proxy nginx restart` | Menjalankan ulang Nginx |
| `nb proxy nginx stop` | Menghentikan Nginx |
| `nb proxy nginx status` | Menampilkan status Nginx |
| `nb proxy nginx info` | Menampilkan konfigurasi saat ini, path, dan detail runtime |

Caddy menggunakan kumpulan aksi yang sama, hanya providernya berbeda.

## Apa yang dipelihara CLI

CLI tidak hanya menghasilkan satu fragmen proxy. CLI juga menjaga file pendukung dan struktur entry situs agar tetap selaras dengan provider:

- Nginx memelihara `snippets` bersama, `app.conf`, `public/index-v1.html`, dan `public/index-v2.html`
- Caddy memelihara `nocobase.caddy`, `app.caddy`, `public/index-v1.html`, dan `public/index-v2.html`, di mana `app.caddy` adalah konfigurasi situs lengkap untuk satu env

:::warning Catatan

Jika Anda perlu menambahkan konfigurasi di tingkat situs, biasanya Anda mengedit `app.conf` untuk Nginx dan memakai `app.caddy` sebagai dasar untuk Caddy. Jangan mengedit langsung file pendukung yang dikelola CLI. Perlu juga diingat bahwa `app.caddy` akan ditimpa sepenuhnya saat Anda menjalankan `generate` lagi, sedangkan `nocobase.caddy` terutama berfungsi sebagai file entry tingkat provider.

:::

## Halaman mana yang sebaiknya dibuka lebih dulu

| Saya ingin... | Buka halaman ini |
| --- | --- |
| Tetap memakai Nginx untuk situs, sertifikat, cache, atau kontrol akses | [Nginx](./nginx.md) |
| Menjalankan HTTPS dengan cepat dengan detail TLS yang lebih sedikit | [Caddy](./caddy.md) |
| Menyesuaikan pengaturan env yang dapat memengaruhi proxy, seperti `app-port` atau `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Memasang aplikasi sebagai env yang dikelola CLI terlebih dahulu | [Instal dengan CLI](../../installation/cli.md) |

## Kapan jalur CLI bukan pilihan yang tepat

Dalam kasus berikut, bagian konfigurasi manual di halaman provider biasanya lebih cocok:

- aplikasi tidak dikelola CLI
- env hanya berupa koneksi API jarak jauh atau env SSH
- Anda memang ingin memelihara seluruh konfigurasi Nginx atau `Caddyfile` sendiri

Selama aplikasi sudah disimpan sebagai env CLI dan runtime-nya bisa dijangkau dari mesin saat ini, grup perintah ini tetap menjadi pilihan default yang direkomendasikan. Biasanya jauh lebih mudah dipelihara nanti saat Anda perlu mengganti domain, menambah konfigurasi tingkat situs, mengganti driver, atau menghasilkan ulang file entry.

## Tautan terkait

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Variabel lingkungan](../../installation/env.md)
- [Instal dengan CLI](../../installation/cli.md)
