---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Penerapan di UI

## Izin Blok Data

Visibilitas blok data dalam sebuah koleksi dikendalikan oleh izin operasi "Lihat", dengan konfigurasi individual memiliki prioritas lebih tinggi daripada pengaturan global.

Sebagai contoh, di bawah izin global, peran "admin" memiliki akses penuh, tetapi koleksi Pesanan mungkin memiliki konfigurasi izin individual yang membuatnya tidak terlihat.

Konfigurasi izin global:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Konfigurasi izin individual koleksi Pesanan:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Di UI, semua blok dalam koleksi Pesanan tidak ditampilkan.

Proses konfigurasi lengkap:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Izin Kolom

**Lihat**: Menentukan apakah kolom tertentu terlihat di tingkat kolom, memungkinkan kontrol atas kolom mana yang terlihat oleh peran tertentu dalam koleksi Pesanan.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Di UI, hanya kolom dengan izin yang dikonfigurasi yang terlihat dalam blok koleksi Pesanan. Kolom sistem (Id, CreatedAt, LastUpdatedAt) tetap memiliki izin "Lihat" meskipun tanpa konfigurasi khusus.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Edit**: Mengontrol apakah kolom dapat diedit dan disimpan (diperbarui).

  Konfigurasikan izin edit untuk kolom koleksi Pesanan (kuantitas dan item terkait memiliki izin edit):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  Di UI, hanya kolom dengan izin edit yang ditampilkan dalam blok formulir operasi edit di dalam koleksi Pesanan.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Proses konfigurasi lengkap:

  ![](https://static-docs.nocobase.com/1dbe559a957c2e052e194e50edc74a7.gif)

- **Tambah**: Menentukan apakah kolom dapat ditambahkan (dibuat).

  Konfigurasikan izin tambah untuk kolom koleksi Pesanan (nomor pesanan, kuantitas, item, dan pengiriman memiliki izin tambah):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Di UI, hanya kolom dengan izin tambah yang ditampilkan dalam blok formulir operasi tambah dari koleksi Pesanan.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Ekspor**: Mengontrol apakah kolom dapat diekspor.
- **Impor**: Mengontrol apakah kolom mendukung impor.

## Izin Operasi

Izin yang dikonfigurasi secara individual memiliki prioritas tertinggi. Jika izin spesifik dikonfigurasi, izin tersebut akan menimpa pengaturan global; jika tidak, pengaturan global akan diterapkan.

- **Tambah**: Mengontrol apakah tombol operasi tambah terlihat dalam sebuah blok.

  Konfigurasikan izin operasi individual untuk koleksi Pesanan agar memungkinkan penambahan:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Ketika operasi tambah diizinkan, tombol tambah akan muncul di area operasi blok koleksi Pesanan di UI.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Lihat**: Menentukan apakah blok data terlihat.

  Konfigurasi izin global (tanpa izin lihat):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Konfigurasi izin individual koleksi Pesanan:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Di UI, blok data untuk semua koleksi lain tetap tersembunyi, tetapi blok koleksi Pesanan ditampilkan.

  Proses konfigurasi contoh lengkap:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Edit**: Mengontrol apakah tombol operasi edit ditampilkan dalam sebuah blok.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Izin operasi dapat disempurnakan lebih lanjut dengan mengatur cakupan data.

  Sebagai contoh, mengatur koleksi Pesanan agar pengguna hanya dapat mengedit data mereka sendiri:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Hapus**: Mengontrol apakah tombol operasi hapus terlihat dalam sebuah blok.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Ekspor**: Mengontrol apakah tombol operasi ekspor terlihat dalam sebuah blok.

- **Impor**: Mengontrol apakah tombol operasi impor terlihat dalam sebuah blok.

## Izin Relasi

### Sebagai Kolom

- Izin untuk kolom relasi dikendalikan oleh izin kolom dari koleksi sumber. Ini mengontrol apakah seluruh komponen kolom relasi ditampilkan.

Sebagai contoh, dalam koleksi Pesanan, kolom relasi "Pelanggan" hanya memiliki izin lihat, impor, dan ekspor.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Di UI, ini berarti kolom relasi "Pelanggan" tidak akan ditampilkan dalam blok operasi tambah dan edit dari koleksi Pesanan.

Proses konfigurasi contoh lengkap:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Izin untuk kolom di dalam komponen kolom relasi (seperti sub-tabel atau sub-formulir) ditentukan oleh izin koleksi target.

Ketika komponen kolom relasi adalah sub-formulir:

Seperti yang ditunjukkan di bawah, kolom relasi "Pelanggan" dalam koleksi Pesanan memiliki semua izin, sementara koleksi Pelanggan itu sendiri diatur sebagai hanya-baca.

Konfigurasi izin individual untuk koleksi Pesanan, di mana kolom relasi "Pelanggan" memiliki semua izin kolom:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Konfigurasi izin individual untuk koleksi Pelanggan, di mana kolom hanya memiliki izin lihat:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Di UI, kolom relasi "Pelanggan" terlihat dalam blok koleksi Pesanan. Namun, ketika beralih ke sub-formulir, kolom di dalam sub-formulir terlihat dalam tampilan detail tetapi tidak ditampilkan dalam operasi tambah dan edit.

Proses konfigurasi contoh lengkap:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Untuk mengontrol lebih lanjut izin untuk kolom di dalam sub-formulir, Anda dapat memberikan izin kepada kolom individual.

Seperti yang ditunjukkan, koleksi Pelanggan dikonfigurasi dengan izin kolom individual (Nama Pelanggan tidak terlihat dan tidak dapat diedit).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Proses konfigurasi contoh lengkap:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Ketika komponen kolom relasi adalah sub-tabel, situasinya konsisten dengan sub-formulir:

Seperti yang ditunjukkan, kolom relasi "Pengiriman" dalam koleksi Pesanan memiliki semua izin, sementara koleksi Pengiriman diatur sebagai hanya-baca.

Di UI, kolom relasi ini terlihat. Namun, ketika beralih ke sub-tabel, kolom di dalam sub-tabel terlihat dalam operasi lihat tetapi tidak dalam operasi tambah dan edit.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Untuk mengontrol lebih lanjut izin untuk kolom di dalam sub-tabel, Anda dapat memberikan izin kepada kolom individual:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Sebagai Blok

- Visibilitas blok relasi dikendalikan oleh izin koleksi target dari kolom relasi yang sesuai, dan tidak bergantung pada izin kolom relasi itu sendiri.

Sebagai contoh, apakah blok relasi "Pelanggan" ditampilkan dikendalikan oleh izin koleksi Pelanggan.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Kolom di dalam blok relasi dikendalikan oleh izin kolom dalam koleksi target.

Seperti yang ditunjukkan, Anda dapat mengatur izin lihat untuk kolom individual dalam koleksi Pelanggan.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)