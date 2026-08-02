---
title: "Warna"
description: "Kolom warna digunakan untuk menyimpan nilai warna, cocok untuk status, klasifikasi, label, dan konfigurasi tampilan."
keywords: "warna,color,kolom,NocoBase"
---

# Warna

## Pengenalan

Di NocoBase, **warna (Color)** digunakan untuk menyimpan nilai warna.

Kolom warna cocok untuk menyimpan warna pada klasifikasi, label, status, grafik, atau konfigurasi tampilan. Kolom ini biasanya menyimpan nilai warna heksadesimal atau format warna yang didukung komponen.

Jika warna hanya merupakan bagian dari kolom pilihan, warna dapat langsung dikonfigurasi di kolom pilihan tanpa perlu membuat kolom warna secara terpisah.

## Skenario yang sesuai

Kolom warna cocok untuk skenario bisnis berikut:

- warna tingkat pelanggan, warna status
- warna label, warna klasifikasi
- warna seri grafik
- konfigurasi tampilan halaman atau kartu

## Membuat konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「warna」 untuk membuat kolom warna.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Warna sesuai dengan `color`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan kolom di antarmuka, misalnya 「warna status」「warna label」「warna grafik」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Setelah dibuat biasanya tidak diubah lagi, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Kolom warna secara default adalah `string`. |
| Default value | Nilai default. Saat menambahkan catatan baru, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup mengatur kolom sebagai wajib diisi. |
| Description | Deskripsi kolom. Dapat digunakan untuk menjelaskan arti kolom, persyaratan pengisian, sumber data, atau pihak yang bertanggung jawab atas pemeliharaannya. |

:::warning Perhatian

Nama kolom akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom warna adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `color`. |
| Default Field type | `string`. |
| Field type yang dapat dipilih | `string`. |
| Komponen halaman | Mode pengeditan menggunakan komponen pemilih warna. |
| Pemfilteran | Dapat memfilter berdasarkan nilai warna, tetapi biasanya bukan kriteria utama dalam pencarian. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom warna. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel di basis data utama yang telah disinkronkan, pengeditan biasanya dilakukan untuk pemetaan kolom—memetakan kolom basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah di formulir pengeditan setelah kolom dibuat. |
| Field interface | Dukungan bersyarat | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara halaman menerima input, menampilkan, dan memvalidasi data. |
| Field type | Dukungan bersyarat | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi arti kolom, persyaratan pengisian, sumber data, atau pihak yang bertanggung jawab atas pemeliharaannya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara kolom disimpan, komponen input, aturan validasi, kondisi pemfilteran, dan cara variabel digunakan dalam alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom warna. Di basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom warna yang dibuat di basis data utama, kolom nyata di basis data beserta data yang ada di dalamnya biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Menghapus kolom dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan kolom tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom warna cocok digunakan dalam skenario tampilan dan konfigurasi halaman.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih nilai warna. |
| Blok detail | Menampilkan warna. |
| Daftar atau kartu | Sebagai penanda visual untuk status, label, atau klasifikasi. |
| Grafik | Sebagai sumber konfigurasi warna. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom di tabel biasa
- [Ikon](./icon.md) — Menyimpan identifikasi ikon
- [Pilihan tunggal dropdown](../choices/select.md) — Mengonfigurasi warna langsung dalam pilihan
