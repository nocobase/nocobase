---
title: 'nb env proxy'
description: 'Referensi perintah nb env proxy: menghasilkan konfigurasi proxy Nginx atau Caddy untuk satu env yang dikelola CLI.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,konfigurasi proxy'
---

# nb env proxy

Di NocoBase CLI, `nb env proxy` digunakan untuk menghasilkan konfigurasi reverse proxy bagi satu env yang dikelola CLI. Secara default, `nginx` sudah cukup. Ganti ke `caddy` hanya jika Anda memang sudah menggunakan Caddy atau benar-benar membutuhkan Caddyfile.

Perintah ini hanya berlaku untuk env yang dikelola dan runtime-nya bisa dijangkau dari mesin saat ini, yaitu `local` atau `docker`. Untuk saat ini, perintah ini belum mendukung env yang hanya memiliki koneksi API jarak jauh atau env SSH.

## Penggunaan

```bash
nb env proxy [name] [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `[name]` | string | Nama env yang sudah dikonfigurasi dan akan dibuatkan konfigurasi proxy. Jika diabaikan, env saat ini akan digunakan |
| `--output`, `-o` | string | Path file output. Nilai default adalah `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Provider proxy: `nginx` atau `caddy` |
| `--host` | string | Host yang ditulis ke konfigurasi entry, misalnya `example.com` atau `localhost` |
| `--port` | string | Port yang ditulis ke konfigurasi entry. Ini adalah port entry proxy, bukan port aplikasi NocoBase upstream |
| `--install` | boolean | Memasang konfigurasi proxy bersama ke konfigurasi utama provider |
| `--reload` | boolean | Memvalidasi dan me-reload provider setelah konfigurasi ditulis |
| `--print` | boolean | Menampilkan konfigurasi yang dihasilkan ke stdout alih-alih menulis file |

## File output default

Jika Anda tidak memberikan `--output`, CLI akan mengelola tiga jenis file di bawah `~/.nocobase/proxy/<provider>/`:

| Provider | File generated | File entry yang bisa diedit | Konfigurasi utama bersama |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Artinya:

- `generated.*` dikelola oleh CLI dan akan ditimpa saat Anda menjalankan `nb env proxy` lagi
- `app.conf` / `app.caddy` adalah file entry yang bisa diedit, tetapi referensi ke konfigurasi generated yang dikelola CLI harus tetap dipertahankan
- `nocobase.conf` / `nocobase.caddy` adalah konfigurasi utama bersama yang meng-include file entry dari semua env

Jika Anda memberikan `--output`, CLI hanya akan menulis konfigurasi generated ke file tersebut dan tidak akan membuat atau memperbarui file entry maupun konfigurasi utama bersama.

## Item konfigurasi terkait

| Item konfigurasi | Nilai default | Deskripsi |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Provider default yang digunakan oleh `nb env proxy` |
| `proxy.nb-cli-root` | Root CLI, biasanya direktori home pengguna saat ini | Memetakan path `.nocobase` ke path root yang benar-benar terlihat oleh proses proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host yang digunakan proxy saat meneruskan trafik kembali ke aplikasi NocoBase |
| `bin.caddy` | `caddy` | Path executable Caddy yang digunakan oleh `--install` atau `--reload` |
| `bin.nginx` | `nginx` | Path executable Nginx yang digunakan oleh `--install` atau `--reload` |

Sebagian besar setup tidak perlu mengubah `proxy.nb-cli-root`. Biasanya item ini hanya diperlukan ketika Nginx atau Caddy berjalan di kontainer lain, root mount lain, atau tampilan path yang berbeda.

## Keterangan

- `--port` harus berupa bilangan bulat antara `1` dan `65535`
- Port aplikasi NocoBase upstream berasal dari `appPort` yang tersimpan di env, bukan dari `--port`
- Jika perintah mengatakan env tidak memiliki `appPort`, jalankan `nb env update <name>` terlebih dahulu, atau simpan secara eksplisit dengan `nb env update <name> --app-port <port>`
- `--print` tidak bisa digabung dengan `--install` atau `--reload`
- `--output` tidak bisa digabung dengan `--install` atau `--reload`
- `--install` menghubungkan konfigurasi bersama ke konfigurasi utama provider. `--reload` memvalidasi dan me-reload provider. Dalam praktiknya, dua flag ini biasanya dipakai bersamaan

## Contoh

```bash
# Menghasilkan konfigurasi nginx default untuk env saat ini
nb env proxy

# Menghasilkan konfigurasi untuk env tertentu
nb env proxy demo

# Menampilkan konfigurasi generated tanpa menulis file
nb env proxy demo --print

# Menulis host dan port ke konfigurasi entry
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Menghasilkan konfigurasi Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Mengubah provider default dan host upstream
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Memetakan path .nocobase saat provider berjalan di root path lain
nb config set proxy.nb-cli-root /workspace

# Memasang konfigurasi bersama ke konfigurasi utama provider lalu me-reload provider
nb env proxy demo --install --reload
```

## Perintah terkait

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
