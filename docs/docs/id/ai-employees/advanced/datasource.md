---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Tingkat Lanjut

## Pendahuluan

Dalam **plugin** Karyawan AI, Anda dapat mengonfigurasi **sumber data** dan mengatur beberapa kueri **koleksi** sebelumnya. Kueri ini kemudian akan dikirim sebagai konteks aplikasi saat Anda berinteraksi dengan Karyawan AI, yang akan memberikan jawaban berdasarkan hasil kueri **koleksi** tersebut.

## Konfigurasi Sumber Data

Buka halaman konfigurasi **plugin** Karyawan AI, lalu klik tab `Data source` untuk masuk ke halaman manajemen **sumber data** Karyawan AI.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Klik tombol `Add data source` untuk masuk ke halaman pembuatan **sumber data**.

Langkah pertama, masukkan informasi dasar `Collection` (**koleksi**):
- Pada kolom input `Title`, masukkan nama yang mudah diingat untuk **sumber data**;
- Pada kolom input `Collection`, pilih **sumber data** dan **koleksi** yang akan digunakan;
- Pada kolom input `Description`, masukkan informasi deskripsi untuk **sumber data** tersebut.
- Pada kolom input `Limit`, masukkan batas jumlah kueri untuk **sumber data** guna menghindari pengembalian data yang terlalu banyak sehingga melebihi konteks percakapan AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Langkah kedua, pilih kolom (field) yang akan dikueri:

Pada daftar `Fields`, centang kolom (field) yang ingin Anda kueri.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Langkah ketiga, atur kondisi kueri:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Langkah keempat, atur kondisi pengurutan:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Terakhir, sebelum menyimpan **sumber data**, Anda dapat melihat pratinjau hasil kueri **sumber data** tersebut.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Mengirim Sumber Data dalam Percakapan

Pada kotak dialog Karyawan AI, klik tombol `Add work context` di pojok kiri bawah, lalu pilih `Data source`. Anda akan melihat **sumber data** yang baru saja Anda tambahkan.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Centang **sumber data** yang ingin Anda kirim. **Sumber data** yang dipilih akan dilampirkan pada kotak dialog.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Setelah Anda memasukkan pertanyaan, sama seperti mengirim pesan biasa, klik tombol kirim. Karyawan AI akan membalas berdasarkan **sumber data** yang diberikan.

**Sumber data** juga akan muncul dalam daftar pesan.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Catatan

**Sumber data** akan secara otomatis memfilter data berdasarkan izin ACL pengguna saat ini, hanya menampilkan data yang memiliki akses oleh pengguna.