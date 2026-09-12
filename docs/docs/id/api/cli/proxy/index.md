---
title: "nb proxy"
description: "Referensi grup perintah nb proxy: pilih provider Nginx atau Caddy dan kelola entrypoint reverse proxy untuk env yang dikelola CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,konfigurasi proxy"
---

# nb proxy

Di NocoBase CLI, `nb proxy` adalah titik masuk terpadu untuk pengelolaan reverse proxy.

CLI memisahkan pengelolaan env dari pengelolaan entry layer:

- `nb env` menyimpan dan memelihara env aplikasi
- `nb proxy` menghasilkan dan mengelola entrypoint Nginx atau Caddy untuk env yang dikelola CLI tersebut

Selama aplikasi kamu sudah disimpan sebagai env yang dikelola CLI dan env itu bertipe `local` atau `docker`, biasanya cukup memilih satu subcommand provider.

## Penggunaan

```bash
nb proxy <provider> <command>
```

## Pohon perintah

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Provider

| Saya ingin... | Lihat di sini |
| --- | --- |
| Tetap menggunakan Nginx untuk situs, sertifikat, cache, atau kontrol akses | [`nb proxy nginx`](./nginx/index.md) |
| Menjalankan HTTPS dengan cepat sambil mengelola lebih sedikit detail TLS sendiri | [`nb proxy caddy`](./caddy/index.md) |
| Menyesuaikan pengaturan env yang dapat memengaruhi hasil proxy, seperti `app-port` atau `app-public-path` | [`nb env update`](../env/update.md) |

## Catatan

- `nb proxy` sendiri tidak memiliki flag mandiri
- Gunakan `nb proxy nginx` atau `nb proxy caddy` untuk menghasilkan dan mengelola entrypoint
- Kedua provider hanya bekerja untuk env terkelola yang runtime-nya dapat dijangkau dari mesin saat ini, yaitu `local` atau `docker`
- Kedua provider mendukung dua driver: `local` dan `docker`
- `use` menyimpan driver default, dan `current` menampilkan driver saat ini secara langsung
- `generate` menulis atau menyegarkan file konfigurasi entry dan tidak otomatis menjalankan proses proxy
- `start`, `restart`, `reload`, `stop`, `status`, dan `info` semuanya bekerja pada runtime dari driver saat ini
- Jika kamu mengubah pengaturan seperti `app-port` atau `app-public-path` dengan `nb env update`, biasanya kamu perlu menjalankan ulang perintah `generate` yang sesuai setelahnya
- Grup perintah ini saat ini tidak bekerja untuk env yang hanya memiliki koneksi API jarak jauh maupun untuk env SSH

## Alur umum

```bash
# 1. Pilih provider dan driver runtime
nb proxy nginx use docker

# 2. Hasilkan konfigurasi entry untuk satu env yang dikelola CLI
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Jalankan proxy
nb proxy nginx start

# 4. Periksa status dan informasi path
nb proxy nginx status
nb proxy nginx info

# 5. Reload setelah perubahan konfigurasi
nb proxy nginx reload
```

Jika kamu memilih Caddy, ganti `nginx` pada perintah di atas menjadi `caddy`.

## Perbedaan umum antar perintah

| Perintah | Fungsi |
| --- | --- |
| `use` | Mengganti driver default untuk provider saat ini |
| `current` | Menampilkan driver provider saat ini, seperti `local` atau `docker` |
| `generate` | Menghasilkan atau menyegarkan file entry proxy untuk satu env |
| `start` | Menjalankan proxy dengan driver saat ini |
| `reload` | Memuat ulang konfigurasi tanpa menghentikan layanan |
| `restart` | Menghentikan lalu menjalankan kembali |
| `stop` | Menghentikan proxy |
| `status` | Menampilkan status runtime |
| `info` | Menampilkan driver, path config file, runtime root, upstream host, dan detail runtime terkait |

## Contoh

```bash
# Hasilkan dan jalankan Nginx untuk satu env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Hasilkan dan jalankan Caddy untuk satu env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Perintah terkait

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
