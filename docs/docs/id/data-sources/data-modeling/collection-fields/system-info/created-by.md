---
title: "Pembuat"
description: "Field pembuat digunakan untuk mencatat pengguna yang membuat suatu record secara otomatis."
keywords: "Pembuat,createdBy,field sistem,pengguna,NocoBase"
---

# Pembuat

## Pengenalan

Di NocoBase, **Pembuat (Created by)** digunakan untuk mencatat pembuat record secara otomatis.

Field pembuat biasanya dibuat melalui field bawaan. Field ini cocok untuk pengaturan izin, pelacakan tanggung jawab, penyaringan, dan audit.

Jika ingin menyatakan penanggung jawab bisnis, pelaksana, atau pemberi persetujuan, sebaiknya buat field relasi pengguna secara terpisah dan jangan mencampurnya dengan field pembuat.

## Skenario penggunaan

Field pembuat cocok untuk skenario bisnis berikut:

- Hanya melihat data yang saya buat
- Menyaring record berdasarkan pembuat
- Mengaudit tanggung jawab pembuatan record
- Menentukan pembuat record dalam alur kerja

## Konfigurasi pembuatan

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「Pembuat」 untuk membuat field pembuat.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Pembuat sesuai dengan `createdBy`, yang menentukan cara input dan tampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「Pembuat」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Setelah dibuat, nama ini biasanya tidak diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field pembuat biasanya merupakan field relasi `belongsTo` yang mengarah ke tabel pengguna. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Dikelola secara otomatis oleh sistem dan biasanya tidak memerlukan validasi manual. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field pembuat adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `createdBy`. |
| Default Field type | `belongsTo`. |
| Field type yang tersedia | `belongsTo`. |
| Komponen halaman | Diisi secara otomatis oleh sistem; pada halaman biasanya ditampilkan menggunakan komponen pemilihan atau tampilan pengguna. |
| Penyaringan | Mendukung penyaringan berdasarkan pengguna. |
| Pengurutan | Biasanya tidak diurutkan berdasarkan pembuat. |
| Validasi | Diisi secara otomatis oleh sistem. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan field untuk mengedit konfigurasi field pembuat. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya berarti melakukan pemetaan field—memetakan field database ke Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan untuk field di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir pengeditan setelah field dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara field disimpan, komponen input, aturan validasi, kondisi penyaringan, serta cara variabel digunakan dalam alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Hapus field

Klik 「Delete」 di sisi kanan field untuk menghapus field pembuat. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field pembuat yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field pembuat cocok digunakan dalam izin, penyaringan, audit, dan alur kerja.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok tabel | Menampilkan pembuat. |
| Blok penyaringan | Menyaring record berdasarkan pembuat. |
| Izin | Mengonfigurasi aturan seperti “hanya melihat data yang saya buat”. |
| Alur kerja | Mendapatkan pembuat lalu mengirim notifikasi atau menetapkan kondisi. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Pengubah terakhir](./updated-by.md) — Mencatat pengguna yang terakhir memperbarui secara otomatis
- [Field relasi](../associations/index.md) — Membuat relasi pengguna seperti penanggung jawab bisnis
