---
title: "Markdown"
description: "Kolom Markdown digunakan untuk menyimpan konten teks dengan sintaks Markdown."
keywords: "Markdown,markdown,kolom konten,NocoBase"
---

# Markdown

## Pendahuluan

Di NocoBase, **Markdown（Markdown）** digunakan untuk menyimpan konten dalam format Markdown.

Kolom Markdown cocok untuk dokumentasi, solusi penanganan, isi basis pengetahuan, catatan perubahan, dan konten lainnya. Kolom ini menyimpan teks, yang akan dirender dalam format Markdown saat ditampilkan di halaman.

Jika memerlukan pengalaman pengeditan secara langsung seperti yang terlihat, Anda dapat memilih [teks kaya](./rich-text.md) atau [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Skenario penggunaan

Markdown cocok untuk skenario bisnis berikut:

- Isi basis pengetahuan dan dokumentasi
- S solusi penanganan dan catatan pemecahan masalah
- Catatan rilis dan catatan perubahan
- Konten teks panjang yang memerlukan pemformatan ringan

## Membuat konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」 lalu pilih 「Markdown」 untuk membuat kolom Markdown.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Markdown sesuai dengan `markdown`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan kolom di antarmuka, misalnya 「Dokumentasi」「Solusi penanganan」「Isi」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Kolom Markdown biasanya menggunakan `text` untuk menyimpan konten. |
| Default value | Nilai default. Saat membuat record baru, nilai default dapat otomatis diisi jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi panjang atau mewajibkan pengisian. |
| Description | Deskripsi kolom. Cocok untuk menulis arti kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur kolom

Perilaku default kolom Markdown adalah sebagai berikut:

| Fitur | Keterangan |
| --- | --- |
| Field interface default | `markdown`. |
| Field type default | `text`. |
| Field type yang dapat dipilih | `text`、`string`, sesuai dengan konfigurasi kolom aktual. |
| Komponen halaman | Mode edit menggunakan komponen editor Markdown. |
| Filter | Mendukung filter berbasis teks, seperti berisi, kosong, dan tidak kosong. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi teks seperti panjang dan wajib diisi. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom Markdown. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel di basis data utama yang telah disinkronkan, pengeditan biasanya dilakukan sebagai pemetaan kolom—memetakan kolom basis data ke Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah di formulir edit setelah kolom dibuat. |
| Field interface | Tergantung kondisi | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Penyesuaian akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Tergantung kondisi | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikan, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan arti kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara kolom disimpan, komponen input, aturan validasi, kondisi filter, dan cara variabel alur kerja digunakan. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sudah sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom Markdown. Dalam basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom Markdown yang baru dibuat di basis data utama, kolom fisik di basis data beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan sebelum menghapus apakah kolom tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom Markdown cocok digunakan dalam pengeditan konten dan tampilan detail.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Mengedit konten Markdown. |
| Blok detail | Menampilkan konten yang dirender dalam format Markdown. |
| Blok tabel | Menampilkan ringkasan konten. |
| Alur kerja | Menggunakan isi sebagai konten untuk membuat notifikasi atau dokumen. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Menggunakan Vditor untuk mengedit Markdown
- [Teks kaya](./rich-text.md) — Menggunakan editor teks kaya untuk mengedit konten
- [Teks multiline](../basic/textarea.md) — Menyimpan konten teks panjang tanpa format
