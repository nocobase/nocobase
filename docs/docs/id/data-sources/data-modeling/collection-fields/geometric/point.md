---
title: "Titik"
description: "Field titik digunakan untuk menyimpan lokasi geografis atau koordinat spasial."
keywords: "Titik,Point,Bentuk geometris,Peta,NocoBase"
---

# Titik

## Pengenalan

Di NocoBase, **titik (Point)** digunakan untuk menyimpan koordinat satu lokasi.

Field titik cocok untuk data spasial seperti lokasi toko, lokasi pelanggan, dan lokasi perangkat. Jika dipadukan dengan blok peta, data dapat ditampilkan di peta.

Jika ingin menyimpan rute, pilih [garis](./line.md). Jika ingin menyimpan area, pilih [poligon](./polygon.md) atau [lingkaran](./circle.md).

## Skenario penggunaan

Titik cocok untuk skenario bisnis berikut:

- Lokasi toko dan gudang
- Koordinat alamat pelanggan
- Lokasi pemasangan perangkat
- Lokasi check-in inspeksi

## Konfigurasi pembuatan

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「Titik」 untuk membuat field titik.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Titik sesuai dengan `point`, yang menentukan cara input dan tampilan di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「Lokasi toko」, 「Koordinat perangkat」, atau 「Lokasi pelanggan」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field titik secara default adalah `point`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup mengatur agar field wajib diisi. |
| Description | Deskripsi field. Dapat digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field titik adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Default Field interface | `point`. |
| Default Field type | `point`. |
| Field type yang tersedia | `point`. |
| Komponen halaman | Mode edit menggunakan komponen pemilihan peta atau koordinat. |
| Pemfilteran | Kemampuan pemfilteran spasial bergantung pada plugin peta dan kemampuan sumber data. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field titik. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel di database utama yang telah disinkronkan, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah di formulir edit setelah dibuat. |
| Field interface | Bergantung kondisi | Field dari database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Bergantung kondisi | Field dari database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Hapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field titik. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field titik yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field titik cocok digunakan dalam skenario peta dan pengelolaan lokasi.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih atau memasukkan satu lokasi. |
| Blok detail | Menampilkan koordinat lokasi atau titik pada peta. |
| Blok peta | Menampilkan titik pada peta. |
| Alur kerja | Sebagai input untuk kondisi bisnis yang berkaitan dengan lokasi. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Blok peta](../../../../interface-builder/blocks/data-blocks/map.md) — Menampilkan field geometris pada peta
- [Garis](./line.md) — Menyimpan rute
- [Poligon](./polygon.md) — Menyimpan area
