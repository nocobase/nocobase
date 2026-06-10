---
title: "Nginx"
description: "Gunakan nb proxy nginx untuk menghasilkan dan mengelola konfigurasi reverse proxy Nginx bagi env NocoBase yang dikelola CLI."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,produksi"
---

# Nginx

Jika Anda sudah menggunakan Nginx di server untuk mengelola situs, atau masih ingin mengelola sendiri sertifikat, cache, dan kontrol akses, `nb proxy nginx` adalah jalur yang direkomendasikan.

Jika tujuan Anda hanya ingin secepat mungkin menjalankan HTTPS tanpa harus memelihara terlalu banyak detail proxy, [Caddy](./caddy.md) biasanya lebih sederhana. Namun jika Nginx memang sudah menjadi bagian dari pengaturan server Anda, halaman ini adalah jalur default.

## Kapan Nginx lebih cocok

Dalam praktiknya, Nginx biasanya lebih cocok ketika:

- Anda sudah menggunakan Nginx untuk mengelola beberapa situs pada server yang sama
- Anda masih perlu mengelola sendiri sertifikat, cache, kontrol akses, atau aturan tambahan
- Anda ingin lapisan entry tetap selaras dengan alur operasi Nginx yang sudah ada

Jika satu-satunya tujuan Anda adalah menjalankan HTTPS dengan cepat dan mengurangi pekerjaan TLS, [Caddy](./caddy.md) biasanya menjadi jalur yang lebih mudah.

## Urutan yang direkomendasikan: pilih driver, hasilkan konfigurasi, lalu jalankan

Untuk env yang dikelola CLI bertipe `local` atau `docker`, urutan default-nya adalah:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Atau dengan proses lokal:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Perintah lanjutan yang umum dipakai adalah:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

Dalam kebanyakan kasus:

- `current` adalah cara tercepat untuk memastikan driver runtime yang aktif
- `status` menunjukkan apakah Nginx sedang berjalan normal
- `info` menampilkan path konfigurasi saat ini, runtime root, dan detail runtime terkait
- setelah Anda menghasilkan ulang konfigurasi, `reload` biasanya menjadi perintah pertama yang dipakai
- gunakan `restart` jika Anda membutuhkan restart penuh

## Input yang dibutuhkan `generate`

Bentuk yang paling umum adalah:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Jika Anda juga ingin menentukan port entry:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Di mana:

- `--env`: env CLI yang akan dibuatkan konfigurasi
- `--host`: nama domain publik
- `--port`: port entry proxy, bukan `appPort` milik aplikasi

Port aplikasi upstream diambil dari `appPort` yang tersimpan di env tersebut. Jika perintah mengatakan env belum memiliki `appPort`, simpan dulu dengan:

```bash
nb env update test2 --app-port 56575
```

Jika nanti Anda mengubah pengaturan seperti `app-port` atau `app-public-path` yang memengaruhi perilaku proxy, jalankan ulang `generate`.

## File yang dipelihara CLI

Menggunakan `test2` sebagai contoh, alur Nginx biasanya memelihara:

| Path | Fungsi |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Direktori snippets Nginx bersama |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Konfigurasi entry situs yang dapat diedit |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Halaman fallback SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Halaman fallback SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Hasil build frontend untuk aplikasi saat ini |
| `NB_CLI_ROOT/test2/storage/uploads` | Direktori upload untuk aplikasi saat ini |

Di sini:

- file di bawah `NB_CLI_ROOT/.nocobase/proxy/nginx/...` adalah file bantuan proxy yang dikelola CLI
- file di bawah `NB_CLI_ROOT/test2/storage/...` adalah milik aplikasi itu sendiri
- `app.conf` dapat diedit, tetapi blok yang dikelola NocoBase harus tetap utuh
- `index-v1.html` dan `index-v2.html` ditulis ulang sesuai subpath env saat ini, versi client aktif, dan `CDN_BASE_URL`

:::warning Catatan

Jika Anda membutuhkan konfigurasi Nginx di tingkat situs, seperti pembatasan laju, header tambahan, atau kontrol akses, edit `app.conf`. File bantuan yang dikelola CLI akan disejajarkan ulang ketika Anda menghasilkan ulang konfigurasi.

:::

## Konfigurasi manual: ketika Anda tidak memakai CLI

Jika aplikasinya bukan env yang dikelola CLI, atau Anda memang ingin memelihara seluruh konfigurasi Nginx sendiri, Anda tetap bisa menulisnya secara manual.

Namun untuk NocoBase, reverse proxy produksi biasanya lebih dari sekadar satu `proxy_pass`. Selain meneruskan permintaan API ke aplikasi backend, konfigurasi lengkap biasanya juga perlu menangani uploads, aset frontend, WebSocket, rute `.well-known`, dan halaman fallback SPA sekaligus.

Menggunakan `test2` sebagai contoh, berikut file dan direktori Nginx yang penting:

- Snippets Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Konfigurasi entry yang bisa diedit: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Halaman fallback SPA untuk v1: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Halaman fallback SPA untuk v2: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Hasil build frontend: `NB_CLI_ROOT/test2/storage/dist-client`
- Direktori upload: `NB_CLI_ROOT/test2/storage/uploads`

Artinya, konfigurasi manual biasanya minimal harus mencakup area entry berikut:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Jadi, konfigurasi Nginx yang lengkap biasanya lebih dari contoh reverse proxy umum seperti ini:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Untuk aplikasi yang dikelola CLI seperti `test2`, struktur deployment yang lebih realistis biasanya lebih mendekati contoh berikut:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Ada dua detail penting di sini:

- file di bawah `NB_CLI_ROOT/.nocobase/proxy/nginx/...` adalah file bantuan proxy yang dikelola CLI
- file di bawah `NB_CLI_ROOT/test2/storage/...` adalah hasil build dan uploads milik aplikasi itu sendiri

Jika aplikasi memakai deployment subpath, atau jika aset frontend, uploads, dan reverse proxy tidak berbagi sudut pandang path yang sama, konfigurasi manual akan lebih mudah salah. Dalam kasus seperti itu, biasanya lebih aman menghasilkan konfigurasi lebih dulu dengan:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Lalu gunakan hasil yang dihasilkan sebagai dasar untuk penyesuaian manual.
