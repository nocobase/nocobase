# Cara menghubungkan metode instalasi lama ke AI dan bermigrasi ke CLI

Jika Anda masih menggunakan kode sumber Docker, `create-nocobase-app` atau Git untuk menginstal dan memelihara NocoBase sesuai dengan dokumentasi lama, Anda dapat terus menggunakannya dengan cara ini. Tidak perlu segera menginstal ulang aplikasi untuk mengakses AI.

Halaman ini terutama membantu Anda menentukan rute terlebih dahulu:

- Terus gunakan metode instalasi dan peningkatan asli
- Biarkan aplikasi yang ada mengakses agen AI terlebih dahulu
- Bermigrasi ke pendekatan berbasis CLI baru

Secara default, disarankan untuk terlebih dahulu memeriksa kategori mana yang Anda ikuti, lalu memasukkan dokumen terkait. Ini lebih stabil dan kecil kemungkinannya untuk salah mengoperasikan lingkungan produksi.

## Metode mana yang harus saya pilih?

| Jika Anda mau sekarang... | Apa yang harus dilakukan secara default |
| --- | --- |
| Lanjutkan menginstal, mengupgrade, dan memelihara aplikasi seperti aslinya | Lanjutkan saja cara lama, baca dulu entri dokumen terkait di bawah |
| Biarkan aplikasi lama yang sudah berjalan stabil terhubung ke agen AI | Secara default, koneksi jarak jauh digunakan terlebih dahulu, yang memiliki risiko paling rendah |
| Gunakan `nb app`, `nb env`, `nb source` untuk mengelola aplikasi di masa mendatang | Buat aplikasi CLI baru dan migrasikan data lama ke sana |

## Lanjutkan menggunakan metode instalasi asli

Jika Anda sudah terbiasa dengan cara instalasi sebelumnya, Anda bisa terus menggunakannya. Cukup ikuti dokumen asli untuk instalasi, peningkatan, dan konfigurasi variabel lingkungan.

### Instal NocoBase

- [Instalasi Docker](/memulai/instalasi/buruh pelabuhan)
- [buat instalasi-nocobabase-aplikasi](/mulai/instalasi/buat-nocobabase-aplikasi)
- [Instalasi kode sumber Git](/memulai/instalasi/git)
- [Variabel lingkungan](/memulai/instalasi/env)

### Tingkatkan NocoBase

- [Meningkatkan instalasi Docker](/memulai/meningkatkan/buruh pelabuhan)
- [Peningkatan instalasi create-nocobase-app](/get-started/upgrade/create-nocobase-app)
- [Meningkatkan instalasi kode sumber Git](/memulai/meningkatkan/git)

## Metode 1: Pertama biarkan aplikasi yang ada mengakses agen AI

Jika aplikasi lama Anda sudah berjalan stabil, gunakan cara ini secara default.

Fokus metode ini adalah menghubungkan terlebih dahulu aplikasi yang ada ke CLI dan agen AI melalui koneksi jarak jauh. Ini adalah risiko paling rendah karena tidak secara langsung mengambil alih proses instalasi, permulaan, penghentian, dan pemutakhiran Anda saat ini.

Namun pertama-tama kita harus memperjelas batasannya:

- Metode ini tidak memiliki kemampuan terkait `nb app`
- Ini tidak mengambil alih manajemen runtime aplikasi lama untuk Anda
- Tapi kemampuan yang berhubungan dengan pembuatan AI dapat digunakan secara normal

Dengan kata lain, jika yang paling Anda pedulikan saat ini adalah "hubungkan AI terlebih dahulu" daripada "segera alihkan seluruh sistem manajemen operasi ke CLI", Anda akan mengambil jalur ini terlebih dahulu secara default.

Saat menyambung ke aplikasi yang sudah ada, Anda dapat menginisialisasi env CLI seperti ini:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Jika autentikasi ulang diperlukan nanti, Anda dapat menjalankan:

```bash
nb env auth app1
```

Jika Anda baru ingin mulai menggunakan AI untuk membangun kemampuan, lanjutkan saja membaca [Mulai Cepat Pembuatan AI](/ai-builder/).

## Metode 2: Bermigrasi ke CLI

Jika Anda ingin menggunakan `nb app`, `nb env`, dan `nb source` untuk mengelola aplikasi lokal di masa mendatang, maka pendekatan yang lebih aman adalah tidak mengambil alih aplikasi yang sudah ada secara langsung, namun membuat aplikasi baru lalu memigrasikan data aplikasi lama ke sana.

Alasannya juga sangat sederhana: kemampuan untuk "mengambil alih aplikasi yang ada" masih dalam tahap pengembangan.

Jadi saat ini, rute migrasi default yang disarankan adalah:

1. Pertama buat aplikasi CLI baru
2. Migrasi database, `storage` dan variabel lingkungan aplikasi lama.
3. Setelah memverifikasi bahwa pengoperasian, peningkatan, dan kemampuan AI aplikasi baru normal, putuskan apakah akan beralih ke lingkungan produksi.

Pertama buat env CLI baru:

```bash
nb init --yes --env app1
```

Sebelum melakukan migrasi, disarankan untuk mengonfirmasi bahwa konten berikut sudah siap:

1. Database telah dibackup
2. Direktori `storage` telah dicadangkan
3. Variabel lingkungan utama dari aplikasi lama telah dicatat, seperti `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

Secara default, cukup memigrasikan lingkungan pengujian terlebih dahulu. Hanya migrasikan lingkungan produksi ketika Anda telah mengonfirmasi bahwa cadangan, variabel lingkungan, dan konfigurasi database semuanya benar.

## Di mana mencarinya selanjutnya

- Jika Anda siap menginstal dan mengelola aplikasi dengan cara baru, lanjutkan ke [Instalasi menggunakan CLI (disarankan)](./cli.md)
- Jika Anda tetap menggunakan metode instalasi asli, cukup kembali ke instalasi dan perbarui entri dokumen di atas.
