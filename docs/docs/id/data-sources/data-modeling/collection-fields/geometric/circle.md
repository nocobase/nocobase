---
title: "Lingkaran"
description: "Field lingkaran digunakan untuk menyimpan area yang direpresentasikan oleh titik pusat dan radius."
keywords: "Lingkaran,Circle,bentuk geometris,peta,NocoBase"
---

# Lingkaran

## Pengenalan

Di NocoBase, **lingkaran (Circle)** digunakan untuk menyimpan area berbentuk lingkaran.

Field lingkaran cocok untuk data bisnis seperti radius layanan, cakupan pengiriman, dan area cakupan toko.

Jika areanya bukan lingkaran, pilih [poligon](./polygon.md). Jika hanya memerlukan lokasi pusat, pilih [titik](./point.md).

## Skenario penggunaan

Lingkaran cocok untuk skenario bisnis berikut:

- Radius layanan toko
- Cakupan pengiriman
- Area pengaruh perangkat
- Area pencarian di sekitar titik tertentu

## Membuat konfigurasi

Pada halaman「Configure fields」di tabel data, klik「Add field」, lalu pilih「Lingkaran」untuk membuat field lingkaran.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Untuk lingkaran adalah `circle`, yang menentukan cara memasukkan dan menampilkannya di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya「Radius layanan」「Cakupan」「Area pengaruh」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field lingkaran secara default adalah `circle`. |
| Default value | Nilai default. Saat membuat record baru, nilai ini dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup mengatur agar field wajib diisi. |
| Description | Keterangan field. Cocok digunakan untuk menulis makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, workflow, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku default field lingkaran adalah sebagai berikut:

| Fitur | Keterangan |
| --- | --- |
| Field interface default | `circle`. |
| Field type default | `circle`. |
| Field type yang tersedia | `circle`. |
| Komponen halaman | Mode edit menggunakan komponen untuk menggambar pada peta. |
| Pemfilteran | Kemampuan pemfilteran spasial bergantung pada plugin peta dan kemampuan sumber data. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Mengedit konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan field untuk mengedit konfigurasi field lingkaran. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, keterangan, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dalam database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir edit setelah field dibuat. |
| Field interface | Bergantung kondisi | Field database utama atau field tersinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Bergantung kondisi | Field database utama atau field tersinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel workflow. Jika data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik「Delete」di sebelah kanan field untuk menghapus field lingkaran. Dalam database utama, Anda juga dapat memilih beberapa field lalu menghapusnya sekaligus.

Saat menghapus field lingkaran yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field yang terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, pemfilteran, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field lingkaran cocok digunakan dalam skenario area layanan dan cakupan.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menggambar area berbentuk lingkaran. |
| Blok detail | Menampilkan area berbentuk lingkaran. |
| Blok peta | Menampilkan cakupan pada peta. |
| Workflow | Berpartisipasi dalam proses sebagai data terkait area. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Titik](./point.md) — Menyimpan lokasi pusat
- [Poligon](./polygon.md) — Menyimpan area yang bukan lingkaran