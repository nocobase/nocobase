---
title: "Kata sandi"
description: "Field kata sandi digunakan untuk menyimpan input berupa kata sandi, yang ditampilkan dalam bentuk tersamarkan saat dimasukkan di halaman."
keywords: "kata sandi,password,input sensitif,NocoBase"
---

# Kata sandi

## Pengenalan

Di NocoBase, **kata sandi (Password)** digunakan untuk memasukkan konten berupa kata sandi.

Field kata sandi cocok untuk menyimpan konten yang proses inputnya perlu disembunyikan, seperti kata sandi layanan eksternal atau kode akses sementara. Fokusnya adalah pada cara input dan penayangan, bukan sebagai solusi manajemen kunci yang lengkap.

Untuk menyimpan kunci yang sangat sensitif atau kredensial jangka panjang, prioritaskan evaluasi terhadap solusi enkripsi khusus, manajemen kunci, atau variabel lingkungan.

## Skenario yang sesuai

Kata sandi cocok untuk skenario bisnis berikut:

- Kata sandi sementara sistem eksternal
- Kode akses dalam konfigurasi koneksi
- Teks sensitif yang hanya memerlukan input tersamarkan
- Kode verifikasi atau kata sandi sementara dalam proses internal

## Pembuatan konfigurasi

Di halaman「Configure fields」pada tabel data, klik「Add field」, lalu pilih「Kata sandi」untuk membuat field kata sandi.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Kata sandi sesuai dengan `password`, yang menentukan cara input dan penayangannya di halaman. |
| Field display name | Nama field yang ditampilkan di antarmuka, misalnya「Kata sandi akses」「Kode sandi koneksi」「Kode sandi sementara」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field kata sandi biasanya menggunakan `password` atau `string`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat otomatis diisi jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat dikonfigurasi berdasarkan panjang, ekspresi reguler, atau status wajib diisi. |
| Description | Deskripsi field. Cocok digunakan untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field kata sandi adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Field interface default | `password`. |
| Field type default | `password`. |
| Field type yang tersedia | `password`、`string`. |
| Komponen halaman | Mode edit menggunakan kotak input kata sandi. |
| Filter | Biasanya tidak disarankan untuk digunakan sebagai kondisi filter. |
| Pengurutan | Biasanya tidak disarankan untuk pengurutan. |
| Validasi | Mendukung validasi panjang, ekspresi reguler, wajib diisi, dan lainnya. |

## Edit konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan field untuk mengedit konfigurasi field kata sandi. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dalam database utama, pengeditan biasanya dilakukan untuk memetakan field—memetakan field database menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah dalam formulir edit setelah field dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, penayangan, dan validasi di halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Hapus field

Klik「Delete」di sebelah kanan field untuk menghapus field kata sandi. Dalam database utama, beberapa field juga dapat dipilih untuk dihapus secara massal.

Saat menghapus field kata sandi yang baru dibuat di database utama, kolom sebenarnya di database beserta data yang telah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field kata sandi cocok digunakan untuk memasukkan teks sensitif dalam formulir konfigurasi.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan kode sandi melalui kotak input kata sandi. |
| Blok detail | Menampilkan data dalam bentuk tersamarkan atau terbatas. |
| Izin | Membatasi pihak yang dapat melihat atau mengedit field kata sandi. |
| Alur kerja | Gunakan dengan hati-hati sebagai parameter permintaan eksternal. |

## Link terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks satu baris](./input.md) — Menyimpan teks pendek biasa