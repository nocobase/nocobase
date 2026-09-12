---
title: "Teks kaya"
description: "Bidang teks kaya digunakan untuk menyimpan konten berformat yang berisi gaya, gambar, tautan, dan format lainnya."
keywords: "Teks kaya,rich text,bidang konten,NocoBase"
---

# Teks kaya

## Pendahuluan

Di NocoBase, **teks kaya (Rich text)** digunakan untuk menyimpan konten berformat.

Bidang teks kaya cocok untuk isi pengumuman, isi artikel, templat email, dokumentasi instruksi, dan konten lainnya. Penggunaannya lebih mendekati pengalaman pengeditan What You See Is What You Get (WYSIWYG).

Jika tim terbiasa menggunakan Markdown atau memerlukan format teks biasa yang lebih mudah dikontrol, pilih [Markdown](./markdown.md) atau [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Skenario penggunaan

Teks kaya cocok untuk skenario bisnis berikut:

- Isi pengumuman, isi artikel
- Templat email, templat notifikasi
- Penjelasan produk, petunjuk penggunaan
- Konten yang memerlukan gambar, tautan, dan gaya

## Pembuatan dan konfigurasi

Pada halaman「Configure fields」tabel data, klik「Add field」, lalu pilih「Teks kaya」untuk membuat bidang teks kaya.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Teks kaya menggunakan `richText`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk bidang di antarmuka, misalnya「Isi pengumuman」,「Templat email」, atau「Penjelasan produk」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat. Hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Bidang teks kaya biasanya menggunakan `text` untuk menyimpan konten. |
| Default value | Nilai default. Saat membuat record baru, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat digunakan untuk membatasi panjang atau mewajibkan pengisian. |
| Description | Deskripsi bidang. Cocok untuk menuliskan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang teks kaya adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `richText`. |
| Field type default | `text`. |
| Field type yang tersedia | `text`. |
| Komponen halaman | Mode pengeditan menggunakan editor teks kaya. |
| Pemfilteran | Mendukung pemfilteran berbasis teks, seperti berisi, kosong, dan tidak kosong. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi teks seperti panjang dan wajib diisi. |

## Edit konfigurasi

Setelah dibuat, klik「Edit」di sisi kanan bidang untuk mengedit konfigurasi bidang teks kaya. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan bidang—memetakan bidang database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah dalam formulir pengeditan setelah dibuat. |
| Field interface | Didukung secara kondisional | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara halaman melakukan input, menampilkan, dan memvalidasi data. |
| Field type | Didukung secara kondisional | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Penggantian ini memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sudah sesuai.

:::

## Hapus bidang

Klik「Delete」di sisi kanan bidang untuk menghapus bidang teks kaya. Dalam database utama, Anda juga dapat memilih beberapa bidang untuk menghapusnya secara massal.

Saat menghapus bidang teks kaya yang dibuat di database utama, biasanya kolom sebenarnya di database beserta data yang ada di dalamnya juga akan dihapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan bidang tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang teks kaya cocok digunakan dalam skenario pengeditan dan penampilan konten.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Mengedit konten teks kaya. |
| Blok detail | Menampilkan konten dalam format teks kaya. |
| Templat email atau notifikasi | Sebagai sumber isi templat. |
| Blok tabel | Menampilkan ringkasan atau konten yang disederhanakan. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Markdown](./markdown.md) — Menyimpan konten Markdown
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Menggunakan Vditor untuk mengedit Markdown