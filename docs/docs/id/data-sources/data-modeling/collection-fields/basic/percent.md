---
title: "Persentase"
description: "Kolom persentase digunakan untuk menyimpan rasio seperti tingkat penyelesaian, tingkat diskon, dan tingkat konversi."
keywords: "persentase,percent,rasio,tingkat penyelesaian,NocoBase"
---

# Persentase

## Pengenalan

Di NocoBase, **persentase (Percent)** digunakan untuk menyimpan dan menampilkan data rasio.

Kolom persentase cocok untuk data bisnis seperti tingkat penyelesaian, tingkat diskon, tingkat konversi, dan proporsi. Pada dasarnya, kolom ini merupakan kolom numerik, tetapi tampilan dan input di halaman lebih sesuai dengan makna persentase.

Jika hanya menyimpan jumlah uang, kuantitas, atau skor biasa, [angka](./number.md) lebih sesuai.

## Skenario penggunaan

Persentase cocok untuk skenario bisnis berikut:

- Tingkat penyelesaian proyek, progres tugas
- Tingkat diskon, tarif pajak, persentase komisi
- Tingkat konversi, tingkat pencapaian, proporsi
- Bobot penilaian, persentase alokasi

## Pembuatan dan konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」, lalu pilih 「Persentase」 untuk membuat kolom persentase.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Persentase sesuai dengan `percent`, yang menentukan cara input dan tampilan di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「Tingkat penyelesaian」「Tingkat diskon」「Tingkat konversi」. Disarankan menggunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Kolom persentase biasanya menggunakan `double`, dan dapat juga menggunakan `decimal` sesuai kebutuhan presisi. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi nilai minimum, nilai maksimum, atau menentukan apakah kolom wajib diisi. |
| Description | Deskripsi kolom. Cocok digunakan untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Setelah dibuat, nama kolom akan digunakan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom persentase adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `percent`. |
| Default Field type | `double`. |
| Field type yang tersedia | `float`、`double`、`decimal`. |
| Komponen halaman | Mode edit menggunakan komponen input persentase. |
| Filter | Mendukung filter numerik, seperti lebih besar dari, lebih kecil dari, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan di blok tabel. |
| Validasi | Mendukung validasi rentang nilai, wajib diisi, dan lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom persentase. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan sebagai pemetaan kolom—memetakan kolom basis data menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama kolom yang ditampilkan di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah di formulir edit setelah kolom dibuat. |
| Field interface | Bergantung kondisi | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Bergantung kondisi | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sudah sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom persentase. Di basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya sekaligus.

Saat menghapus kolom persentase yang dibuat di basis data utama, biasanya kolom nyata di basis data beserta data yang sudah ada di dalamnya juga akan dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah kolom masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom persentase cocok digunakan dalam formulir bisnis, papan dasbor, grafik, dan laporan untuk menampilkan rasio.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan tingkat penyelesaian, tingkat diskon, tarif pajak, dan rasio lainnya. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter data rasio. |
| Blok grafik | Menampilkan indikator seperti proporsi dan tingkat konversi. |
| Alur kerja dan izin | Digunakan sebagai kolom kondisi dalam penentuan, misalnya apakah tingkat penyelesaian telah mencapai 100%. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom di tabel biasa
- [Angka](./number.md) — Menyimpan nilai numerik biasa
- [Rumus](../../../field-formula/index.md) — Menghitung hasil rasio
