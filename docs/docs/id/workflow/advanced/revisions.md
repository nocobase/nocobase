:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Manajemen Versi

Setelah sebuah alur kerja yang telah dikonfigurasi terpicu setidaknya satu kali, jika Anda ingin mengubah konfigurasi alur kerja atau node di dalamnya, Anda perlu membuat versi baru sebelum melakukan perubahan. Hal ini juga memastikan bahwa saat meninjau riwayat eksekusi alur kerja yang telah terpicu sebelumnya, riwayat tersebut tidak akan terpengaruh oleh modifikasi di masa mendatang.

Pada halaman konfigurasi alur kerja, Anda dapat melihat versi alur kerja yang sudah ada dari menu versi di sudut kanan atas:

![Lihat versi alur kerja](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Pada menu tindakan lainnya ("...") di sebelah kanannya, Anda dapat memilih untuk menyalin versi yang sedang dilihat ke versi baru:

![Salin alur kerja ke versi baru](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Setelah menyalin ke versi baru, klik tombol "Aktifkan"/"Nonaktifkan" untuk mengalihkan versi yang sesuai ke status aktif, dan versi alur kerja yang baru akan berlaku.

Jika Anda perlu memilih kembali versi lama, alih ke versi tersebut dari menu versi, lalu klik kembali tombol "Aktifkan"/"Nonaktifkan" untuk mengalihkannya ke status aktif. Versi yang sedang dilihat akan berlaku, dan pemicu berikutnya akan menjalankan proses dari versi tersebut.

Saat Anda perlu menonaktifkan alur kerja, klik tombol "Aktifkan"/"Nonaktifkan" untuk mengalihkannya ke status nonaktif, dan alur kerja tersebut tidak akan lagi terpicu.

:::info{title=Tips}
Berbeda dengan "Menyalin" sebuah alur kerja dari daftar manajemen alur kerja, alur kerja yang "disalin ke versi baru" masih dikelompokkan dalam set alur kerja yang sama, hanya dibedakan berdasarkan versi. Namun, menyalin alur kerja diperlakukan sebagai alur kerja yang sepenuhnya baru, tidak terkait dengan versi alur kerja sebelumnya, dan jumlah eksekusinya juga akan diatur ulang menjadi nol.
:::