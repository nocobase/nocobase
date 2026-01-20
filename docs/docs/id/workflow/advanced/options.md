:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Konfigurasi Lanjutan

## Mode Eksekusi

Alur kerja dieksekusi secara "asinkron" atau "sinkron", tergantung pada jenis pemicu yang dipilih saat pembuatannya. Mode asinkron berarti setelah suatu peristiwa tertentu terpicu, alur kerja akan masuk ke antrean dan dieksekusi satu per satu oleh penjadwalan latar belakang. Sementara itu, mode sinkron tidak akan masuk ke antrean penjadwalan setelah terpicu; alur kerja akan langsung mulai dieksekusi dan memberikan umpan balik segera setelah selesai.

Peristiwa koleksi, peristiwa setelah tindakan, peristiwa tindakan kustom, peristiwa tugas terjadwal, dan peristiwa persetujuan akan dieksekusi secara asinkron secara default. Sementara itu, peristiwa sebelum tindakan dieksekusi secara sinkron secara default. Peristiwa koleksi dan peristiwa formulir mendukung kedua mode tersebut, dan Anda dapat memilihnya saat membuat alur kerja:

![Mode Sinkron_Buat Alur Kerja Sinkron](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Catatan}
Karena sifatnya, alur kerja mode sinkron tidak dapat menggunakan node yang menghasilkan status "menunggu", seperti "Pemrosesan manual".
:::

## Hapus Otomatis Riwayat Eksekusi

Ketika sebuah alur kerja sering terpicu, Anda dapat mengonfigurasi penghapusan otomatis riwayat eksekusi untuk mengurangi kekacauan dan meringankan beban penyimpanan pada basis data.

Anda juga dapat mengonfigurasi apakah riwayat eksekusi alur kerja akan dihapus secara otomatis melalui jendela pop-up pembuatan dan pengeditan alur kerja:

![Konfigurasi Hapus Otomatis Riwayat Eksekusi](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Penghapusan otomatis dapat dikonfigurasi berdasarkan status hasil eksekusi. Dalam kebanyakan kasus, disarankan untuk hanya mencentang status "Selesai", sehingga catatan eksekusi yang gagal dapat dipertahankan untuk pemecahan masalah di kemudian hari.

Disarankan untuk tidak mengaktifkan penghapusan otomatis riwayat eksekusi saat melakukan debug alur kerja, agar Anda dapat menggunakan riwayat tersebut untuk memeriksa apakah logika eksekusi alur kerja sudah sesuai dengan yang diharapkan.

:::info{title=Catatan}
Menghapus riwayat alur kerja tidak akan mengurangi jumlah eksekusi alur kerja yang telah dilakukan.
:::