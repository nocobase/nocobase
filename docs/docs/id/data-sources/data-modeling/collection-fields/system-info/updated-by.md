---
title: "Diperbarui oleh"
description: "Field Diperbarui oleh digunakan untuk secara otomatis mencatat pengguna yang terakhir memperbarui rekaman."
keywords: "Diperbarui oleh,updatedBy,field sistem,pengguna,NocoBase"
---

# Diperbarui oleh

## Pengenalan

Di NocoBase, **Diperbarui oleh (Updated by)** digunakan untuk secara otomatis mencatat pengguna yang terakhir memperbarui rekaman.

Diperbarui oleh biasanya dibuat melalui field bawaan. Field ini cocok untuk audit, pelacakan tanggung jawab, pemfilteran, dan kondisi workflow.

Jika ingin menyatakan penanggung jawab bisnis, petugas pemrosesan, atau pemberi persetujuan, disarankan untuk membuat field relasi pengguna secara terpisah.

## Skenario penggunaan

Diperbarui oleh cocok untuk skenario bisnis berikut:

- Melihat pengguna yang terakhir memelihara data
- Memfilter rekaman berdasarkan pengguna yang memperbarui
- Mengaudit siapa yang mengubah data
- Memberi tahu pengguna yang terakhir memperbarui dalam workflow

## Membuat konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Diperbarui oleh» untuk membuat field Diperbarui oleh.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Diperbarui oleh sesuai dengan `updatedBy`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya «Diperbarui oleh» atau «Terakhir diubah oleh». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Setelah dibuat, biasanya tidak dapat diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Diperbarui oleh biasanya merupakan field relasi `belongsTo` yang merujuk ke tabel pengguna. |
| Default value | Nilai default. Saat menambahkan rekaman, jika pengguna tidak mengisinya, nilai default dapat diisi secara otomatis. |
| Validation rules | Dikelola secara otomatis oleh sistem dan biasanya tidak memerlukan validasi manual. |
| Description | Deskripsi field. Cocok untuk menuliskan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, workflow, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat field

Perilaku default field Diperbarui oleh adalah sebagai berikut:

| Sifat | Deskripsi |
| --- | --- |
| Default Field interface | `updatedBy`. |
| Default Field type | `belongsTo`. |
| Field type yang tersedia | `belongsTo`. |
| Komponen halaman | Diisi secara otomatis oleh sistem; pada halaman biasanya ditampilkan menggunakan komponen tampilan pengguna. |
| Pemfilteran | Mendukung pemfilteran berdasarkan pengguna. |
| Pengurutan | Biasanya tidak diurutkan berdasarkan pengguna yang memperbarui. |
| Validasi | Diisi secara otomatis oleh sistem. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field Diperbarui oleh. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang sudah disinkronkan dalam database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah di formulir pengeditan setelah field dibuat. |
| Field interface | Didukung secara kondisional | Field database utama atau field tersinkron dapat disesuaikan saat pemetaan field. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung secara kondisional | Field database utama atau field tersinkron dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan rekaman. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel workflow. Jika data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field Diperbarui oleh. Dalam database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field Diperbarui oleh yang dibuat di database utama, biasanya kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Menghapus field dapat memengaruhi blok halaman, formulir, pemfilteran, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field Diperbarui oleh cocok digunakan untuk audit, pemfilteran, dan workflow.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok tabel | Menampilkan pengguna yang terakhir memperbarui. |
| Blok pemfilteran | Memfilter rekaman berdasarkan pengguna yang memperbarui. |
| Blok detail | Melihat pengguna yang terakhir memelihara data. |
| Workflow | Sebagai penerima notifikasi atau field kondisi. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Dibuat oleh](./created-by.md) — Secara otomatis mencatat pengguna yang membuat data
- [Field relasi](../associations/index.md) — Membuat relasi pengguna seperti penanggung jawab bisnis
