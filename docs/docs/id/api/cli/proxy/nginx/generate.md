---
title: "nb proxy nginx generate"
description: "Referensi perintah nb proxy nginx generate: hasilkan atau segarkan konfigurasi Nginx untuk satu env yang dikelola CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,konfigurasi proxy"
---

# nb proxy nginx generate

Menghasilkan atau menyegarkan konfigurasi entry Nginx untuk satu env yang dikelola CLI.

## Penggunaan

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env yang dikelola CLI untuk dibuatkan konfigurasi |
| `--host` | string | Host yang ditulis ke konfigurasi entry, misalnya `app1.example.com` |
| `--port` | string | Port listen yang ditulis ke konfigurasi entry, misalnya `8080` |

## File yang dihasilkan

Menggunakan env `test2` sebagai contoh, perintah ini biasanya memelihara file dan direktori berikut:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

Entry Nginx yang dihasilkan mencakup area utama berikut:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Contoh

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Catatan

- `generate` hanya menulis atau menyegarkan konfigurasi dan tidak otomatis menjalankan Nginx
- `app.conf` adalah file entry yang bisa diedit, tetapi blok terkelolanya harus tetap utuh
- Jika Anda mengubah pengaturan seperti `app-port` atau `app-public-path` lewat `nb env update`, biasanya Anda perlu menjalankan ulang perintah ini
- Hanya env bertipe `local` atau `docker` yang dikelola CLI yang dapat memakai perintah ini

## Perintah terkait

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
