#Caddy

Jika Anda sudah memiliki nama domain dan ingin mengonfigurasi HTTPS sesegera mungkin, `nb proxy caddy` biasanya merupakan metode masuk yang paling bebas kekhawatiran.

Daripada mempertahankan konfigurasi sertifikat Nginx sendiri, Caddy lebih seperti pintasan default untuk "menjalankan lapisan entri terlebih dahulu".

## Kapan sebaiknya menggunakan Caddy?

Secara umum, Caddy diberikan prioritas dalam situasi berikut:

- Anda sudah memiliki nama domain dan ingin mengakses HTTPS sesegera mungkin
- Anda tidak ingin menyimpan terlalu banyak detail sertifikat dan TLS
- Yang Anda butuhkan hanyalah lapisan masuk yang sederhana dan stabil

Jika Anda sudah menggunakan Nginx untuk mengelola banyak situs di server, atau Anda perlu melakukan caching yang lebih berat, kontrol akses, dan aturan penyesuaian nanti, maka akan lebih lancar untuk terus melihat [Nginx](./nginx.md).

## Pertama ikuti ketiga perintah ini.

Jika Anda hanya ingin menjalankan lapisan entri Caddy terlebih dahulu, cukup mengingat tiga perintah berikut secara default:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Jika Caddy sudah diinstal secara lokal, ubah saja entri pertama menjadi `nb proxy caddy use local`.

Di sebagian besar skenario, cukup mengeksekusi `use` terlebih dahulu, lalu `generate`, dan terakhir `reload`. Untuk detail lainnya dan perintah lainnya, lihat bab berikut atau referensi CLI.

## Langkah 1: Pilih sendiri cara menjalankan Caddy

Jika Caddy sudah terinstal di mesin saat ini, gunakan saja `use local`.

Jika Anda ingin menggunakan Caddy versi Docker, gunakan `use docker`.

`local` / `docker` di sini mengacu pada cara **Caddy beroperasi**.

Menggunakan Caddy versi Docker:

```bash
nb proxy caddy use docker
```

Menggunakan instalasi lokal Caddy:

```bash
nb proxy caddy use local
```

Jika nanti Anda lupa metode mana yang sedang dipilih, Anda dapat menjalankan:

```bash
nb proxy caddy current
```

## Langkah 2: Jalankan `generate`

`generate` digunakan untuk menghasilkan konfigurasi Caddy sesuai dengan env yang ditentukan. Cara paling umum untuk menulisnya adalah:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Jika Anda juga ingin menentukan port masuk, Anda juga dapat menulisnya bersama-sama:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Maksud dari parameter disini adalah:

- `--env`: Tentukan env CLI mana yang akan menghasilkan konfigurasi
- `--host`: Tentukan nama domain untuk akses eksternal
- `--port`: Tentukan port entri proxy

Bagi Caddy, `--host` sangat penting. Dalam lingkungan formal, cobalah untuk meneruskan nama domain yang telah diselesaikan ke server saat ini secara default, sehingga akses HTTPS akan lebih natural.

Jika perintah meminta env tidak ada `appPort`, jalankan terlebih dahulu:

```bash
nb env update test2 --app-port 56575
```

Jika nanti Anda mengubah konfigurasi seperti `app-port` dan `app-public-path` yang akan mempengaruhi hasil proxy, ingatlah untuk menjalankan kembali `generate`.

## Langkah 3: Jalankan `reload`

Setelah membuat konfigurasi, langsung jalankan:

```bash
nb proxy caddy reload
```

Di sebagian besar skenario, cukup gunakan perintah ini secara langsung. Jika belum berjalan maka startup akan diproses secara internal terlebih dahulu; jika sudah berjalan maka akan di-reload sesuai konfigurasi terbaru.

## File apa yang akan dikelola CLI?

Mengambil `test2` sebagai contoh, perintah terkait Caddy biasanya memelihara file dan direktori berikut:

| jalur | fungsi |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Konfigurasi situs lengkap dihasilkan oleh CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | File entri umum Caddy, bertanggung jawab untuk mengimpor semua `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | halaman cadangan v1 SPA |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | halaman cadangan v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Direktori produk build front-end yang saat ini digunakan |
| `NB_CLI_ROOT/test2/storage/uploads` | Direktori unggahan aplikasi saat ini |

di dalam:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Berikut ini adalah file tambahan agen yang dikelola oleh CLI
- `NB_CLI_ROOT/test2/storage/...` Berikut ini adalah sumber daya statis dan direktori unggahan milik aplikasi
- `nocobase.caddy` adalah file entri tingkat penyedia dan biasanya tidak perlu diubah secara manual.
- `app.caddy` adalah konfigurasi situs Caddy lengkap dari env tertentu. Mengeksekusi ulang `generate` akan menimpa keseluruhannya

:::catatan peringatan

Jika Anda ingin mengimbangi konfigurasi tingkat situs Caddy, seperti header tambahan, autentikasi, pembatasan kecepatan, atau strategi kompresi, Anda dapat menyesuaikan terlebih dahulu berdasarkan `app.caddy`; namun, perlu diketahui bahwa eksekusi ulang `generate` berikutnya akan menimpa file ini.

:::

## Konfigurasi tulisan tangan: apa yang harus dilakukan tanpa CLI

Jika aplikasi Anda tidak dihosting CLI, atau Anda secara eksplisit ingin mempertahankan sendiri konfigurasi Caddy yang lengkap, Anda juga dapat menulisnya dengan tangan.

Namun, untuk NocoBase, entri lingkungan produksi biasanya bukan sekadar `reverse_proxy`. Selain meneruskan permintaan API ke aplikasi backend, konfigurasi Caddy yang lengkap dan berfungsi biasanya juga perlu menangani direktori unggahan, sumber daya statis front-end, perutean `.well-known`, WebSocket, dan halaman fallback SPA.

Mengambil `test2` sebagai contoh, direktori utama yang terkait dengan Caddy biasanya mencakup:

- Direktori halaman cadangan SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Direktori produk build front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Unggah direktori: `NB_CLI_ROOT/test2/storage/uploads`

Dengan kata lain, konfigurasi tulisan tangan biasanya perlu mencakup setidaknya jenis entri berikut:

- `v`: Alihkan `/v` ke `/v/`
- `uploads`: Buka direktori unggahan
- `dist`: Mengekspos direktori produk build front-end
- `oauth well-known`: Menangani jalur penemuan OAuth
- `openid well-known`: Menangani jalur penemuan OpenID
- `api`: meneruskan permintaan `/api/` ke aplikasi backend
- `ws`: meneruskan permintaan WebSocket ke aplikasi backend
- `spa v2`: Menyediakan entri front-end dan halaman kembali untuk `/v/`
- `spa v1`: Menyediakan entri front-end dan halaman kembali untuk `/`

Oleh karena itu, konfigurasi Caddy lengkap biasanya tidak hanya ditulis dengan cara umum berikut:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Untuk aplikasi yang dihosting CLI seperti `test2`, struktur yang mendekati penerapan sebenarnya biasanya akan terlihat seperti ini:

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

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
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

Ada juga dua poin penting di sini:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Berikut ini adalah direktori halaman rollback SPA yang dikelola oleh CLI
- `NB_CLI_ROOT/test2/storage/...` Berikut ini adalah penggunaan direktori produk build dan direktori unggahan Anda sendiri

Jika aplikasi Anda menggunakan penerapan sub-jalur, atau sumber daya front-end, direktori unggahan, dan lapisan entri tidak berada dalam perspektif jalur yang sama, konfigurasi tulisan tangan akan lebih rentan terhadap kesalahan. Dalam skenario ini, biasanya lebih disarankan untuk mengeksekusi:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Kemudian melakukan penyesuaian berdasarkan hasil yang dihasilkan.

Jika Anda ingin CLI membantu Anda menjalankan jalur dan rute terlebih dahulu, maka struktur yang dihasilkan biasanya adalah:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

di dalam:

- `nocobase.caddy` bertanggung jawab untuk menyatukan `import */app.caddy`
- `test2/app.caddy` adalah konfigurasi situs lengkap dari env ini `test2`
- `public/index-v1.html` dan `public/index-v2.html` adalah halaman cadangan SPA yang dihasilkan CLI

Pendekatan yang lebih bijaksana biasanya adalah:

1. Pertama biarkan CLI menghasilkan konfigurasi Caddy
2. Konfirmasikan struktur perutean dan jalur sebenarnya berdasarkan hasil yang dihasilkan.
3. Kemudian lakukan penyesuaian manual sesuai dengan nama domain Anda, mode pengoperasian, dan jalur pemasangan.

Hal ini biasanya lebih kecil kemungkinannya untuk melewatkan detail terkait WebSockets, sumber daya statis, direktori unggahan, rute `.well-known`, atau halaman cadangan SPA dibandingkan dengan menulis konfigurasi dari awal dengan tangan.

## Periksa dan muat ulang konfigurasi

Jika Anda menulis atau menyesuaikan konfigurasi Caddy secara manual, verifikasi terlebih dahulu setelah melakukan perubahan, lalu muat ulang:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Jika Anda tidak menggunakan `systemd` untuk mengelola Caddy, Anda dapat menggunakan metode startup dan reload Anda sendiri.

Jika Anda mengelola lapisan entri melalui `nb proxy caddy`, biasanya lebih disukai menggunakan:

```bash
nb proxy caddy reload
```

Jika Anda ingin melihat driver saat ini, total jalur entri file, direktori root runtime dan kontainer atau informasi biner lokal, Anda dapat menjalankan:

```bash
nb proxy caddy info
```

Jika Anda hanya ingin segera mengonfirmasi apakah ini sedang berjalan, Anda dapat menjalankan:

```bash
nb proxy caddy status
```

## Instruksi umum

- `nb proxy caddy generate` untuk aplikasi yang diinstal oleh `nb init`
- Jika Anda sudah memiliki nama domain yang dapat diselesaikan ke server secara normal, Caddy sering kali merupakan cara tercepat untuk mendapatkan HTTPS.
- Jika Anda kemudian mengubah konfigurasi seperti `app-port` dan `app-public-path` yang akan mempengaruhi hasil proxy, ingatlah untuk menjalankan kembali `generate`

## Tautan terkait

- [Proksi terbalik lingkungan produksi](./index.md)
- [Nginx](./nginx.md)
- [Instal menggunakan CLI (disarankan)](../../installation/cli.md)
- [Konfigurasi aplikasi dengan `.env`](../../installation/env.md)
- [`nb proxy caddy` Referensi Perintah](../../../api/cli/proxy/caddy/index.md)
