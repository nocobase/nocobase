---
title: "nb proxy nginx"
description: "Referensi grup perintah nb proxy nginx: kelola driver provider Nginx, pembuatan konfigurasi, dan kontrol runtime."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,konfigurasi proxy"
---

# nb proxy nginx

`nb proxy nginx` adalah titik masuk grup perintah untuk provider Nginx.

Jika Anda sudah menggunakan Nginx untuk mengelola situs, sertifikat, cache, atau kontrol akses, biasanya inilah tempat untuk memulai. Grup ini menangani dua hal:

- memilih cara Nginx dijalankan, yaitu `local` atau `docker`
- menghasilkan, menjalankan, memuat ulang, dan memeriksa entrypoint Nginx untuk env yang dikelola CLI

## Penggunaan

```bash
nb proxy nginx <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Mengganti driver Nginx |
| [`nb proxy nginx current`](./current.md) | Menampilkan driver saat ini |
| [`nb proxy nginx generate`](./generate.md) | Menghasilkan atau menyegarkan konfigurasi Nginx untuk satu env |
| [`nb proxy nginx start`](./start.md) | Menjalankan proxy Nginx |
| [`nb proxy nginx restart`](./restart.md) | Menjalankan ulang proxy Nginx |
| [`nb proxy nginx reload`](./reload.md) | Memuat ulang konfigurasi Nginx |
| [`nb proxy nginx stop`](./stop.md) | Menghentikan proxy Nginx |
| [`nb proxy nginx status`](./status.md) | Menampilkan status runtime Nginx |
| [`nb proxy nginx info`](./info.md) | Menampilkan driver, path konfigurasi, dan informasi runtime |

## Catatan

- Driver saat ini disimpan di `proxy.nginx-driver`
- Driver default adalah `local`
- Driver lokal menggunakan executable yang ditunjuk oleh `bin.nginx`, dengan nilai default `nginx`
- Driver Docker menggunakan `nginx:latest`
- Nama container Docker default adalah `<docker.container-prefix>-nginx-proxy`
- Driver Docker me-mount `NB_CLI_ROOT` dari host ke dalam container pada `/apps`

## Alur umum

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Perintah terkait

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
