---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Koleksi SQL

## Pendahuluan

Koleksi SQL menyediakan metode yang ampuh untuk mengambil data menggunakan kueri SQL. Dengan mengekstrak bidang data melalui kueri SQL dan mengonfigurasi metadata bidang terkait, pengguna dapat memanfaatkan bidang-bidang ini seolah-olah mereka bekerja dengan tabel standar. Fitur ini sangat bermanfaat untuk skenario yang melibatkan kueri gabungan (join query) yang kompleks, analisis statistik, dan lain-lain.

## Panduan Pengguna

### Membuat Koleksi SQL Baru

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Masukkan kueri SQL Anda di kotak input yang tersedia dan klik Eksekusi (Execute). Sistem akan menganalisis kueri untuk menentukan tabel dan bidang yang terlibat, secara otomatis mengekstrak metadata bidang yang relevan dari tabel sumber.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Jika analisis sistem terhadap tabel dan bidang sumber tidak tepat, Anda dapat memilih tabel dan bidang yang sesuai secara manual untuk memastikan metadata yang benar digunakan. Mulailah dengan memilih tabel sumber, kemudian pilih bidang yang sesuai di bagian sumber bidang di bawah.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Untuk bidang yang tidak memiliki sumber langsung, sistem akan menyimpulkan tipe bidang berdasarkan tipe data. Jika kesimpulan ini tidak tepat, Anda dapat memilih tipe bidang yang benar secara manual.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Saat Anda mengonfigurasi setiap bidang, Anda dapat melihat pratinjau tampilannya di area pratinjau, memungkinkan Anda untuk melihat dampak langsung dari pengaturan Anda.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Setelah Anda menyelesaikan konfigurasi dan memastikan semuanya benar, klik tombol Konfirmasi (Confirm) di bawah kotak input SQL untuk menyelesaikan pengiriman.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Mengedit

1. Jika Anda perlu memodifikasi kueri SQL, klik tombol Edit untuk langsung mengubah pernyataan SQL dan mengonfigurasi ulang bidang sesuai kebutuhan.

2. Untuk menyesuaikan metadata bidang, gunakan opsi Konfigurasi Bidang (Configure Fields), yang memungkinkan Anda memperbarui pengaturan bidang seperti halnya pada tabel biasa.

### Sinkronisasi

Jika kueri SQL tidak berubah tetapi struktur tabel database yang mendasarinya telah dimodifikasi, Anda dapat menyinkronkan dan mengonfigurasi ulang bidang dengan memilih Konfigurasi Bidang (Configure Fields) - Sinkronkan dari Database (Sync from Database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Perbandingan Koleksi SQL dengan Tampilan Database yang Terhubung

| Tipe Template             | Paling Cocok Untuk                                                                                              | Metode Implementasi | Dukungan untuk Operasi CRUD |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------- | :------------------ | :-------------------------- |
| SQL                       | Model sederhana, kasus penggunaan ringan<br />Interaksi terbatas dengan database<br />Menghindari pemeliharaan tampilan<br />Lebih suka operasi berbasis UI | Subkueri SQL        | Tidak Didukung              |
| Terhubung ke tampilan database | Model kompleks<br />Membutuhkan interaksi database<br />Diperlukan modifikasi data<br />Membutuhkan dukungan database yang lebih kuat dan stabil | Tampilan database   | Didukung Sebagian           |

:::warning
Saat menggunakan koleksi SQL, pastikan untuk memilih tabel yang dapat dikelola dalam NocoBase. Menggunakan tabel dari database yang sama yang tidak terhubung ke NocoBase dapat menyebabkan penguraian kueri SQL yang tidak akurat. Jika ini menjadi perhatian, pertimbangkan untuk membuat dan menautkan ke tampilan (view).
:::