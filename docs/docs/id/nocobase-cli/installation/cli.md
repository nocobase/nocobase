# Instal menggunakan CLI (disarankan)

Setelah NocoBase 2.1.0, metode instalasi dan manajemen resmi berbasis CLI disediakan. Anda dapat menggunakannya untuk menyelesaikan instalasi, koneksi, peningkatan, dan pemeliharaan harian, dan Anda juga dapat menyiapkan lingkungan yang dapat dihubungkan dan dioperasikan untuk Agen AI.

## Instal NocoBase CLI

Hanya dijalankan saat pertama kali menginstal CLI.

Pertama instal CLI secara global:

```bash
npm install -g @nocobase/cli
nb --version
```

:::tip Disarankan untuk mengaktifkan mode sesi terlebih dahulu

Jika Anda akan membuka beberapa terminal atau shell secara bersamaan, atau ingin Agen AI beroperasi secara paralel dengan Anda sendiri, disarankan secara default untuk menjalankan [`nb session setup`](../../api/cli/session/setup.md) terlebih dahulu. Dengan cara ini, setiap sesi dapat mempertahankan `current env`-nya sendiri dan tidak akan mudah mempengaruhi satu sama lain.

```bash
nb session setup
```

:::

CLI memeriksa pembaruan mandiri secara default. Anda dapat menyesuaikan strategi pembaruan sesuai dengan kebiasaan Anda:

- `prompt`: Konfirmasi ketika versi baru ditemukan
- `auto`: pembaruan otomatis
- `off`: Matikan pembaruan otomatis

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

Pembaruan mandiri hanya didukung saat CLI dikelola oleh instalasi global npm, pnpm, atau yarn standar. Jika dijalankan dari source atau dari pohon dependency proyek lokal, gunakan [`nb self check`](../../api/cli/self/check.md) untuk melihat metode instalasi yang terdeteksi, lalu perbarui proyek induk tersebut.

Jika Anda akan menyebarkan NocoBase ke server dan ingin membuka wizard `nb init --ui` dari browser jarak jauh, disarankan untuk terlebih dahulu mengubah host default CLI ke IP server saat ini:

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Ganti `<server-ip>` dengan IP sebenarnya dari server saat ini yang dapat Anda akses.

`nb config` adalah konfigurasi global CLI. Biasanya hanya perlu diatur satu kali, dan nilai default ini akan otomatis digunakan saat menjalankan `nb init --ui` lagi nanti, sehingga tidak perlu mengulangi konfigurasi setiap saat.

Secara umum:

- `default-ui-host` digunakan untuk membuat URL wizard `nb init --ui` yang dapat diakses dari browser; layanan wizard selalu mendengarkan pada `0.0.0.0`
- `default-api-host` untuk alamat API yang dihasilkan secara default pada instalasi baru

Jika diterapkan di server, kedua nilai tersebut biasanya harus diubah ke IP yang dapat diakses oleh server saat ini, daripada terus menggunakan alamat lokal default.

:::peringatan Ini hanya panduan instalasi atau metode akses sementara, bukan pintu masuk yang disarankan untuk lingkungan produksi.

Setel `default-ui-host` / `default-api-host` ke IP server, terutama agar Anda dapat membuka `nb init --ui` dari browser jarak jauh, atau memverifikasi sementara apakah layanan dapat diakses setelah instalasi selesai.

Ini tidak berarti bahwa lingkungan produksi harus menggunakan `IP + port` untuk menyediakan layanan eksternal dalam waktu lama. Saat diterapkan secara formal, tetap disarankan untuk menggunakan nama domain dan menyediakan akses terpadu melalui proxy terbalik seperti Nginx atau Caddy, lalu mengaktifkan HTTPS.

:::

## Instal NocoBase

### Metode 1: Instal melalui wizard UI

Ini adalah entri default yang direkomendasikan. Anda hanya perlu menjalankan:

```bash
nb init --ui
```

Jika Anda ingin menentukan port tetap untuk halaman wizard, Anda dapat menambahkan `--ui-port` secara langsung, misalnya:

```bash
nb init --ui --ui-port 3000
```

![nb init UI wizard](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

Wizard akan membawa Anda langkah demi langkah untuk menyelesaikan konfigurasi yang diperlukan untuk instalasi atau koneksi berdasarkan skenario saat ini.

### Metode 2: Berinteraksi melalui terminal

Jika Anda lebih nyaman mengetik langkah demi langkah di terminal, Anda dapat langsung menjalankannya:

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Metode 3: Melalui perintah non-interaktif

Jika Anda menjalankan skrip, CI/CD, atau lingkungan non-interaktif lainnya, cukup gunakan `--yes`. Dalam mode ini, `--env` harus diteruskan secara eksplisit, dan parameter yang tidak ditentukan secara eksplisit akan diproses dengan nilai default.

Cara default terpendek untuk menulisnya adalah:

```bash
nb init --yes --env app1
```

Khusus untuk kombinasi umum seperti sumber instalasi yang berbeda, pemilihan versi, sertifikasi `basic`, koneksi CI/CD ke aplikasi yang ada, dan penamaan database, lihat saja [contoh referensi perintah `nb init`](../../api/cli/init.md# contoh).

## Apa yang harus Anda konfirmasi terlebih dahulu setelah instalasi selesai?

`--env` adalah nama lingkungan di CLI. Secara umum, hal berikutnya yang Anda lakukan setelah instalasi selesai berkisar pada env ini.

Biasanya disarankan untuk mengkonfirmasi 3 hal ini terlebih dahulu:

1. Apakah env telah berhasil dibuat dan disimpan
2. Apakah aplikasi dapat dijalankan secara normal dan apakah lognya normal
3. Jika Anda akan membukanya secara resmi ke dunia luar, apakah Anda sudah merencanakan pintu masuk ke lingkungan produksi daripada terus menggunakan `IP + port` secara langsung?

### Direktori instalasi

Jika Anda baru saja menginstal aplikasi lokal menggunakan `nb init --env app1`, Anda dapat melihat jalur lengkapnya melalui `nb env info app1 --field app.appPath`.

Secara default, CLI mengatur file lokal di bawah `app-path` sesuai dengan konvensi berikut:

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

Secara umum:

- `source/` terutama berhubungan dengan direktori aplikasi lokal npm/Git env. Untuk Docker env, CLI juga akan mempertahankan kumpulan derivasi jalur default ini, tetapi sering kali Anda tidak perlu mempedulikannya secara manual
- `storage/` digunakan untuk menyimpan data runtime, seperti data database bawaan, plug-in, log, dll.
- `.env` adalah file variabel lingkungan aplikasi opsional. Hanya ketika Anda perlu menyesuaikan variabel lingkungan, Anda perlu menambahkannya di `<app-path>/.env`; jika file ini ada, sumber instalasi Docker, npm dan Git akan membacanya secara default.

Lihat [`nb init` Referensi Perintah](../../api/cli/init.md) untuk penjelasan lebih lengkap.

### Pengingat penerapan lingkungan produksi

Jika Anda baru saja menyelesaikan instalasi dan ingin memverifikasi hasil instalasi terlebih dahulu, biasanya tidak ada masalah dalam membuka halaman dengan `IP + port`.

Namun jika env ini ingin secara resmi memberikan layanan kepada dunia luar, perhatian khusus perlu diberikan:

- `nb init --ui` sendiri hanyalah halaman sementara dari wizard instalasi, digunakan untuk menyelesaikan instalasi atau inisialisasi, dan bukan merupakan pintu masuk layanan eksternal resmi dari aplikasi.
- Setelah instalasi melalui `nb init` selesai, `IP + port` yang saat ini diekspos oleh aplikasi lebih cocok untuk tahap debugging, tahap verifikasi atau akses sementara ke intranet
- Di lingkungan produksi, tidak disarankan untuk mengekspos port aplikasi NocoBase secara langsung ke jaringan publik untuk penggunaan jangka panjang.
- Untuk akses eksternal resmi, disarankan menggunakan nama domain dan membalikkan proxy ke NocoBase melalui Nginx atau Caddy
- Lingkungan produksi harus memprioritaskan pengaktifan HTTPS dibandingkan penggunaan `http://IP:port` yang terekspos dalam jangka panjang

Dengan kata lain, `default-ui-host` dan `default-api-host` hanya untuk membuat wizard instalasi dan pembuatan alamat default lebih nyaman, dan tidak mewakili pintu masuk akses ke lingkungan produksi akhir.

Jika env ini siap diluncurkan secara resmi, disarankan agar "sambungkan ke proksi terbalik dan aktifkan HTTPS" sebagai langkah berikutnya setelah penginstalan selesai, daripada item pengoptimalan opsional.

Jika Anda siap untuk melanjutkan penerapan formal sekarang, disarankan untuk memulai dengan [penyebaran lingkungan produksi](../production/index.md), lalu lanjutkan melihat konfigurasi proksi terbalik [Nginx](../production/reverse-proxy/nginx.md) atau [Caddy](../production/reverse-proxy/caddy.md) sesuai kebutuhan.

### Operasi harian

Anda dapat mengonfirmasi terlebih dahulu apakah env ini telah berhasil disimpan:

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Jika Anda ingin melanjutkan operasi selanjutnya setelah instalasi, Anda dapat mengklik indeks berikut untuk melihat ke bawah:

| saya ingin... | Di mana mencarinya |
| --- | --- |
| Jika Anda siap menjadikan env ini secara resmi terbuka untuk dunia luar, sambungkan ke proksi terbalik lingkungan produksi, dan gunakan nama domain dan HTTPS untuk mengekspos layanan. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Konfirmasikan apakah env berhasil disimpan, periksa env mana yang saat ini digunakan, dan beralih di antara beberapa env. | [`nb env`](../../api/cli/env/index.md), [Manajemen multi-lingkungan](../operations/multi-environment.md). |
| Mulai, hentikan, mulai ulang aplikasi, lihat log, atau lanjutkan peningkatan aplikasi. | [`nb app`](../../api/cli/app/index.md), [Kelola Aplikasi](../operations/manage-app.md). |
| Periksa koneksi database, lihat status database bawaan, atau pecahkan masalah kontainer database. | [`nb db`](../../api/cli/db/index.md). |
| Lihat plug-in yang diinstal, aktifkan atau nonaktifkan plug-in. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Aktifkan otorisasi komersial, periksa status otorisasi, dan sinkronkan plug-in komersial. | [`nb license`](../../api/cli/license/index.md). |
| Kelola proyek kode sumber lokal, seperti mengunduh kode sumber, memulai mode pengembangan, pembuatan, atau pengujian. Ini biasanya digunakan dengan npm/Git env. | [`nb source`](../../api/cli/source/index.md). |

Jika Anda baru saja menginstal aplikasi lokal, biasanya Anda dapat menjalankan perintah berikut terlebih dahulu:

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Jika Anda memelihara beberapa envs secara bersamaan, lihat [Manajemen Beberapa Lingkungan](../operations/multi-environment.md) untuk metode peralihan dan tampilan status selanjutnya.

Jika nanti ingin mengupgrade aplikasi, lihat saja [Kelola Aplikasi](../operations/manage-app.md) dan [`nb app upgrade` Referensi Perintah](../../api/cli/app/upgrade.md).

## Tautan terkait

- [`nb init` Referensi Perintah](../../api/cli/init.md)
- [`nb env info` Referensi Perintah](../../api/cli/env/info.md)
- [Proksi terbalik lingkungan produksi: Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Bermigrasi dari cara lama ke CLI](./migration.md)
- [Manajemen beberapa lingkungan](../operations/multi-environment.md)
- [Kelola Aplikasi](../operations/manage-app.md)
