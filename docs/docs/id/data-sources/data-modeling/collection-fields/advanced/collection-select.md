---
title: "Pemilih tabel data"
description: "Field pemilih tabel data digunakan untuk memilih tabel data di NocoBase."
keywords: "Pemilih tabel data,collection select,Collection,NocoBase"
---

# Pemilih tabel data

## Pengenalan

Di NocoBase, **pemilih tabel data (Collection select)** digunakan untuk memilih satu atau beberapa tabel data.

Pemilih tabel data cocok untuk skenario seperti konfigurasi plugin, konfigurasi aturan, dan manajemen metadata. Yang disimpan adalah identitas tabel data, bukan record bisnis.

Jika ingin memilih record dari tabel tertentu, sebaiknya gunakan field relasi, bukan pemilih tabel data.

## Skenario yang sesuai

Pemilih tabel data cocok untuk skenario bisnis berikut:

- Memilih tabel data yang menjadi target dalam konfigurasi plugin
- Menentukan cakupan tabel data dalam konfigurasi aturan
- Manajemen metadata dan konfigurasi templat
- Konfigurasi fitur yang perlu merujuk pada identitas Collection

## Membuat konfigurasi

Pada halaman 「Configure fields」 tabel data, klik 「Add field」, lalu pilih 「Pemilih tabel data」 untuk membuat field pemilih tabel data.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Pemilih tabel data terkait dengan `collectionSelect`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya 「Tabel data target」「Tabel data tujuan」「Cakupan data」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identitas field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Setelah dibuat biasanya tidak diubah lagi, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Pemilih tabel data biasanya menyimpan identitas tabel data, sedangkan jenis penyimpanannya bergantung pada konfigurasi aktual. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur apakah field wajib diisi atau menentukan rentang pilihan. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama field akan dirujuk oleh blok halaman, izin, workflow, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field pemilih tabel data adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Default Field interface | `collectionSelect`. |
| Default Field type | `string`. |
| Field type yang dapat dipilih | `string`、`json`, sesuai dengan konfigurasi aktual. |
| Komponen halaman | Mode edit menggunakan komponen pemilih tabel data. |
| Filter | Biasanya tidak digunakan sebagai field filter bisnis. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan field untuk mengedit konfigurasi field pemilih tabel data. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identitas field. |
| Field name | Tidak | Nama identitas field biasanya tidak dapat diubah melalui formulir pengeditan setelah dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel workflow. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik 「Delete」 di sisi kanan field untuk menghapus field pemilih tabel data. Di database utama, Anda juga dapat mencentang beberapa field lalu menghapusnya sekaligus.

Saat menghapus field pemilih tabel data yang baru dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Pemilih tabel data cocok digunakan dalam formulir konfigurasi.

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memilih satu atau beberapa tabel data. |
| Blok detail | Menampilkan tabel data yang telah dipilih. |
| Konfigurasi plugin | Menentukan cakupan tabel data yang menjadi target fitur. |
| Workflow atau aturan | Berpartisipasi dalam logika sebagai konfigurasi metadata. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field di tabel biasa
- [Tabel biasa](../../../data-source-main/general-collection.md) — Memahami cara menggunakan Collection
- [Field relasi](../associations/index.md) — Memilih record dalam tabel tertentu
