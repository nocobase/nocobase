:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Prosedur Pemeliharaan

## Memulai Aplikasi untuk Pertama Kali

Saat memulai aplikasi untuk pertama kali, jalankan salah satu node terlebih dahulu. Setelah **plugin** selesai diinstal dan diaktifkan, barulah jalankan node lainnya.

## Peningkatan Versi

Saat Anda perlu meningkatkan versi NocoBase, ikuti prosedur ini.

:::warning{title=Perhatian}
Di **lingkungan produksi** klaster, fitur seperti manajemen **plugin** dan peningkatan versi harus digunakan dengan hati-hati atau dilarang.

NocoBase saat ini belum mendukung peningkatan versi online untuk klaster. Untuk memastikan konsistensi data, layanan eksternal perlu dihentikan sementara selama proses peningkatan.
:::

Langkah-langkah:

1.  Hentikan Layanan Saat Ini

    Hentikan semua instans aplikasi NocoBase dan alihkan lalu lintas load balancer ke halaman status 503.

2.  Cadangkan Data

    Sebelum melakukan peningkatan, sangat disarankan untuk mencadangkan data database guna mencegah masalah selama proses peningkatan.

3.  Perbarui Versi

    Lihat [Peningkatan Docker](../get-started/upgrading/docker) untuk memperbarui versi image aplikasi NocoBase.

4.  Mulai Layanan

    1.  Mulai satu node di klaster dan tunggu hingga pembaruan selesai serta node berhasil dijalankan.
    2.  Verifikasi fungsionalitas sudah benar. Jika ada masalah yang tidak dapat diselesaikan melalui pemecahan masalah, Anda dapat mengembalikan ke versi sebelumnya.
    3.  Mulai node lainnya.
    4.  Alihkan lalu lintas load balancer ke klaster aplikasi.

## Pemeliharaan Dalam Aplikasi

Pemeliharaan dalam aplikasi mengacu pada pelaksanaan operasi terkait pemeliharaan saat aplikasi sedang berjalan, termasuk:

*   Manajemen **plugin** (menginstal, mengaktifkan, menonaktifkan **plugin**, dll.)
*   Pencadangan & Pemulihan
*   Manajemen Migrasi Lingkungan

Langkah-langkah:

1.  Kurangi Jumlah Node

    Kurangi jumlah node aplikasi yang berjalan di klaster menjadi 1, dan hentikan layanan pada node lainnya.

2.  Lakukan operasi pemeliharaan dalam aplikasi, seperti menginstal dan mengaktifkan **plugin**, mencadangkan data, dll.

3.  Pulihkan Node

    Setelah operasi pemeliharaan selesai dan fungsionalitas diverifikasi, mulai node lainnya. Setelah node berhasil dijalankan, pulihkan status operasional klaster.