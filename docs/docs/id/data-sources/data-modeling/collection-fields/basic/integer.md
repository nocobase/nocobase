---
title: "Bilangan bulat"
description: "Field bilangan bulat digunakan untuk menyimpan nilai tanpa desimal seperti jumlah barang, jumlah orang, frekuensi, dan jumlah hari."
keywords: "bilangan bulat,integer,field angka,NocoBase"
---

# Bilangan bulat

## Pengenalan

Di NocoBase, **bilangan bulat (Integer)** digunakan untuk menyimpan nilai tanpa desimal.

Field bilangan bulat cocok untuk data bisnis seperti jumlah, frekuensi, jumlah orang, dan nomor urut. Field ini dapat digunakan dalam pemfilteran, pengurutan, statistik, izin, dan kondisi alur kerja.

Jika perlu menyimpan desimal, jumlah uang, berat, atau rasio, [angka](./number.md) atau [persentase](./percent.md) lebih sesuai.

## Skenario penggunaan

Bilangan bulat cocok untuk skenario bisnis berikut:

- Jumlah produk, jumlah stok, jumlah pembelian
- Jumlah peserta, kuota tersisa, statistik frekuensi
- Jumlah hari pengerjaan, jumlah hari keterlambatan, jumlah hari periode pembayaran
- Kode bilangan bulat dalam sistem eksternal

## Pembuatan dan konfigurasi

Di halaman「Configure fields」pada tabel data, klik「Add field」lalu pilih「整数」untuk membuat field bilangan bulat.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Bilangan bulat对应 `integer`, yang menentukan cara memasukkan dan menampilkannya di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya「Jumlah」「Jumlah orang」「Jumlah hari keterlambatan」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Setelah dibuat biasanya tidak diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Tipe field pada lapisan data. Field bilangan bulat secara default adalah `integer`, sedangkan bilangan bulat dalam rentang besar dapat menggunakan `bigInt`. |
| Default value | Nilai default. Saat menambahkan data baru, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi nilai minimum, nilai maksimum, atau menentukan apakah field wajib diisi. |
| Description | Deskripsi field. Cocok digunakan untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field bilangan bulat adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `integer`. |
| Field type default | `integer`. |
| Field type yang tersedia | `integer`、`bigInt`. |
| Komponen halaman | Mode pengeditan menggunakan kotak input angka. |
| Pemfilteran | Mendukung pemfilteran numerik seperti sama dengan, tidak sama dengan, lebih besar dari, lebih kecil dari, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan di blok tabel. |
| Validasi | Mendukung validasi numerik seperti nilai minimum, nilai maksimum, dan wajib diisi. |

## Pengeditan konfigurasi

Setelah dibuat, klik「Edit」di sisi kanan field untuk mengedit konfigurasi field bilangan bulat. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir pengeditan setelah field dibuat. |
| Field interface | Didukung secara kondisional | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung secara kondisional | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan data baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan field

Klik「Delete」di sisi kanan field untuk menghapus field bilangan bulat. Di database utama, beberapa field juga dapat dipilih lalu dihapus secara massal.

Saat menghapus field bilangan bulat yang dibuat di database utama, biasanya kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field bilangan bulat cocok digunakan dalam tabel, formulir, statistik, dan alur kerja.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memasukkan jumlah, frekuensi, jumlah hari, dan nilai lain tanpa desimal. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter bilangan bulat. |
| Blok grafik | Membuat statistik berdasarkan field seperti jumlah dan frekuensi. |
| Alur kerja dan izin | Digunakan sebagai field kondisi untuk melakukan pemeriksaan, misalnya apakah jumlah lebih besar dari 0. |

## Tautan terkait

- [field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [angka](./number.md) — Menyimpan nilai desimal, jumlah uang, berat, dan lainnya
- [persentase](./percent.md) — Menyimpan rasio atau tingkat penyelesaian