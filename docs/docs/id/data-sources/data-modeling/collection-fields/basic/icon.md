---
title: "Ikon"
description: "Field ikon digunakan untuk menyimpan nama ikon atau konfigurasi ikon, cocok untuk penanda visual seperti kategori, menu, dan status."
keywords: "ikon,icon,field,NocoBase"
---

# Ikon

## Pengenalan

Di NocoBase, **ikon (Icon)** digunakan untuk menyimpan identitas ikon.

Field ikon cocok untuk memberikan penanda visual pada kategori, menu, status, dan entri. Field ini menyimpan nilai ikon, yang akan dirender oleh komponen ikon saat ditampilkan di halaman.

Jika ingin mengunggah gambar asli, pilih[lampiran](../media/field-attachment.md). Jika hanya ingin menyimpan deskripsi ikon, pilih[teks satu baris](./input.md).

## Skenario penggunaan

Ikon cocok untuk skenario bisnis berikut:

- Ikon menu dan ikon entri fitur
- Ikon kategori dan ikon label
- Ikon status dan ikon tingkat
- Penanda visual dalam dasbor atau kartu

## Konfigurasi pembuatan

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「ikon」 untuk membuat field ikon.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Ikon sesuai dengan `icon`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama field yang ditampilkan di antarmuka, misalnya 「Ikon menu」「Ikon kategori」「Ikon status」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identitas field yang digunakan untuk referensi internal seperti API, field relasi, permission, dan workflow. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field ikon secara default adalah `string`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat otomatis diisi jika pengguna belum mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup dikonfigurasi sebagai wajib diisi. |
| Description | Deskripsi field. Cocok untuk menuliskan makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, permission, workflow, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field ikon adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `icon`. |
| Field type default | `string`. |
| Field type yang tersedia | `string`. |
| Komponen halaman | Mode edit menggunakan komponen pemilih ikon. |
| Filter | Biasanya tidak digunakan sebagai kondisi filter utama. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field ikon. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang sudah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identitas field. |
| Field name | Tidak | Nama identitas field biasanya tidak dapat diubah di formulir edit setelah dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Perubahan akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum mengubahnya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel workflow. Jika data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan field

Klik 「Delete」 di sebelah kanan field untuk menghapus field ikon. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field ikon yang baru dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, permission, workflow, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field ikon cocok digunakan sebagai penanda visual dalam daftar, kartu, dan detail.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih ikon. |
| Blok detail | Menampilkan ikon. |
| Daftar atau kartu | Sebagai penanda visual kategori, status, atau entri. |
| Permission dan workflow | Biasanya tidak digunakan sebagai field kondisi inti. |

## Tautan terkait

- [field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [warna](./color.md) — Menyimpan penanda warna
- [lampiran](../media/field-attachment.md) — Mengunggah gambar atau file
