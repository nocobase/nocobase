---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Riwayat Catatan

## Pendahuluan

Plugin **Riwayat Catatan** melacak perubahan data dengan secara otomatis menyimpan *snapshot* dan perbedaan dari operasi **buat**, **perbarui**, dan **hapus**. Ini membantu pengguna meninjau modifikasi data dengan cepat dan mengaudit aktivitas operasi.

![](https://static-docs.nocobase.com/202511011338499.png)

## Mengaktifkan Riwayat Catatan

### Menambahkan Koleksi dan *Field*

Pertama, buka halaman pengaturan plugin Riwayat Catatan untuk menambahkan koleksi dan *field* yang ingin Anda lacak riwayatnya. Untuk meningkatkan efisiensi pencatatan dan menghindari redundansi data, disarankan untuk hanya melacak *field* yang penting. *Field* seperti **ID unik**, **createdAt**, **updatedAt**, **createdBy**, dan **updatedBy** biasanya tidak perlu dicatat.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sinkronisasi *Snapshot* Data Riwayat

- Untuk catatan yang dibuat sebelum riwayat diaktifkan, perubahan hanya dapat dicatat setelah pembaruan pertama menghasilkan *snapshot*; oleh karena itu, pembaruan atau penghapusan awal tidak akan dicatat.
- Untuk mempertahankan riwayat data yang sudah ada, Anda dapat melakukan sinkronisasi *snapshot* satu kali.
- Ukuran *snapshot* per koleksi dihitung sebagai: jumlah catatan × jumlah *field* yang dilacak.
- Untuk *dataset* yang besar, disarankan untuk memfilter berdasarkan cakupan data dan hanya menyinkronkan catatan penting.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klik tombol **“Sinkronkan *Snapshot* Riwayat”**, konfigurasi *field* dan cakupan data, lalu mulai sinkronisasi.

![](https://static-docs.nocobase.com/202511011320958.png)

Tugas sinkronisasi akan diantrekan dan berjalan di latar belakang. Anda dapat menyegarkan daftar untuk memeriksa status penyelesaiannya.

## Menggunakan Blok Riwayat Catatan

### Menambahkan Blok

Pilih **Blok Riwayat Catatan** dan pilih koleksi untuk menambahkan blok riwayat yang sesuai ke halaman Anda.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Jika Anda menambahkan blok riwayat di dalam *pop-up* detail catatan, Anda dapat memilih **“Catatan Saat Ini”** untuk menampilkan riwayat yang spesifik untuk catatan tersebut.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Mengedit Templat Deskripsi

Klik **“Edit Templat”** pada pengaturan blok untuk mengonfigurasi teks deskripsi untuk catatan operasi.

![](https://static-docs.nocobase.com/202511011340406.png)

Saat ini, Anda dapat mengonfigurasi templat deskripsi secara terpisah untuk operasi **buat**, **perbarui**, dan **hapus**. Untuk operasi pembaruan, Anda juga dapat mengonfigurasi templat deskripsi untuk perubahan *field*, baik sebagai templat tunggal untuk semua *field* maupun untuk *field* tertentu secara individual.

![](https://static-docs.nocobase.com/202511011346400.png)

Variabel dapat digunakan saat mengonfigurasi teks.

![](https://static-docs.nocobase.com/202511011347163.png)

Setelah konfigurasi, Anda dapat memilih untuk menerapkan templat ke **Semua blok riwayat catatan dari koleksi saat ini** atau **Hanya blok riwayat catatan ini**.

![](https://static-docs.nocobase.com/202511011348885.png)