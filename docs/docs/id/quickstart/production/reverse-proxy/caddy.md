---
title: "Caddy"
description: "Gunakan nb proxy caddy untuk menghasilkan dan mengelola konfigurasi reverse proxy Caddy bagi env NocoBase yang dikelola CLI."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,produksi"
---

# Caddy

Jika Anda sudah memiliki domain dan ingin cepat menjalankan HTTPS, `nb proxy caddy` biasanya menjadi jalur masuk yang paling sederhana.

Dibandingkan dengan mengelola sendiri konfigurasi sertifikat di Nginx, Caddy lebih seperti jalan pintas default untuk membuat lapisan entry segera online.

## Kapan Caddy lebih cocok

Dalam praktiknya, Caddy biasanya lebih cocok ketika:

- Anda sudah memiliki domain dan ingin segera menjalankan HTTPS
- Anda tidak ingin mengelola terlalu banyak detail sertifikat dan TLS sendiri
- Anda terutama membutuhkan lapisan entry yang sederhana dan stabil

Jika Anda sudah menggunakan Nginx untuk mengelola banyak situs pada server yang sama, atau masih membutuhkan cache yang lebih berat, kontrol akses, atau aturan khusus, [Nginx](./nginx.md) biasanya lebih cocok.

## Urutan yang direkomendasikan: pilih driver, hasilkan konfigurasi, lalu jalankan

Untuk env yang dikelola CLI bertipe `local` atau `docker`, urutan default-nya adalah:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Atau dengan proses lokal:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Perintah lanjutan yang umum dipakai adalah:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

Dalam kebanyakan kasus:

- `current` adalah cara tercepat untuk memastikan driver runtime yang aktif
- `status` menunjukkan apakah Caddy sedang berjalan normal
- `info` menampilkan path konfigurasi saat ini, runtime root, dan detail runtime terkait
- setelah Anda menghasilkan ulang konfigurasi, `reload` biasanya menjadi perintah pertama yang dipakai
- gunakan `restart` jika Anda membutuhkan restart penuh

## Input yang dibutuhkan `generate`

Bentuk yang paling umum adalah:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Jika Anda juga ingin menentukan port entry:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Di mana:

- `--env`: env CLI yang akan dibuatkan konfigurasi
- `--host`: nama domain publik
- `--port`: port entry proxy

Untuk Caddy, `--host` sangat penting karena alamat situs sangat memengaruhi alur HTTPS. Di lingkungan produksi, biasanya paling baik memberikan domain yang sudah mengarah ke server saat ini.

Jika perintah mengatakan env belum memiliki `appPort`, simpan dulu dengan:

```bash
nb env update test2 --app-port 56575
```

Jika nanti Anda mengubah pengaturan seperti `app-port` atau `app-public-path` yang memengaruhi perilaku proxy, jalankan ulang `generate`.

## File yang dipelihara CLI

Menggunakan `test2` sebagai contoh, alur Caddy biasanya memelihara:

| Path | Fungsi |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Konfigurasi situs lengkap yang dihasilkan CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | File entry Caddy tingkat provider yang mengimpor semua `app.caddy` milik env |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Halaman fallback SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Halaman fallback SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Hasil build frontend untuk aplikasi saat ini |
| `NB_CLI_ROOT/test2/storage/uploads` | Direktori upload untuk aplikasi saat ini |

Di sini:

- file di bawah `NB_CLI_ROOT/.nocobase/proxy/caddy/...` adalah file bantuan proxy yang dikelola CLI
- file di bawah `NB_CLI_ROOT/test2/storage/...` adalah milik aplikasi itu sendiri
- `nocobase.caddy` adalah file entry tingkat provider dan biasanya tidak perlu diedit manual
- `app.caddy` adalah konfigurasi situs lengkap untuk satu env, dan akan ditimpa sepenuhnya saat Anda menghasilkan ulang

:::warning Catatan

Jika Anda membutuhkan konfigurasi Caddy di tingkat situs, seperti header tambahan, autentikasi, pembatasan laju, atau kebijakan kompresi, Anda bisa memakai `app.caddy` sebagai dasar. Namun perlu diingat bahwa menjalankan `generate` lagi akan menimpa file ini.

:::

## Konfigurasi manual: ketika Anda tidak memakai CLI

Jika aplikasinya bukan env yang dikelola CLI, atau Anda memang ingin memelihara seluruh konfigurasi Caddy sendiri, Anda tetap bisa menulisnya secara manual.

Namun untuk NocoBase, entry produksi biasanya lebih dari sekadar `reverse_proxy`. Selain meneruskan permintaan API ke aplikasi backend, konfigurasi Caddy yang lengkap biasanya juga perlu menangani uploads, aset frontend, rute `.well-known`, WebSocket, dan halaman fallback SPA sekaligus.

Menggunakan `test2` sebagai contoh, path penting yang terkait Caddy biasanya meliputi:

- Direktori fallback SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Hasil build frontend: `NB_CLI_ROOT/test2/storage/dist-client`
- Direktori upload: `NB_CLI_ROOT/test2/storage/uploads`

Artinya, konfigurasi manual biasanya minimal harus mencakup area entry berikut:

- `v`: mengalihkan `/v` ke `/v/`
- `uploads`: mengekspos direktori upload
- `dist`: mengekspos hasil build frontend
- `oauth well-known`: menangani path discovery OAuth
- `openid well-known`: menangani path discovery OpenID
- `api`: meneruskan permintaan `/api/` ke aplikasi backend
- `ws`: meneruskan permintaan WebSocket ke aplikasi backend
- `spa v2`: menyajikan `/v/` dengan entry v2 dan halaman fallback
- `spa v1`: menyajikan `/` dengan entry v1 dan halaman fallback

Jadi, konfigurasi Caddy yang lengkap biasanya lebih dari contoh umum seperti ini:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Untuk aplikasi yang dikelola CLI seperti `test2`, struktur deployment yang lebih realistis biasanya lebih mendekati contoh berikut:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Ada dua detail penting di sini:

- file di bawah `NB_CLI_ROOT/.nocobase/proxy/caddy/...` adalah file fallback SPA yang dikelola CLI
- file di bawah `NB_CLI_ROOT/test2/storage/...` adalah hasil build dan uploads milik aplikasi itu sendiri

Jika aplikasi memakai deployment subpath, atau jika aset frontend, uploads, dan lapisan entry tidak berbagi sudut pandang path yang sama, konfigurasi manual akan lebih mudah salah. Dalam kasus seperti itu, biasanya lebih aman menghasilkan konfigurasi lebih dulu dengan:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Lalu gunakan hasil yang dihasilkan sebagai dasar untuk penyesuaian manual.
