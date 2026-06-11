#Nginx

Jika Anda telah menggunakan Nginx untuk mengelola situs di server, atau Anda perlu menangani sertifikat, cache, dan kontrol akses nanti, maka `nb proxy nginx` adalah jalur default yang disarankan.

Jika Anda hanya ingin mengonfigurasi HTTPS sesegera mungkin dan tidak ingin menyimpan terlalu banyak detail proxy, maka [Caddy](./caddy.md) akan lebih bebas dari rasa khawatir. Namun selama Anda menggunakan Nginx, dokumen ini adalah jalur default.

## Kapan lebih cocok menggunakan Nginx?

Secara umum, situasi berikut memberikan prioritas untuk terus menggunakan Nginx:

- Anda telah menggunakan Nginx untuk mengelola banyak situs di server.
- Anda perlu memelihara sendiri sertifikat, cache, kontrol akses, atau aturan khusus lainnya
- Anda ingin lapisan entri terus menggunakan metode operasi dan pemeliharaan Nginx yang ada

Jika tujuan Anda hanya untuk menjalankan HTTPS secepat mungkin, dan Anda tidak ingin menyimpan terlalu banyak detail TLS, maka [Caddy](./caddy.md) akan lebih bebas dari rasa khawatir.

## Pertama ikuti ketiga perintah ini.

Jika Anda hanya ingin menjalankan entry layer Nginx terlebih dahulu, cukup mengingat tiga perintah berikut secara default:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Jika Nginx sudah diinstal secara lokal, ubah saja entri pertama menjadi `nb proxy nginx use local`.

Di sebagian besar skenario, cukup mengeksekusi `use` terlebih dahulu, lalu `generate`, dan terakhir `reload`. Untuk detail lainnya dan perintah lainnya, lihat bab berikut atau referensi CLI.

## Langkah 1: Pertama pilih cara menjalankan Nginx sendiri

Jika Nginx sudah terinstal di mesin saat ini, gunakan saja `use local`.

Jika Anda ingin menggunakan Nginx versi Docker, gunakan `use docker`.

`local` / `docker` di sini mengacu pada mode berjalan **Nginx itu sendiri**.

Menggunakan Nginx versi Docker:

```bash
nb proxy nginx use docker
```

Menggunakan Nginx yang diinstal secara lokal:

```bash
nb proxy nginx use local
```

Jika nanti Anda lupa metode mana yang sedang dipilih, Anda dapat menjalankan:

```bash
nb proxy nginx current
```

## Langkah 2: Jalankan `generate`

`generate` digunakan untuk menghasilkan konfigurasi entri Nginx sesuai dengan env yang ditentukan. Cara paling umum untuk menulisnya adalah:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Jika Anda juga ingin menentukan port masuk, Anda juga dapat menulisnya bersama-sama:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Maksud dari parameter disini adalah:

- `--env`: Tentukan env CLI mana yang akan menghasilkan konfigurasi
- `--host`: Tentukan nama domain untuk akses eksternal
- `--port`: Menentukan port entri proxy, bukan `appPort` dari aplikasi NocoBase itu sendiri

Port aplikasi upstream berasal dari `appPort` yang disimpan di env ini. Jika perintah meminta env hilang `appPort`, jalankan:

```bash
nb env update test2 --app-port 56575
```

Jika nanti Anda mengubah konfigurasi seperti `app-port` dan `app-public-path` yang akan mempengaruhi hasil proxy, ingatlah untuk menjalankan kembali `generate`.

## Langkah 3: Jalankan `reload`

Setelah membuat konfigurasi, langsung jalankan:

```bash
nb proxy nginx reload
```

Di sebagian besar skenario, cukup gunakan perintah ini secara langsung. Jika belum berjalan maka startup akan diproses secara internal terlebih dahulu; jika sudah berjalan maka akan di-reload sesuai konfigurasi terbaru.

## File apa yang akan dikelola CLI?

Mengambil `test2` sebagai contoh, perintah terkait Nginx biasanya memelihara file dan direktori berikut:

| jalur | fungsi |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Direktori cuplikan bersama Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Konfigurasi entri situs yang dapat diedit |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | halaman cadangan v1 SPA |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | halaman cadangan v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Direktori produk build front-end yang saat ini digunakan |
| `NB_CLI_ROOT/test2/storage/uploads` | Direktori unggahan aplikasi saat ini |

di dalam:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Berikut ini adalah file tambahan agen yang dikelola oleh CLI
- `NB_CLI_ROOT/test2/storage/...` Berikut ini adalah sumber daya statis dan direktori unggahan milik aplikasi
- `app.conf` dapat diubah, tetapi blok yang dikelola NocoBase harus dipertahankan
- `index-v1.html` dan `index-v2.html` akan secara otomatis menulis ulang alamat sumber daya sesuai dengan subjalur env saat ini, versi klien aktif, dan `CDN_BASE_URL`

:::catatan peringatan

Jika Anda ingin menambahkan konfigurasi Nginx tingkat situs, seperti batasan saat ini, header tambahan, dan kontrol akses, cukup ubah `app.conf`. File tambahan yang dikelola CLI diperbarui secara serempak pada pembangunan kembali berikutnya.

:::

## Konfigurasi tulisan tangan: apa yang harus dilakukan tanpa CLI

Jika aplikasi Anda tidak dihosting CLI, atau Anda secara eksplisit ingin mempertahankan sendiri konfigurasi Nginx yang lengkap, Anda juga dapat menulisnya dengan tangan.

Namun, untuk NocoBase, proksi balik produksi biasanya lebih dari sekadar `proxy_pass`. Selain meneruskan permintaan API ke aplikasi backend, konfigurasi yang lengkap dan dapat digunakan biasanya perlu menangani direktori unggahan, sumber daya statis front-end, WebSocket, rute `.well-known`, dan halaman fallback SPA.

Mengambil `test2` sebagai contoh, file dan direktori utama yang terkait dengan Nginx biasanya mencakup:

- Cuplikan Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Konfigurasi entri yang dapat diedit: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Halaman cadangan SPA (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Halaman cadangan SPA (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Direktori produk build front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Unggah direktori: `NB_CLI_ROOT/test2/storage/uploads`

Dengan kata lain, konfigurasi tulisan tangan biasanya perlu mencakup setidaknya jenis entri berikut:

- `uploads`: Menampilkan direktori unggahan melalui `alias`
- `dist`: Mengekspos direktori produk build front-end melalui `alias`
- `well-known`: Menangani jalur penemuan terkait OAuth/OpenID
- `api`: meneruskan permintaan `/api/` ke aplikasi backend
- `ws`: meneruskan permintaan WebSocket ke aplikasi backend
- `spa`: Menyediakan entri front-end dan `try_files` cadangan untuk `/` dan `/v/`

Oleh karena itu, konfigurasi Nginx yang lengkap biasanya bukan hanya metode penulisan reverse proxy umum berikut:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Untuk aplikasi yang dihosting CLI seperti `test2`, struktur yang mendekati penerapan sebenarnya biasanya akan terlihat seperti ini:

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

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
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

Ada dua poin penting di sini:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Berikut ini adalah file tambahan agen yang dikelola oleh CLI
- `NB_CLI_ROOT/test2/storage/...` Berikut ini adalah dengan menggunakan direktori produk dan direktori unggahan Anda sendiri

Jika aplikasi Anda menggunakan penerapan sub-jalur, atau sumber daya front-end, direktori unggahan, dan proksi terbalik tidak berada dalam perspektif jalur yang sama, konfigurasi tulisan tangan akan lebih rentan terhadap kesalahan. Dalam skenario ini, biasanya lebih disarankan untuk mengeksekusi:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Kemudian melakukan penyesuaian berdasarkan hasil yang dihasilkan.

Pendekatan yang lebih bijaksana biasanya adalah:

1. Pertama biarkan CLI menghasilkan konfigurasi Nginx
2. Konfirmasikan struktur perutean dan jalur sebenarnya berdasarkan hasil yang dihasilkan.
3. Kemudian lakukan penyesuaian manual sesuai dengan nama domain Anda, mode pengoperasian, dan jalur pemasangan.

Hal ini biasanya lebih kecil kemungkinannya untuk melewatkan detail terkait WebSockets, sumber daya statis, direktori unggahan, atau halaman cadangan SPA dibandingkan dengan menulis konfigurasi dari awal dengan tangan.

## Cara menangani HTTPS

Jika Anda memutuskan untuk terus menggunakan Nginx, HTTPS juga dapat terus dikonfigurasi di Nginx. Praktik umum adalah memperluas `listen 80` menjadi `80/443` entri ganda, lalu menambahkan jalur sertifikat dan konfigurasi TLS.

Namun, jika Anda hanya ingin mendapatkan HTTPS yang tersedia sesegera mungkin, dan tidak ingin menangani sendiri permohonan dan perpanjangan sertifikat, maka akan lebih aman jika menggunakan [Caddy](./caddy.md) secara langsung.

## Instruksi umum

- `nb proxy nginx generate` untuk aplikasi yang diinstal oleh `nb init`
- Jika Anda kemudian mengubah konfigurasi seperti `app-port` dan `app-public-path` yang akan mempengaruhi hasil proxy, ingatlah untuk menjalankan kembali `generate`

## Tautan terkait

- [Proksi terbalik lingkungan produksi](./index.md)
- [Caddy](./caddy.md)
- [Instal menggunakan CLI (disarankan)](../../installation/cli.md)
- [Konfigurasi aplikasi dengan `.env`](../../installation/env.md)
- [`nb proxy nginx` Referensi Perintah](../../../api/cli/proxy/nginx/index.md)
