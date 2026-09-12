---
title: "Angka"
description: "Bidang angka digunakan untuk menyimpan nilai numerik yang dapat memiliki desimal, seperti jumlah uang, berat, skor, dan luas."
keywords: "angka,number,double,decimal,NocoBase"
---

# Angka

## Pengenalan

Di NocoBase, **angka (Number)** digunakan untuk menyimpan nilai numerik yang dapat memiliki desimal.

Bidang angka cocok untuk data bisnis seperti jumlah uang, berat, luas, skor, dan harga satuan. Bidang ini dapat digunakan dalam pemfilteran, pengurutan, statistik, formula, dan kondisi alur kerja.

Jika nilainya harus berupa bilangan bulat, pilih [bilangan bulat](./integer.md) agar lebih langsung. Jika ingin menampilkannya sebagai rasio atau persentase, pilih [persentase](./percent.md).

## Skenario penggunaan

Angka cocok untuk skenario bisnis berikut:

- Jumlah pesanan, jumlah kontrak, harga satuan
- Berat, luas, volume, jarak
- Skor, koefisien, nilai sebelum diskon
- Nilai desimal yang perlu digunakan dalam statistik atau perhitungan formula

## Konfigurasi pembuatan

Pada halaman「Configure fields」tabel data, klik「Add field」lalu pilih「数字」untuk membuat bidang angka.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Angka sesuai dengan `number`, yang menentukan cara memasukkan dan menampilkan data pada halaman. |
| Field display name | Nama yang ditampilkan untuk bidang pada antarmuka, misalnya「Jumlah pesanan」「Skor」「Berat」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Secara default, bidang angka adalah `double`; untuk skenario yang memerlukan desimal presisi, seperti jumlah uang, dapat memilih `decimal`. |
| Default value | Nilai default. Saat menambahkan data, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi nilai minimum, nilai maksimum, presisi, atau menentukan apakah bidang wajib diisi. |
| Description | Deskripsi bidang. Cocok digunakan untuk menjelaskan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur bidang

Perilaku default bidang angka adalah sebagai berikut:

| Fitur | Deskripsi |
| --- | --- |
| Field interface default | `number`. |
| Field type default | `double`. |
| Field type yang tersedia | `float`、`double`、`decimal`. |
| Komponen halaman | Mode edit menggunakan kotak input angka. |
| Pemfilteran | Mendukung pemfilteran numerik seperti sama dengan, tidak sama dengan, lebih besar dari, lebih kecil dari, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan dalam blok tabel. |
| Validasi | Mendukung validasi rentang nilai, bidang wajib diisi, dan lainnya. |

## Edit konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan bidang untuk mengedit konfigurasi bidang angka. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan dalam basis data utama, pengeditan biasanya dilakukan sebagai pemetaan bidang—memetakan bidang basis data menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang pada antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah melalui formulir edit setelah dibuat. |
| Field interface | Didukung secara kondisional | Bidang basis data utama atau bidang tersinkronkan dapat disesuaikan saat pemetaan bidang. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi pada halaman. |
| Field type | Didukung secara kondisional | Bidang basis data utama atau bidang tersinkronkan dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan data baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Hapus bidang

Klik「Delete」di sebelah kanan bidang untuk menghapus bidang angka. Dalam basis data utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang angka yang dibuat di basis data utama, biasanya kolom sebenarnya di dalam basis data beserta data yang ada di kolom tersebut juga akan dihapus. Saat menghapus bidang yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Menghapus bidang dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah bidang tersebut masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang angka cocok digunakan dalam input data, statistik, diagram, dan penentuan kondisi alur kerja.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan nilai seperti jumlah uang, skor, dan berat. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter nilai numerik. |
| Blok diagram | Meringkas, menjumlahkan, atau menghitung rata-rata berdasarkan bidang numerik. |
| Bidang formula | Digunakan sebagai bidang input untuk perhitungan formula. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Bilangan bulat](./integer.md) — Menyimpan nilai tanpa desimal
- [Persentase](./percent.md) — Menyimpan rasio atau tingkat penyelesaian
- [Formula](../../../field-formula/index.md) — Menghitung hasil berdasarkan bidang angka