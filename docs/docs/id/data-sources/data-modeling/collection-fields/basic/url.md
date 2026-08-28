---
title: "URL"
description: "Kolom URL digunakan untuk menyimpan alamat web, tautan ke sistem eksternal, tautan dokumen, dan informasi alamat lainnya."
keywords: "URL,tautan,alamat web,url,NocoBase"
---

# URL

## Pengenalan

Di NocoBase, **URL（URL）** digunakan untuk menyimpan alamat web atau tautan.

Kolom URL cocok untuk alamat sistem eksternal, tautan dokumen, alamat situs resmi, alamat callback, dan konten lainnya. Dibandingkan teks biasa, kolom ini lebih jelas dalam menyatakan semantik tautan.

Jika ingin mengunggah file, pilih [Lampiran](../media/field-attachment.md). Jika hanya berupa teks penjelasan biasa, pilih [Teks satu baris](./input.md) atau [Teks multi-baris](./textarea.md).

## Skenario penggunaan

URL cocok untuk skenario bisnis berikut:

- Situs resmi pelanggan dan pemasok
- Tautan halaman detail sistem eksternal
- Tautan dokumen kontrak dan halaman basis pengetahuan
- Alamat Webhook dan alamat callback

## Pembuatan konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「URL」 untuk membuat kolom URL.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. URL对应 `url`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「Situs resmi」「Tautan dokumen」「Alamat eksternal」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Kolom URL secara default adalah `string`. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat digunakan untuk mengatur format URL, panjang, atau kewajiban pengisian. |
| Description | Deskripsi kolom. Cocok untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur kolom

Perilaku default kolom URL adalah sebagai berikut:

| Fitur | Deskripsi |
| --- | --- |
| Field interface default | `url`. |
| Field type default | `string`. |
| Field type yang tersedia | `string`. |
| Komponen halaman | Mode edit menggunakan kotak input, sedangkan mode baca biasanya menampilkannya sebagai tautan. |
| Penyaringan | Mendukung penyaringan berbasis teks, seperti berisi, sama dengan, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan di blok tabel. |
| Validasi | Mendukung validasi format URL, panjang, kewajiban pengisian, dan lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan kolom untuk mengedit konfigurasi kolom URL. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan dalam basis data utama, pengeditan biasanya dilakukan untuk memetakan kolom—memetakan kolom basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama kolom yang ditampilkan di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah melalui formulir edit setelah kolom dibuat. |
| Field interface | Dukungan bersyarat | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Penyesuaian akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dukungan bersyarat | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sisi kanan kolom untuk menghapus kolom URL. Dalam basis data utama, Anda juga dapat memilih beberapa kolom untuk dihapus sekaligus.

Saat menghapus kolom URL yang dibuat di basis data utama, biasanya kolom nyata di basis data beserta data yang sudah ada di kolom tersebut juga akan dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah kolom tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom URL cocok digunakan dalam skenario detail, tabel, dan pengalihan ke alamat eksternal.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memasukkan alamat tautan. |
| Blok detail | Menampilkan dan membuka tautan. |
| Blok tabel | Menampilkan ringkasan tautan atau tautan yang dapat diklik. |
| Alur kerja | Menggunakan tautan sebagai isi notifikasi atau parameter permintaan eksternal. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Teks satu baris](./input.md) — Menyimpan teks pendek biasa
- [Lampiran](../media/field-attachment.md) — Mengunggah dan mengaitkan file
