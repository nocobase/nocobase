---
title: "Tanggal Dibuat"
description: "Field tanggal dibuat digunakan untuk mencatat waktu pembuatan sebuah record secara otomatis."
keywords: "Tanggal Dibuat,createdAt,Field Sistem,NocoBase"
---

# Tanggal Dibuat

## Pengenalan

Di NocoBase, **Tanggal Dibuat (Created at)** digunakan untuk mencatat waktu pembuatan record secara otomatis.

Tanggal dibuat biasanya dihasilkan oleh field prasetel. Field ini cocok untuk pengurutan, pemfilteran, audit, kondisi alur kerja, dan statistik data.

Jika perlu mengisi tanggal bisnis secara manual, seperti tanggal penandatanganan kontrak atau tanggal kedaluwarsa, gunakan [Tanggal](../datetime/date.md) atau [Tanggal dan waktu](../datetime/datetime.md).

## Skenario penggunaan

Tanggal dibuat cocok untuk skenario bisnis berikut:

- Mengurutkan berdasarkan waktu pembuatan
- Memfilter data yang dibuat dalam periode tertentu
- Mengaudit waktu pembuatan record
- Menggunakan waktu pembuatan record baru sebagai kondisi alur kerja

## Konfigurasi pembuatan

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Tanggal Dibuat» untuk membuat field tanggal dibuat.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Tanggal dibuat sesuai dengan `createdAt`, yang menentukan cara field diisi dan ditampilkan pada halaman. |
| Field display name | Nama yang ditampilkan field pada antarmuka, misalnya «Tanggal Dibuat» atau «Waktu Pembuatan». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Tanggal dibuat biasanya menggunakan `date`. |
| Default value | Nilai default. Saat menambahkan record baru, jika pengguna tidak mengisinya, nilai default dapat diisi secara otomatis. |
| Validation rules | Dikelola secara otomatis oleh sistem dan biasanya tidak memerlukan validasi manual. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan dirujuk oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field tanggal dibuat adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `createdAt`. |
| Field type default | `date`. |
| Field type yang tersedia | `date`. |
| Komponen halaman | Diisi secara otomatis oleh sistem dan biasanya hanya ditampilkan sebagai baca-saja pada halaman. |
| Pemfilteran | Mendukung pemfilteran berdasarkan waktu dan rentang waktu. |
| Pengurutan | Mendukung pengurutan berdasarkan waktu. |
| Validasi | Diisi secara otomatis oleh sistem. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field tanggal dibuat. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dari database utama, pengeditan biasanya berarti melakukan pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field pada antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah di formulir pengeditan setelah field dibuat. |
| Field interface | Didukung secara kondisional | Field database utama atau field tersinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi pada halaman. |
| Field type | Didukung secara kondisional | Field database utama atau field tersinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field tanggal dibuat. Dalam database utama, Anda juga dapat mencentang beberapa field lalu menghapusnya sekaligus.

Saat menghapus field tanggal dibuat yang baru dibuat di database utama, kolom sebenarnya di database beserta data yang ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field tanggal dibuat cocok digunakan dalam daftar, detail, pemfilteran, dan audit.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok tabel | Menampilkan dan mengurutkan waktu pembuatan. |
| Blok pemfilteran | Memfilter record yang dibuat dalam periode tertentu. |
| Blok detail | Melihat waktu pembuatan record. |
| Alur kerja | Digunakan sebagai kondisi waktu untuk proses evaluasi. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Tanggal dan waktu (termasuk zona waktu)](../datetime/datetime.md) — Menyimpan waktu bisnis
- [Tanggal Diperbarui](./updated-at.md) — Mencatat waktu pembaruan secara otomatis
