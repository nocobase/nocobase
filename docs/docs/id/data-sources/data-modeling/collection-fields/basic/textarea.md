---
title: "Teks multi-baris"
description: "Bidang teks multi-baris digunakan untuk menyimpan catatan, penjelasan, alamat, pendapat penanganan, dan konten teks panjang lainnya. Secara default menggunakan tipe text dan kotak input multi-baris."
keywords: "teks multi-baris,textarea,bidang teks,text,NocoBase"
---

# Teks multi-baris

## Pengenalan

Di NocoBase, **teks multi-baris (Multi-line text)** digunakan untuk menyimpan konten teks yang memerlukan baris baru atau memiliki panjang yang cukup besar.

Teks multi-baris secara default menggunakan kotak input multi-baris, sehingga cocok untuk catatan, penjelasan, pendapat penanganan, dan konten lainnya. Teks ini dapat digunakan dalam filter, izin, kondisi alur kerja, dan kueri API.

Jika konten biasanya hanya terdiri dari satu baris, seperti nama, nomor, atau judul, sebaiknya pilih [teks satu baris](./input.md). Jika konten memerlukan tata letak, gambar, atau kemampuan teks kaya, pilih bidang teks kaya atau Markdown.

## Skenario penggunaan

Teks multi-baris cocok untuk skenario bisnis berikut:

- Catatan pelanggan, catatan pesanan, pendapat penanganan tiket
- Alamat lengkap, deskripsi masalah, penjelasan kebutuhan
- Rangkuman klausul kontrak, penjelasan latar belakang proyek
- Konten teks yang perlu dimasukkan dalam beberapa baris

## Pembuatan dan konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «teks multi-baris» untuk membuat bidang teks multi-baris.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Konfigurasi | Penjelasan |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Teks multi-baris sesuai dengan `textarea`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan bidang di antarmuka, misalnya «Catatan pelanggan», «Pendapat penanganan», atau «Alamat lengkap». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Setelah dibuat biasanya tidak dapat diubah, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Teks multi-baris secara default adalah `text`, dan juga dapat dipetakan menjadi `string` atau `json` sesuai dengan bidang sumber. |
| Default value | Nilai default. Saat menambahkan rekaman, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi panjang minimum, panjang maksimum, panjang tetap, penggunaan huruf besar atau kecil, maupun ekspresi reguler. |
| Description | Deskripsi bidang. Cocok untuk menuliskan makna bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang teks multi-baris adalah sebagai berikut:

| Karakteristik | Penjelasan |
| --- | --- |
| Default Field interface | `textarea`. |
| Default Field type | `text`. |
| Field type yang tersedia | `text`, `json`, dan `string`. |
| Komponen halaman | Mode pengeditan menggunakan kotak input multi-baris. |
| Filter | Mendukung filter berbasis teks, seperti berisi, tidak berisi, kosong, tidak kosong, dan lainnya. |
| Pengurutan | Biasanya tidak disarankan untuk pengurutan. Kemampuan pengurutan bergantung pada database dan jenis bidang tertentu. |
| Validasi | Mendukung validasi panjang minimum, panjang maksimum, panjang tetap, penggunaan huruf besar atau kecil, ekspresi reguler, dan lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan bidang untuk mengedit konfigurasi bidang teks multi-baris. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan bidang—memetakan bidang database menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Penjelasan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah melalui formulir pengeditan setelah dibuat. |
| Field interface | Didukung dalam kondisi tertentu | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung dalam kondisi tertentu | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan rekaman. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan makna bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus bidang

Klik «Delete» di sebelah kanan bidang untuk menghapus bidang teks multi-baris. Di database utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang teks multi-baris yang dibuat di database utama, kolom aktual di database beserta data yang ada di dalamnya biasanya akan ikut dihapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah bidang tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang teks multi-baris cocok untuk menampilkan konten panjang dalam formulir dan detail.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan atau mengedit catatan, penjelasan, pendapat penanganan, dan konten lainnya. |
| Blok detail | Menampilkan konten teks yang panjang. |
| Blok tabel | Menampilkan ringkasan; konten yang terlalu panjang biasanya akan dipotong. |
| Alur kerja dan izin | Digunakan sebagai bidang kondisi dalam penilaian, misalnya untuk memeriksa apakah catatan kosong. |

## Tautan terkait

- [Bidang](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Teks satu baris](./input.md) — Menyimpan konten teks pendek yang panjangnya tidak lebih dari satu baris
- [Markdown](../media/markdown.md) — Menyimpan konten dengan format Markdown
- [Teks kaya](../media/rich-text.md) — Menyimpan konten dengan tata letak yang kompleks