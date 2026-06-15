---
title: "nb proxy caddy"
description: "Referensi grup perintah nb proxy caddy: kelola driver provider Caddy, pembuatan konfigurasi, dan kontrol runtime."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,konfigurasi proxy"
---

# nb proxy caddy

`nb proxy caddy` adalah titik masuk grup perintah untuk provider Caddy.

Jika Anda sudah memiliki domain, ingin cepat mengaktifkan HTTPS, dan tidak ingin mengelola terlalu banyak detail TLS sendiri, biasanya inilah tempat untuk memulai. Grup ini menangani dua hal:

- memilih cara Caddy dijalankan, yaitu `local` atau `docker`
- menghasilkan, menjalankan, memuat ulang, dan memeriksa entrypoint Caddy untuk env yang dikelola CLI

## Penggunaan

```bash
nb proxy caddy <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Mengganti driver Caddy |
| [`nb proxy caddy current`](./current.md) | Menampilkan driver saat ini |
| [`nb proxy caddy generate`](./generate.md) | Menghasilkan atau menyegarkan konfigurasi Caddy untuk satu env |
| [`nb proxy caddy start`](./start.md) | Menjalankan proxy Caddy |
| [`nb proxy caddy restart`](./restart.md) | Menjalankan ulang proxy Caddy |
| [`nb proxy caddy reload`](./reload.md) | Memuat ulang konfigurasi Caddy |
| [`nb proxy caddy stop`](./stop.md) | Menghentikan proxy Caddy |
| [`nb proxy caddy status`](./status.md) | Menampilkan status runtime Caddy |
| [`nb proxy caddy info`](./info.md) | Menampilkan driver, path konfigurasi, dan informasi runtime |

## Catatan

- Driver saat ini disimpan di `proxy.caddy-driver`
- Driver default adalah `local`
- Driver lokal menggunakan executable yang ditunjuk oleh `bin.caddy`, dengan nilai default `caddy`
- Driver Docker menggunakan `caddy:latest`
- Nama container Docker default adalah `<docker.container-prefix>-caddy-proxy`
- Driver Docker me-mount `NB_CLI_ROOT` dari host ke dalam container pada `/apps`

## Alur umum

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Perintah terkait

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
