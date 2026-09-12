---
title: "nb proxy caddy generate"
description: "Referensi perintah nb proxy caddy generate: hasilkan atau segarkan konfigurasi Caddy untuk satu env yang dikelola CLI."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,konfigurasi proxy"
---

# nb proxy caddy generate

Menghasilkan atau menyegarkan konfigurasi entry Caddy untuk satu env yang dikelola CLI.

## Penggunaan

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env yang dikelola CLI untuk dibuatkan konfigurasi |
| `--host` | string | Host yang ditulis ke alamat situs, misalnya `app1.example.com` |
| `--port` | string | Port listen yang ditulis ke alamat situs, misalnya `8080` |

## File yang dihasilkan

Menggunakan env `test2` sebagai contoh, perintah ini biasanya memelihara file dan direktori berikut:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

Dalam rancangan saat ini, `app.caddy` sudah menjadi konfigurasi situs lengkap untuk satu env dan tidak lagi dipisah ke file `generated.caddy`.

## Contoh

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Catatan

- `generate` hanya menulis atau menyegarkan konfigurasi dan tidak otomatis menjalankan Caddy
- Menghasilkan ulang konfigurasi akan menimpa `app.caddy` secara keseluruhan
- Jika Anda mengubah pengaturan seperti `app-port` atau `app-public-path` lewat `nb env update`, biasanya Anda perlu menjalankan ulang perintah ini
- Hanya env bertipe `local` atau `docker` yang dikelola CLI yang dapat memakai perintah ini

## Perintah terkait

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
