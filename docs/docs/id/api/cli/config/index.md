---
title: 'nb config'
description: 'Referensi perintah nb config: kelola item konfigurasi default NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,konfigurasi,konfigurasi default'
---

# nb config

Kelola konfigurasi default CLI. Item konfigurasi yang saat ini didukung meliputi:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Item konfigurasi umum

| Item konfigurasi | Nilai default | Deskripsi |
| --- | --- | --- |
| `locale` | Diselesaikan menurut aturan CLI saat ini | Mengganti bahasa yang digunakan oleh CLI |
| `update.policy` | `prompt` | Kebijakan pembaruan saat startup: `prompt`, `auto`, atau `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Mengganti URL unduhan paket ekstensi komersial |
| `docker.network` | `nocobase` | Jaringan default untuk aplikasi Docker yang dikelola oleh CLI |
| `docker.container-prefix` | `nb` | Prefiks default untuk kontainer Docker yang dikelola oleh CLI |
| `bin.docker` | `docker` | Mengganti path executable Docker |
| `bin.caddy` | `caddy` | Mengganti path executable Caddy |
| `bin.git` | `git` | Mengganti path executable Git |
| `bin.nginx` | `nginx` | Mengganti path executable Nginx |
| `bin.yarn` | `yarn` | Mengganti path executable Yarn |
| `proxy.provider` | `nginx` | Provider proxy default yang digunakan oleh `nb env proxy` |
| `proxy.nb-cli-root` | Root CLI, biasanya direktori home pengguna saat ini | Memetakan path `.nocobase` ke root path yang terlihat oleh proses proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host yang digunakan proxy saat meneruskan trafik kembali ke aplikasi NocoBase |

## Penggunaan

```bash
nb config <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb config get`](./get.md)       | Membaca nilai efektif dari item konfigurasi                         |
| [`nb config set`](./set.md)       | Menetapkan item konfigurasi                                         |
| [`nb config delete`](./delete.md) | Menghapus item konfigurasi yang diatur secara eksplisit             |
| [`nb config list`](./list.md)     | Menampilkan daftar item konfigurasi yang saat ini diatur eksplisit  |

## Contoh

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Perintah terkait

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
