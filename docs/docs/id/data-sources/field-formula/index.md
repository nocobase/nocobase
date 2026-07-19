---
title: "Formula"
description: "Field formula digunakan untuk menghitung hasil berdasarkan field lain, seperti jumlah, skor, teks status, dan sebagainya."
keywords: "Formula,formula,field perhitungan,NocoBase"
---

# Formula

## Pendahuluan

Di NocoBase, **formula (Formula)** digunakan untuk menghitung nilai field berdasarkan ekspresi.

Field formula cocok untuk skenario seperti perhitungan jumlah, perhitungan skor, penggabungan teks, dan perhitungan bersyarat. Nilainya biasanya dihasilkan oleh ekspresi, sehingga tidak cocok untuk diisi langsung secara manual.

Jika hasilnya perlu diisi secara manual, pilih field dasar yang sesuai. Jika logika perhitungannya sangat kompleks, pertimbangkan untuk menanganinya dengan workflow atau view database.

## Skenario penggunaan

Formula cocok untuk skenario bisnis berikut:

- Subtotal jumlah pesanan dan jumlah termasuk pajak
- Skor, skor berbobot, dan skor kinerja
- Nama tampilan setelah penggabungan teks
- Hasil bisnis yang dihitung berdasarkan kondisi

## Pembuatan dan konfigurasi

Di halaman「Configure fields」pada tabel data, klik「Add field」, lalu pilih「Formula」untuk membuat field formula.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Formula sesuai dengan `formula`, yang menentukan cara field diisi dan ditampilkan di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya「Subtotal pesanan」「Skor keseluruhan」「Nama tampilan」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Setelah dibuat biasanya tidak dapat diubah, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field formula menggunakan `formula`, sedangkan jenis hasilnya bergantung pada konfigurasi formula. |
| Default value | Nilai default. Saat membuat record baru, jika pengguna tidak mengisinya, nilai default dapat diisi secara otomatis. |
| Validation rules | Aturan validasi. Hal yang utama adalah memastikan ekspresi formula lengkap dan field yang direferensikan tersedia. |
| Description | Deskripsi field. Cocok digunakan untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Setelah dibuat, nama field akan direferensikan oleh blok halaman, izin, workflow, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku default field formula adalah sebagai berikut:

| Fitur | Deskripsi |
| --- | --- |
| Default Field interface | `formula`. |
| Default Field type | `formula`. |
| Field type yang dapat dipilih | `formula`. |
| Komponen halaman | Dalam mode pengeditan biasanya dikonfigurasi dengan ekspresi formula, sedangkan dalam mode tampilan menampilkan hasil perhitungan. |
| Filter | Kemungkinan untuk memfilter bergantung pada hasil formula dan cara eksekusinya. |
| Pengurutan | Kemungkinan untuk mengurutkan bergantung pada hasil formula dan cara eksekusinya. |
| Validasi | Bergantung pada ekspresi formula dan jenis hasil. |

## Pengeditan konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan field untuk mengedit konfigurasi field formula. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dari database utama, pengeditan biasanya digunakan untuk melakukan pemetaan field—memetakan field database menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir pengeditan setelah dibuat. |
| Field interface | Dukungan bersyarat | Field dari database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian akan memengaruhi cara halaman menerima input, menampilkan, dan memvalidasi data. |
| Field type | Dukungan bersyarat | Field dari database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara field disimpan, komponen input, aturan validasi, kondisi filter, dan cara variabel workflow digunakan. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Penghapusan field

Klik「Delete」di sebelah kanan field untuk menghapus field formula. Di database utama, Anda juga dapat memilih beberapa field sekaligus untuk menghapusnya secara massal.

Saat menghapus field formula yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi direferensikan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field formula cocok digunakan untuk menampilkan hasil perhitungan dalam tabel, detail, statistik, dan workflow.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Skenario | Penggunaan |
| --- | --- |
| Konfigurasi field | Menulis ekspresi formula dan memilih field yang direferensikan. |
| Blok tabel | Menampilkan hasil perhitungan. |
| Blok detail | Menampilkan hasil perhitungan untuk satu record. |
| Workflow | Membaca hasil formula untuk digunakan dalam penilaian berikutnya. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Angka](../data-modeling/collection-fields/basic/number.md) — Menyimpan nilai numerik yang digunakan dalam perhitungan
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Menyimpan hasil terstruktur
