---
title: "Tanggal dan waktu (tanpa zona waktu)"
description: "Kolom tanggal dan waktu (tanpa zona waktu) digunakan untuk menyimpan tanggal dan waktu tanpa konversi zona waktu."
keywords: "tanggal dan waktu,datetime without timezone,tanpa zona waktu,NocoBase"
---

# Tanggal dan waktu (tanpa zona waktu)

## Pengenalan

Di NocoBase, **tanggal dan waktu (tanpa zona waktu) (Date time without timezone)** digunakan untuk menyimpan tanggal dan waktu tanpa konversi zona waktu.

Tanggal dan waktu (tanpa zona waktu) cocok untuk skenario yang lebih mementingkan nilai tampilan lokal, seperti penjadwalan, jam operasional, dan waktu kelas.

Jika perlu menyatakan titik waktu nyata yang konsisten di seluruh dunia, [tanggal dan waktu (dengan zona waktu)](./datetime.md) lebih sesuai.

## Skenario yang sesuai

Tanggal dan waktu (tanpa zona waktu) cocok untuk skenario bisnis berikut:

- Waktu penjadwalan lokal
- Waktu mulai kelas dan waktu ujian
- Titik waktu operasional toko
- Waktu bisnis yang tidak ingin dikonversi antar zona waktu

## Pembuatan konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」, lalu pilih 「tanggal dan waktu (tanpa zona waktu)」 untuk membuat kolom tanggal dan waktu (tanpa zona waktu).

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Tanggal dan waktu (tanpa zona waktu) sesuai dengan `datetimeNoTz`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「Waktu penjadwalan」, 「Waktu kelas」, atau 「Jam operasional」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Tanggal dan waktu (tanpa zona waktu) biasanya menggunakan `datetimeNoTz`. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat dikonfigurasi untuk wajib diisi, rentang waktu, dan sebagainya. |
| Description | Deskripsi kolom. Cocok untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom tanggal dan waktu (tanpa zona waktu) adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `datetimeNoTz`. |
| Field type default | `datetimeNoTz`. |
| Field type yang tersedia | `datetimeNoTz`. |
| Komponen halaman | Mode edit menggunakan pemilih tanggal dan waktu. |
| Filter | Mendukung pemfilteran berdasarkan titik waktu, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan berdasarkan waktu. |
| Validasi | Mendukung validasi seperti wajib diisi dan rentang waktu. |

## Pengeditan konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom tanggal dan waktu (tanpa zona waktu). Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan dalam basis data utama, pengeditan biasanya dilakukan untuk memetakan kolom—memetakan kolom basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama kolom yang ditampilkan di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah di formulir edit setelah kolom dibuat. |
| Field interface | Dukungan bersyarat | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Penyesuaian akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Dukungan bersyarat | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikan, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi filter, serta cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom tanggal dan waktu (tanpa zona waktu). Dalam basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom tanggal dan waktu (tanpa zona waktu) yang baru dibuat di basis data utama, kolom nyata yang sesuai dalam basis data beserta data yang ada di dalamnya biasanya juga akan dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah kolom masih direferensikan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom tanggal dan waktu (tanpa zona waktu) cocok untuk bisnis yang menggunakan waktu lokal.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memilih tanggal dan waktu. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter waktu. |
| Blok kalender | Sebagai kolom waktu acara lokal. |
| Alur kerja | Sebagai kolom kondisi waktu. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Tanggal dan waktu (dengan zona waktu)](./datetime.md) — Menyimpan titik waktu dengan semantik zona waktu
- [Tanggal](./date.md) — Hanya menyimpan tanggal