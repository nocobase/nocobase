---
title: "Garis"
description: "Bidang garis digunakan untuk menyimpan data spasial berbentuk garis seperti rute dan jejak."
keywords: "garis,LineString,rute,bentuk geometris,NocoBase"
---

# Garis

## Pengenalan

Di NocoBase, **garis (LineString)** digunakan untuk menyimpan data spasial berbentuk garis.

Bidang garis cocok untuk data bisnis seperti rute, jejak, saluran pipa, dan jalur inspeksi. Jika dipadukan dengan blok peta, jalur dapat ditampilkan.

Jika hanya memerlukan satu lokasi, pilih [titik](./point.md). Jika memerlukan area, pilih [poligon](./polygon.md).

## Skenario penggunaan

Garis cocok untuk skenario bisnis berikut:

- Rute pengiriman dan rute inspeksi
- Jejak kendaraan dan jejak personel
- Pipa, jalur, dan garis batas
- Hasil perencanaan jalur pada peta

## Pembuatan dan konfigurasi

Di halaman「Configure fields」pada tabel data, klik「Add field」, lalu pilih「garis」untuk membuat bidang garis.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Untuk garis adalah `lineString`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk bidang di antarmuka, misalnya「Rute pengiriman」「Jejak inspeksi」「Saluran pipa」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama pengenal bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Jenis bidang garis secara default adalah `lineString`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup dikonfigurasi sebagai wajib diisi. |
| Description | Deskripsi bidang. Dapat digunakan untuk menjelaskan makna bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang garis adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `lineString`. |
| Default Field type | `lineString`. |
| Field type opsional | `lineString`. |
| Komponen halaman | Mode pengeditan menggunakan komponen penggambaran peta. |
| Filter | Kemampuan filter spasial bergantung pada plugin peta dan kemampuan sumber data. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Pengeditan konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan bidang untuk mengedit konfigurasi bidang garis. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan bidang—memetakan bidang database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama pengenal bidang. |
| Field name | Tidak | Nama pengenal bidang biasanya tidak dapat diubah dalam formulir pengeditan setelah dibuat. |
| Field interface | Dengan syarat | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Dengan syarat | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan makna bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan tersebut memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan bidang

Klik「Delete」di sebelah kanan bidang untuk menghapus bidang garis. Di database utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang garis yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut terhapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah bidang tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang garis cocok digunakan dalam skenario jalur peta dan analisis spasial.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menggambar atau memasukkan rute. |
| Blok detail | Menampilkan rute. |
| Blok peta | Menampilkan jalur berbentuk garis pada peta. |
| Alur kerja | Berpartisipasi dalam proses sebagai data terkait rute. |

## Tautan terkait

- [Bidang](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Titik](./point.md) — Menyimpan satu lokasi
- [Poligon](./polygon.md) — Menyimpan area
