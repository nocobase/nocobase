# Mulai cepat

Jika Anda baru pertama kali menggunakan CLI ini, Anda tidak perlu menghafal semua perintah di awal. Gunakan `nb init --ui` untuk menginstal aplikasi terlebih dahulu, lalu lanjutkan melihat sisanya sesuai skenario.

## Pertama-tama tentukan pikiran yang paling penting

Di NocoBase CLI, operasi selanjutnya tidak berkisar pada "direktori tertentu" atau "port tertentu" secara default, tetapi pada **env**.

Anda dapat menganggap env sebagai "seperangkat koneksi aplikasi dan informasi yang berjalan yang diingat oleh CLI". Selama berhasil disimpan, banyak perintah berikut yang dapat digunakan secara langsung:

- Gunakan `nb init` untuk menginstal aplikasi baru dan menyimpannya sebagai env
- Gunakan `nb env add` untuk menghubungkan aplikasi yang ada ke CLI
- Kelola lingkungan ini dengan `nb app start`, `nb app logs`, `nb app upgrade`
- Cadangkan dan pulihkan env ini menggunakan `nb backup`
- Gunakan `nb app autostart`, `nb proxy` untuk terus melengkapi kemampuan lingkungan produksi

Ingatlah hal ini terlebih dahulu, dan dokumen selanjutnya akan lebih lancar.

## Jalur yang direkomendasikan secara default

Jika Anda tidak yakin harus mulai dari mana, biasanya cara termudah adalah mengikuti jalur ini:

1. Baca terlebih dahulu [Instalasi menggunakan CLI (disarankan)](./installation/cli.md) dan selesaikan `nb init` satu kali.
2. Setelah aplikasi disimpan sebagai env, lihat [Manajemen Lingkungan Berganda](./operations/multi-environment.md) untuk mengonfirmasi env saat ini, mengganti env, dan memeriksa status.
3. Untuk startup harian, stop, log dan upgrade, terus lihat [Kelola Aplikasi](./operations/manage-app.md).
4. Sebelum melakukan peningkatan, migrasi, atau perubahan penting, lihat [Pencadangan dan Pemulihan](./operations/backup-restore.md).
5. Jika Anda sudah siap untuk online secara resmi, masukkan [Ikhtisar Penerapan Lingkungan Produksi] (./production/index.md).

Tiga langkah pertama mencakup sebagian besar skenario penggunaan.

## Indeks cepat

| saya ingin... | Di mana mencarinya |
| --- | --- |
| Belum ada aplikasinya, install dulu NocoBase baru dan simpan sebagai CLI env | [Instal menggunakan CLI (disarankan)](./installation/cli.md) |
| Sudah menjalankan NocoBase dan ingin mengakses manajemen CLI | [Instal menggunakan CLI (disarankan)](./installation/cli.md) |
| Migrasikan metode instalasi lama secara bertahap ke CLI | [Bermigrasi dari metode instalasi lama ke CLI](./installation/migration.md) |
| Lihat env mana yang disimpan secara lokal, ganti env saat ini, dan periksa status | [Manajemen berbagai lingkungan](./operations/multi-environment.md) |
| Mulai, hentikan, mulai ulang aplikasi, lihat log, atau lanjutkan pemutakhiran | [Kelola Aplikasi](./operations/manage-app.md) |
| Buat cadangan sebelum memutakhirkan, memigrasikan, atau mengubah data secara batch, lalu memulihkannya bila diperlukan | [Cadangkan dan pulihkan](./operations/backup-restore.md) |
| Pertama konfirmasikan variabel lingkungan utama yang diperlukan untuk menjalankan aplikasi | [Variabel lingkungan aplikasi](./installation/env.md) |
| Instal plugin pihak ketiga | [Pemasangan dan peningkatan plug-in pihak ketiga](./plugins/third-party.md) |
| Biarkan aplikasi memasuki lingkungan produksi: startup otomatis, akses eksternal yang stabil, proxy terbalik | [Ikhtisar penerapan lingkungan produksi](./production/index.md) |

## Kapan harus melihat referensi perintah

Kumpulan dokumen mulai cepat ini lebih bersifat "apa yang ingin saya lakukan sekarang". Jika Anda sudah mengetahui perintah mana yang ingin Anda jalankan dan hanya ingin terus melihat parameter lengkapnya, buka saja [Referensi Perintah NocoBase CLI](../api/cli/index.md).

Saran defaultnya adalah:

- Pertama-tama gunakan dokumen Mulai Cepat untuk menentukan jalurnya
- Kemudian periksa detail parameter pada halaman perintah tertentu

Hal ini membuatnya lebih mudah untuk memulai daripada membaca sekilas pohon perintah secara lengkap.
