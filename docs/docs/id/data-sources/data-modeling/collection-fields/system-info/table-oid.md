---
title: "Identitas tabel data"
description: "Kolom identitas tabel data digunakan untuk mengidentifikasi tabel data tempat suatu record berada, dan umum digunakan dalam skenario seperti tabel pewarisan yang perlu membedakan tabel sumber."
keywords: "identitas tabel data,table oid,tableoid,kolom sistem,NocoBase"
---

# Identitas tabel data

## Pengenalan

Di NocoBase, **identitas tabel data (Table OID)** digunakan untuk mengidentifikasi tabel data tempat suatu record berada.

Identitas tabel data umum digunakan pada tabel pewarisan atau skenario yang perlu membedakan Collection sumber record. Kolom ini lebih banyak digunakan oleh kemampuan sistem dan metadata.

Tabel bisnis biasa umumnya tidak perlu membuat kolom identitas tabel data secara manual.

## Skenario penggunaan

Identitas tabel data cocok untuk skenario bisnis berikut:

- Identifikasi sumber record pada tabel pewarisan
- Agregasi dan tampilan lintas tabel turunan
- Konfigurasi metadata
- Kemampuan sistem yang perlu membedakan sumber Collection

## Pembuatan dan konfigurasi

Pada halaman「Configure fields」di tabel data, klik「Add field」, lalu pilih「Identitas tabel data」untuk membuat kolom identitas tabel data.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Identitas tabel data对应 `tableoid`, yang menentukan cara pengisian dan penampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya「Identitas tabel data」「Tabel sumber」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak diubah lagi. Hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Identitas tabel data biasanya merupakan kolom `virtual`. |
| Default value | Nilai default. Saat membuat record baru, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Biasanya dikelola oleh sistem. |
| Description | Keterangan kolom. Cocok digunakan untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat kolom

Perilaku default kolom identitas tabel data adalah sebagai berikut:

| Sifat | Keterangan |
| --- | --- |
| Default Field interface | `tableoid`. |
| Default Field type | `virtual`. |
| Field type yang tersedia | `virtual`. |
| Komponen halaman | Halaman biasanya menampilkannya sebagai pilihan tabel data atau tampilan hanya-baca. |
| Penyaringan | Dapat digunakan untuk menyaring berdasarkan tabel data sumber, bergantung pada konfigurasi halaman. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Dikelola oleh sistem atau kemampuan metadata. |

## Mengedit konfigurasi

Setelah dibuat, klik「Edit」di sisi kanan kolom untuk mengedit konfigurasi kolom identitas tabel data. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, keterangan, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan kolom—memetakan kolom database ke Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan untuk kolom di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah melalui formulir pengeditan setelah kolom dibuat. |
| Field interface | Dengan syarat | Field dari database utama atau field tersinkronkan dapat disesuaikan saat pemetaan kolom. Penyesuaian ini memengaruhi cara penginputan, penampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Field dari database utama atau field tersinkronkan dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik「Delete」di sisi kanan kolom untuk menghapus kolom identitas tabel data. Di database utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom identitas tabel data yang dibuat di database utama, kolom nyata di database beserta data yang sudah ada di dalamnya biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah kolom tersebut masih direferensikan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom identitas tabel data cocok digunakan dalam skenario tabel pewarisan dan metadata.

| Skenario | Kegunaan |
| --- | --- |
| Blok tabel | Menampilkan tabel data sumber record. |
| Blok penyaringan | Menyaring berdasarkan tabel data sumber. |
| Izin dan alur kerja | Digunakan sebagai kondisi untuk menentukan tabel sumber. |
| Kemampuan metadata | Mengidentifikasi Collection tempat record berada. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Tabel pewarisan](../../../data-source-main/inheritance-collection.md) — Pelajari cara menggunakan tabel pewarisan
- [Pemilih tabel data](../advanced/collection-select.md) — Memilih tabel data