---
title: "Nomor telepon"
description: "Field nomor telepon digunakan untuk menyimpan nomor ponsel, nomor kontak, dan teks terkait telepon lainnya, serta menyediakan validasi format."
keywords: "nomor telepon,phone,telepon,kontak,NocoBase"
---

# Nomor telepon

## Pengenalan

Di NocoBase, **nomor telepon (Phone)** digunakan untuk menyimpan nomor ponsel atau nomor kontak.

Field nomor telepon cocok untuk menyimpan nomor telepon pelanggan, kontak, karyawan, dan informasi kontak lainnya. Dibandingkan teks biasa, field ini lebih sesuai untuk merepresentasikan data terkait telepon.

Jika perlu menyimpan beberapa nomor telepon atau informasi kontak yang kompleks, Anda dapat menggunakan [teks multibaris](./textarea.md) atau membuat tabel kontak secara terpisah.

## Skenario penggunaan

Nomor telepon cocok untuk skenario bisnis berikut:

- Nomor ponsel pelanggan, nomor kontak
- Nomor ponsel karyawan, nomor telepon cadangan
- Nomor kontak toko, nomor layanan pelanggan
- Nomor untuk notifikasi SMS

## Pembuatan dan konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「手机号」 untuk membuat field nomor telepon.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Nomor telepon sesuai dengan `phone`, yang menentukan cara input dan tampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「手机号」, 「联系电话」, atau 「服务热线」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field nomor telepon secara default adalah `string`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Anda dapat mengonfigurasi panjang, ekspresi reguler, atau kewajiban pengisian. |
| Description | Deskripsi field. Cocok untuk menjelaskan makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku default field nomor telepon adalah sebagai berikut:

| Fitur | Keterangan |
| --- | --- |
| Default Field interface | `phone`. |
| Default Field type | `string`. |
| Field type opsional | `string`. |
| Komponen halaman | Mode edit menggunakan kotak input dan dapat dikonfigurasi dengan validasi format telepon. |
| Filter | Mendukung filter berbasis teks, seperti berisi, sama dengan, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan di blok tabel. |
| Validasi | Mendukung validasi panjang, ekspresi reguler, kewajiban pengisian, dan lainnya. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field nomor telepon. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dari database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan untuk field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir edit setelah dibuat. |
| Field interface | Didukung dalam kondisi tertentu | Field database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung dalam kondisi tertentu | Field database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field nomor telepon. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field nomor telepon yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di kolom tersebut biasanya akan ikut terhapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah field masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field nomor telepon cocok digunakan dalam skenario formulir, detail, filter, dan notifikasi.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan nomor ponsel atau nomor kontak. |
| Blok detail | Menampilkan informasi kontak. |
| Blok filter | Memfilter record berdasarkan nomor ponsel atau bagian dari nomor. |
| Alur kerja dan notifikasi | Sebagai sumber nomor untuk notifikasi SMS dan telepon. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks satu baris](./input.md) — Menyimpan teks pendek biasa
- [Email](./email.md) — Menyimpan alamat email