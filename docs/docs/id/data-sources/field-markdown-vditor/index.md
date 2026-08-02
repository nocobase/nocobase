---
title: "Markdown Vditor"
description: "Bidang Markdown Vditor digunakan untuk menyimpan konten Markdown melalui editor Vditor."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Pengenalan

Di NocoBase, **Markdown Vditor (Markdown Vditor)** digunakan untuk mengedit konten Markdown dengan editor Vditor.

Markdown Vditor cocok untuk konten yang memerlukan pengalaman pengeditan Markdown yang lebih lengkap, seperti isi komentar, isi basis pengetahuan, dan penjelasan solusi.

Jika hanya memerlukan pengeditan Markdown sederhana, pilih [Markdown](../data-modeling/collection-fields/media/markdown.md). Jika memerlukan pengalaman rich text WYSIWYG, pilih [Rich text](../data-modeling/collection-fields/media/rich-text.md).

## Skenario yang sesuai

Markdown Vditor cocok untuk skenario bisnis berikut:

- Isi komentar dan diskusi
- Isi basis pengetahuan dan penjelasan solusi
- Teks panjang dengan tata letak Markdown
- Konten yang memerlukan kemampuan pratinjau dan pengeditan

## Pembuatan dan konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」 lalu pilih 「Markdown Vditor」 untuk membuat bidang Markdown Vditor.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Markdown Vditor sesuai dengan `vditor`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan bidang di antarmuka, seperti 「Isi komentar」, 「Isi basis pengetahuan」, atau 「Penjelasan solusi」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Bidang Markdown Vditor biasanya menggunakan `text` untuk menyimpan konten. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi panjang atau menjadikannya wajib diisi. |
| Description | Deskripsi bidang. Cocok untuk menuliskan arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama bidang akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi akibat perubahan di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang Markdown Vditor adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `vditor`. |
| Field type default | `text`. |
| Field type yang tersedia | `text`. |
| Komponen halaman | Mode pengeditan menggunakan editor MarkdownVditor. |
| Penyaringan | Mendukung penyaringan berbasis teks, seperti berisi, kosong, dan tidak kosong. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi teks seperti panjang dan wajib diisi. |

## Pengeditan konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan bidang untuk mengedit konfigurasi bidang Markdown Vditor. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan untuk memetakan bidang—memetakan bidang basis data menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah di formulir pengeditan setelah dibuat. |
| Field interface | Dengan syarat | Bidang basis data utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Bidang basis data utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikan, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Melengkapi arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan bidang

Klik 「Delete」 di sisi kanan bidang untuk menghapus bidang Markdown Vditor. Di basis data utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang Markdown Vditor yang dibuat di basis data utama, kolom sebenarnya di basis data beserta data yang sudah ada di kolom tersebut biasanya akan dihapus secara bersamaan. Saat menghapus bidang yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah bidang tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang Markdown Vditor cocok digunakan untuk isi dan komentar yang memerlukan pengalaman pengeditan.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menggunakan Vditor untuk mengedit konten Markdown. |
| Blok detail | Merender dan menampilkan konten Markdown. |
| Blok komentar | Menyimpan isi komentar. |
| Alur kerja | Menggunakan isi sebagai konten untuk membuat notifikasi atau dokumen. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../data-source-main/general-collection.md) — Membuat dan mengelola bidang di tabel biasa
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Menyimpan konten Markdown
- [Rich text](../data-modeling/collection-fields/media/rich-text.md) — Menyimpan konten rich text
