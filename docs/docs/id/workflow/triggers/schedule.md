:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Tugas Terjadwal

## Pendahuluan

Tugas terjadwal adalah sebuah peristiwa yang dipicu oleh kondisi waktu, dan terbagi menjadi dua mode:

- Waktu Kustom: Pemicuan terjadwal berdasarkan waktu sistem, mirip dengan cron.
- Kolom Waktu Koleksi: Pemicuan berdasarkan nilai kolom waktu dalam sebuah **koleksi** saat waktu yang ditentukan tercapai.

Ketika sistem mencapai titik waktu (dengan akurasi hingga detik) yang memenuhi kondisi pemicu yang telah dikonfigurasi, **alur kerja** yang sesuai akan dipicu.

## Penggunaan Dasar

### Membuat Tugas Terjadwal

Saat membuat **alur kerja** di daftar **alur kerja**, pilih jenis "Tugas Terjadwal":

![Membuat tugas terjadwal](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Mode Waktu Kustom

Untuk mode reguler, Anda perlu mengonfigurasi waktu mulai ke titik waktu mana pun (dengan akurasi hingga detik). Waktu mulai dapat diatur ke waktu di masa depan atau di masa lalu. Jika diatur ke waktu di masa lalu, sistem akan memeriksa apakah waktu tersebut sudah tiba berdasarkan kondisi pengulangan yang dikonfigurasi. Apabila tidak ada kondisi pengulangan yang dikonfigurasi dan waktu mulai berada di masa lalu, **alur kerja** tidak akan lagi dipicu.

Ada dua cara untuk mengonfigurasi aturan pengulangan:

- Berdasarkan Interval: Dipicu pada interval tetap setelah waktu mulai, seperti setiap jam, setiap 30 menit, dan sebagainya.
- Mode Lanjutan: Yaitu, berdasarkan aturan cron, dapat dikonfigurasi untuk siklus yang mencapai tanggal dan waktu tetap berdasarkan aturan.

Setelah mengonfigurasi aturan pengulangan, Anda juga dapat mengonfigurasi kondisi akhir. Ini dapat diakhiri pada titik waktu tetap atau dibatasi oleh jumlah eksekusi yang telah dilakukan.

### Mode Kolom Waktu Koleksi

Menggunakan kolom waktu **koleksi** untuk menentukan waktu mulai adalah mode pemicu yang menggabungkan tugas terjadwal biasa dengan kolom waktu **koleksi**. Menggunakan mode ini dapat menyederhanakan node dalam beberapa proses spesifik dan juga lebih intuitif dalam hal konfigurasi. Misalnya, untuk mengubah status pesanan yang belum dibayar melebihi batas waktu menjadi dibatalkan, Anda cukup mengonfigurasi satu tugas terjadwal dalam mode kolom waktu **koleksi**, dengan memilih waktu mulai 30 menit setelah pesanan dibuat.

## Tips Terkait

### Tugas Terjadwal dalam Keadaan Tidak Aktif atau Mati

Jika kondisi waktu yang dikonfigurasi terpenuhi, tetapi seluruh layanan aplikasi NocoBase berada dalam keadaan tidak aktif atau mati, tugas terjadwal yang seharusnya dipicu pada titik waktu tersebut akan terlewatkan. Selain itu, setelah layanan dimulai ulang, tugas yang terlewatkan tidak akan dipicu lagi. Oleh karena itu, saat menggunakannya, Anda mungkin perlu mempertimbangkan penanganan untuk situasi tersebut atau memiliki langkah-langkah cadangan.

### Jumlah Pengulangan

Ketika kondisi akhir "berdasarkan jumlah pengulangan" dikonfigurasi, ini menghitung total jumlah eksekusi di semua versi **alur kerja** yang sama. Misalnya, jika sebuah tugas terjadwal telah dieksekusi 10 kali di versi 1, dan jumlah pengulangan juga diatur ke 10, **alur kerja** tersebut tidak akan lagi dipicu. Bahkan jika disalin ke versi baru, ia tidak akan dipicu, kecuali jika jumlah pengulangan diubah menjadi angka yang lebih besar dari 10. Namun, jika disalin sebagai **alur kerja** baru, jumlah eksekusi akan diatur ulang menjadi 0. Tanpa mengubah konfigurasi terkait, **alur kerja** baru dapat dipicu 10 kali lagi.

### Perbedaan antara Interval Waktu dan Mode Lanjutan dalam Aturan Pengulangan

Interval waktu dalam aturan pengulangan bersifat relatif terhadap waktu pemicuan terakhir (atau waktu mulai), sedangkan mode lanjutan dipicu pada titik waktu tetap. Misalnya, jika dikonfigurasi untuk dipicu setiap 30 menit, dan pemicuan terakhir adalah pada 2021-09-01 12:01:23, maka waktu pemicuan berikutnya adalah 2021-09-01 12:31:23. Sementara itu, mode lanjutan, yaitu mode cron, dikonfigurasi untuk dipicu pada titik waktu tetap. Contohnya, Anda dapat mengonfigurasinya untuk dipicu pada menit ke-01 dan ke-31 setiap jam.

## Contoh

Misalkan kita perlu memeriksa pesanan yang belum dibayar lebih dari 30 menit setelah dibuat setiap menit, dan secara otomatis mengubah statusnya menjadi dibatalkan. Kita akan mengimplementasikannya menggunakan kedua mode.

### Mode Waktu Kustom

Buat **alur kerja** berbasis tugas terjadwal. Dalam konfigurasi pemicu, pilih mode "Waktu Kustom", atur waktu mulai ke titik waktu mana pun yang tidak lebih lambat dari waktu saat ini, pilih "Setiap menit" untuk aturan pengulangan, dan biarkan kondisi akhir kosong:

![Tugas Terjadwal_Konfigurasi Pemicu_Mode Waktu Kustom](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Selanjutnya, konfigurasikan node lain sesuai dengan logika proses, hitung waktu 30 menit yang lalu, dan ubah status pesanan yang belum dibayar yang dibuat sebelum waktu tersebut menjadi dibatalkan:

![Tugas Terjadwal_Konfigurasi Pemicu_Mode Waktu Kustom](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Setelah **alur kerja** diaktifkan, ia akan dipicu sekali setiap menit mulai dari waktu mulai, menghitung waktu 30 menit yang lalu untuk memperbarui status pesanan yang dibuat sebelum titik waktu tersebut menjadi dibatalkan.

### Mode Kolom Waktu Koleksi

Buat **alur kerja** berbasis tugas terjadwal. Dalam konfigurasi pemicu, pilih mode "Kolom Waktu **Koleksi**", pilih **koleksi** "Pesanan", atur waktu mulai menjadi 30 menit setelah waktu pembuatan pesanan, dan pilih "Tidak berulang" untuk aturan pengulangan:

![Tugas Terjadwal_Konfigurasi Pemicu_Mode Kolom Waktu Koleksi_Pemicu](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Selanjutnya, konfigurasikan node lain sesuai dengan logika proses untuk memperbarui status pesanan dengan ID data pemicu dan status "belum dibayar" menjadi dibatalkan:

![Tugas Terjadwal_Konfigurasi Pemicu_Mode Kolom Waktu Koleksi_Node Pembaruan](https://static-docs.nocobase.com/491dde9df77a1fb24a4e7baa1de6eb29.png)

Berbeda dengan mode waktu kustom, di sini tidak perlu menghitung waktu 30 menit yang lalu, karena konteks data pemicu **alur kerja** sudah berisi baris data yang memenuhi kondisi waktu, sehingga Anda dapat langsung memperbarui status pesanan yang sesuai.