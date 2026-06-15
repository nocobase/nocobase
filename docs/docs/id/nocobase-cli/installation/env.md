# Konfigurasi aplikasi dan `.env`

Halaman ini hanya berlaku untuk aplikasi yang dibuat atau dihosting melalui NocoBase CLI.

Jika Anda baru saja selesai membaca [Instalasi menggunakan CLI (disarankan)](./cli.md) dan telah melihat bagian "Direktori Instalasi", maka masalah paling umum yang akan Anda temui biasanya adalah sebagai berikut:

- Di mana file `.env` ditempatkan?
- Konfigurasi mana yang masih cocok untuk ditulis ke `.env`
- Konfigurasi mana yang sekarang lebih cocok untuk diserahkan kepada `nb env update`

Mari kita bahas kesimpulannya terlebih dahulu:

- Untuk aplikasi yang terinstal CLI, `.env` ditempatkan di `<app-path>/.env` secara default
- File ini opsional, tidak semua env harus dibuat secara manual
- Konfigurasi dasar seperti `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH`, dan `DB_*` dikelola oleh `nb env update` secara default.
- `.env` terutama digunakan untuk melengkapi variabel runtime yang belum diambil alih secara langsung oleh CLI, seperti penyimpanan, cache, log, pengamatan, dan beberapa variabel ekstensi plugin.

## Temukan `app-path` terlebih dahulu

Dalam [Instal menggunakan CLI (disarankan)](./cli.md#Direktori Instalasi), struktur direktori default CLI env adalah sebagai berikut:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Jika Anda tidak yakin di mana `app-path` yang diterapkan saat ini, Anda dapat memeriksa langsung:

```bash
nb env info app1 --field app.appPath
```

Ganti saja `app1` dengan nama env Anda.

Artinya, untuk aplikasi yang dibuat atau dihosting melalui CLI, lokasi paling tepat untuk file `.env` adalah:

```text
<app-path>/.env
```

Secara umum, tidak perlu meletakkannya di `source/.env`, dan tidak perlu menemukan `.env` di direktori root proyek Docker Compose sesuai dengan metode instalasi lama.

## Kapan Anda perlu membuat `.env` sendiri?

`.env` adalah opsional.

Jika Anda hanya ingin menjalankan aplikasi terlebih dahulu, atau sekadar mengubah konfigurasi dasar seperti port, zona waktu, koneksi database, dan jalur akses publik, maka dalam banyak kasus tidak perlu membuat `.env` secara manual.

Hanya tambahkan variabel tersebut ke `<app-path>/.env` jika Anda perlu menambahkan beberapa variabel runtime yang belum diambil alih langsung oleh CLI.

## Defaultnya adalah menggunakan `nb env update` terlebih dahulu

Dalam metode instalasi CLI baru, disarankan agar konfigurasi aplikasi dasar diprioritaskan ke [`nb env update`](../../api/cli/env/update.md) secara default.

Ini memiliki dua manfaat:

- Konfigurasi dan env itu sendiri disimpan dalam pikiran CLI yang sama, membuatnya lebih mudah untuk diperiksa dan dimodifikasi
- Di masa mendatang, Anda, skrip, dan agen AI dapat terus menggunakan rangkaian perintah yang sama untuk pemeliharaan, sehingga tidak mudah untuk menghadapi situasi "satu rangkaian perubahan dibuat di file, namun rangkaian lainnya dicatat di CLI"

### Konfigurasi ini sekarang lebih cocok untuk diserahkan ke `nb env update`

Untuk item berikut, Anda mungkin pernah menulisnya langsung ke `.env` di masa lalu. Namun, dalam mode instalasi CLI, disarankan untuk menggunakan `nb env update` secara default:

| Saya ingin berubah... | Bagaimana mengubah default |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Tipe database dan parameter koneksi, seperti `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| Skema PostgreSQL, awalan tabel, garis bawah yang memberi nama item tambahan database, seperti `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Misalnya ingin mengubah port aplikasi dan zona waktu, bisa langsung tulis seperti ini:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Jika Anda ingin mengubah parameter koneksi database, Anda dapat menulis seperti ini:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Setelah melakukan perubahan, CLI biasanya akan meminta Anda untuk mengeksekusi `nb app restart` nanti. Untuk deskripsi parameter lebih lengkap, lihat saja [`nb env update`](../../api/cli/env/update.md).

## Situasi mana yang lebih cocok untuk dituliskan ke dalam `.env`

Jika suatu variabel belum memiliki parameter CLI yang sesuai, atau lebih seperti konfigurasi yang diperluas "diteruskan langsung ke runtime aplikasi", lanjutkan saja menulis `<app-path>/.env`.

Biasanya mencakup kategori berikut:

- Konfigurasi penyimpanan file dan penyimpanan objek, seperti `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Konfigurasi Cache dan Redis, seperti `CACHE_*`, `REDIS_URL`
- Konfigurasi log dan observasi, seperti `LOGGER_*`, `TELEMETRY_*`
- Variabel khusus plugin atau ekstensi tertentu, seperti ekspor, tugas asinkron, alur kerja, dan variabel terkait ekstensi AI

Misalnya:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Jenis variabel ini pada dasarnya adalah konfigurasi runtime aplikasi, dan CLI saat ini tidak akan mengambil alih variabel tersebut item demi item. Paling alami untuk menempatkannya di `.env`.

## Cara membagi pekerjaan antara `.env` dan `nb env update`

Jika Anda tidak yakin ke mana konfigurasi tertentu harus diarahkan, ikuti saja aturan ini secara default:

- Jika `nb env update` sudah memiliki parameter yang sesuai, maka akan digunakan terlebih dahulu secara default.
- Jika tidak ada parameter yang sesuai, atau jelas merupakan milik konfigurasi ekstensi runtime seperti plug-in, penyimpanan, cache, dan log, masukkan ke dalam `<app-path>/.env`

Dalam sebagian besar skenario, pembagian kerja ini sudah cukup.

### Kesalahpahaman umum

Jangan menyimpan dua salinan konfigurasi yang sama pada saat yang bersamaan.

Misalnya, jika Anda telah menyimpan item dasar seperti `APP_PORT`, `TZ`, `APP_PUBLIC_PATH`, dan `DB_HOST` dengan `nb env update`, biasanya Anda tidak perlu menuliskannya lagi di `.env`. Jika tidak, saat memecahkan masalah nanti, akan mudah untuk tidak mengetahui lapisan mana yang merupakan nilai yang benar-benar ingin Anda terapkan.

## Contoh minimal `.env`

Jika konfigurasi dasar Anda telah disimpan melalui CLI, maka `.env` mungkin hanya perlu mempertahankan beberapa variabel ekstensi, seperti:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

Ini juga merupakan mentalitas yang paling ingin Anda bantu bangun oleh halaman ini:

`.env` masih berguna, tetapi dalam metode instalasi CLI yang baru, ini lebih tentang melengkapi konfigurasi ekstensi runtime daripada terus mengasumsikan semua parameter instalasi dasar.

## Di mana mencarinya selanjutnya

- Jika Anda belum mengkonfirmasi struktur direktori aplikasi, pertama kembali ke [Instal menggunakan CLI (disarankan)](./cli.md#Direktori instalasi)
- Jika Anda ingin mengubah konfigurasi dasar seperti port, zona waktu, koneksi database, dan jalur akses publik, terus lihat [`nb env update`](../../api/cli/env/update.md)
- Jika Anda ingin memulai, memulai ulang, atau melihat log aplikasi, lanjutkan melihat [Kelola Aplikasi](../operations/manage-app.md)
