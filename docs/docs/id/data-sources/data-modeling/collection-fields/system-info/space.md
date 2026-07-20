---
title: "Ruang"
description: "Field ruang digunakan untuk mengidentifikasi ruang tempat suatu record berada setelah kemampuan multi-ruang diaktifkan."
keywords: "ruang,space,multi-ruang,field sistem,NocoBase"
---

# Ruang

## Pendahuluan

Di NocoBase, **ruang (Space)** digunakan untuk mencatat ruang tempat data berada.

Field ruang biasanya muncul setelah plugin multi-ruang diaktifkan, dan digunakan untuk mengisolasi data berdasarkan ruang. Field ini tidak cocok untuk diubah secara sembarangan seperti field bisnis biasa.

Jika yang dibutuhkan hanya dimensi departemen, wilayah, atau proyek dalam konteks bisnis, disarankan untuk membuat field relasi atau field opsi biasa.

## Skenario penggunaan

Ruang cocok untuk skenario bisnis berikut:

- Isolasi data multi-ruang
- Memfilter data berdasarkan ruang
- Kontrol hak akses tingkat ruang
- Kepemilikan data bisnis multi-tenant

## Pembuatan dan konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「Ruang」 untuk membuat field ruang.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Ruang sesuai dengan `space`, yang menentukan cara pengisian dan penampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「Ruang」. Disarankan menggunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, hak akses, dan workflow. Setelah dibuat biasanya tidak diubah lagi, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field ruang biasanya merupakan field relasi yang mengarah ke tabel ruang. |
| Default value | Nilai default. Saat membuat record baru, jika pengguna tidak mengisinya, nilai default dapat diisikan secara otomatis. |
| Validation rules | Biasanya dikelola oleh sistem atau konteks ruang. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan oleh blok halaman, hak akses, workflow, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field ruang adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `space`. |
| Default Field type | `belongsTo`. |
| Field type yang dapat dipilih | `belongsTo`. |
| Komponen halaman | Dikelola oleh sistem atau kemampuan multi-ruang; halaman biasanya hanya dapat dibaca atau digunakan berdasarkan konteks ruang. |
| Filter | Mendukung pemfilteran berdasarkan ruang, bergantung pada konfigurasi multi-ruang. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Dikelola oleh kemampuan multi-ruang. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan field untuk mengedit konfigurasi field ruang. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk memetakan field—memetakan field database menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah di formulir pengeditan setelah field dibuat. |
| Field interface | Tergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Tergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel workflow. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Hapus field

Klik 「Delete」 di sisi kanan field untuk menghapus field ruang. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field ruang yang dibuat di database utama, kolom aktual di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, hak akses, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field ruang cocok digunakan dalam skenario isolasi data multi-ruang dan hak akses.

| Skenario | Kegunaan |
| --- | --- |
| Blok tabel | Menampilkan ruang tempat record berada. |
| Blok filter | Memfilter record berdasarkan ruang. |
| Hak akses | Mengisolasi akses data berdasarkan ruang. |
| Workflow | Membaca ruang tempat record berada sebagai konteks. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Multi-ruang](../../../../multi-app/multi-space/index.md) — Pelajari kemampuan multi-ruang
- [Field relasi](../associations/index.md) — Membuat field relasi biasa