---
title: "nb config"
description: "Referensi nb config: kelola nilai konfigurasi default untuk NocoBase CLI."
keywords: "nb config,NocoBase CLI,konfigurasi,konfigurasi default"
---

# nb config

Mengelola nilai konfigurasi default CLI. Kunci yang saat ini didukung secara umum terbagi ke dalam kelompok berikut:

- CLI itu sendiri: `locale`, `update.policy`, `license.pkg-url`
- Runtime Docker: `docker.network`, `docker.container-prefix`
- Executable eksternal: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.pnpm`, `bin.yarn`
- Pembuatan proxy: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

Sebagian besar proyek hanya membutuhkan beberapa kunci saja. Dalam praktiknya, yang paling umum adalah:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` atau `bin.caddy`
- `proxy.nginx-driver` atau `proxy.caddy-driver`

## Kunci konfigurasi umum

| Kunci | Default | Deskripsi |
| --- | --- | --- |
| `locale` | diselesaikan menurut aturan CLI saat ini | Menimpa bahasa yang digunakan oleh CLI |
| `update.policy` | `prompt` | Kebijakan pembaruan saat startup: `prompt`, `auto`, atau `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Menimpa URL unduhan untuk paket ekstensi komersial |
| `docker.network` | `nocobase` | Jaringan default untuk aplikasi Docker yang dikelola CLI |
| `docker.container-prefix` | `nb` | Prefix default untuk container Docker yang dikelola CLI |
| `bin.docker` | `docker` | Menimpa path executable Docker |
| `bin.caddy` | `caddy` | Menimpa path executable Caddy |
| `bin.git` | `git` | Menimpa path executable Git |
| `bin.nginx` | `nginx` | Menimpa path executable Nginx |
| `bin.pnpm` | `pnpm` | Menimpa path executable pnpm |
| `bin.yarn` | `yarn` | Menimpa path executable Yarn |
| `proxy.nb-cli-root` | root CLI, biasanya direktori home pengguna saat ini | Menimpa root path yang terlihat oleh konfigurasi proxy yang dihasilkan ketika proses proxy dan CLI tidak melihat root filesystem yang sama |
| `proxy.upstream-host` | `127.0.0.1` | Menimpa host yang digunakan proxy untuk meneruskan trafik kembali ke aplikasi NocoBase |
| `proxy.nginx-driver` | `local` | Driver runtime default yang digunakan oleh `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Driver runtime default yang digunakan oleh `nb proxy caddy` |

## Penggunaan

```bash
nb config <command>
```

## Subcommand

| Command | Deskripsi |
| --- | --- |
| [`nb config get`](./get.md) | Membaca nilai efektif dari sebuah kunci konfigurasi |
| [`nb config set`](./set.md) | Menetapkan sebuah kunci konfigurasi |
| [`nb config delete`](./delete.md) | Menghapus kunci konfigurasi yang ditetapkan secara eksplisit |
| [`nb config list`](./list.md) | Menampilkan kunci konfigurasi yang saat ini ditetapkan secara eksplisit |

## Contoh

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config set bin.pnpm /usr/local/bin/pnpm
nb config delete docker.container-prefix
```

## Catatan

- `bin.nginx` dan `bin.caddy` hanya memengaruhi driver `local` untuk `nb proxy nginx` dan `nb proxy caddy`
- `bin.pnpm` digunakan saat perintah perlu menjalankan pnpm secara langsung, misalnya saat memperbarui instalasi CLI global yang dikelola pnpm dengan `nb self update`
- `proxy.nginx-driver` dan `proxy.caddy-driver` menyimpan driver default yang digunakan oleh masing-masing provider
- `proxy.nb-cli-root` dan `proxy.upstream-host` adalah override proxy tingkat lanjut. Untuk sebagian besar env `local` atau `docker` yang dikelola CLI, nilai default sudah cukup
- Jika kamu hanya ingin mengganti driver proxy aktif, menggunakan `nb proxy nginx use` atau `nb proxy caddy use` biasanya lebih jelas daripada mengatur kunci konfigurasi secara manual

## Perintah terkait

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
