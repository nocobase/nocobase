---
title: "Tanggal dan waktu (dengan zona waktu)"
description: "Bidang tanggal dan waktu (dengan zona waktu) digunakan untuk menyimpan tanggal dan waktu dengan semantik zona waktu."
keywords: "tanggal dan waktu,datetime,zona waktu,NocoBase"
---

# Tanggal dan waktu (dengan zona waktu)

## Pengenalan

Di NocoBase, **tanggal dan waktu (dengan zona waktu) (Date time with timezone)** digunakan untuk menyimpan tanggal dan waktu serta memprosesnya berdasarkan semantik zona waktu.

Tanggal dan waktu (dengan zona waktu) cocok untuk kolaborasi lintas zona waktu, bisnis internasional, atau skenario yang memerlukan titik waktu yang jelas, seperti membuat reservasi, waktu tenggat, dan waktu pelaksanaan.

Jika bisnis hanya memerlukan teks waktu lokal dan tidak membutuhkan konversi zona waktu, pilih [tanggal dan waktu (tanpa zona waktu)](./datetime-without-tz.md). Jika hanya memerlukan tanggal, pilih [tanggal](./date.md).

## Skenario penggunaan

Tanggal dan waktu (dengan zona waktu) cocok untuk skenario bisnis berikut:

- Waktu mulai rapat dan waktu reservasi
- Waktu tenggat dan waktu pelaksanaan tugas
- Titik waktu dalam bisnis lintas zona waktu
- Waktu terkait kondisi penjadwalan alur kerja

## Membuat konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「tanggal dan waktu (dengan zona waktu)」 untuk membuat bidang tanggal dan waktu (dengan zona waktu).

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Tanggal dan waktu (dengan zona waktu) sesuai dengan `datetime`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan bidang di antarmuka, misalnya 「waktu mulai」, 「waktu tenggat」, atau 「waktu pelaksanaan」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak dapat diubah, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis bidang pada lapisan data. Tanggal dan waktu (dengan zona waktu) biasanya menggunakan `date`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat dikonfigurasi untuk wajib diisi, rentang waktu, dan sebagainya. |
| Description | Deskripsi bidang. Cocok digunakan untuk menuliskan arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama bidang akan direferensikan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang tanggal dan waktu (dengan zona waktu) adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `datetime`. |
| Default Field type | `date`. |
| Field type yang tersedia | `date`. |
| Komponen halaman | Mode edit menggunakan pemilih tanggal dan waktu. |
| Pemfilteran | Mendukung pemfilteran berdasarkan titik waktu, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan berdasarkan waktu. |
| Validasi | Mendukung validasi seperti wajib diisi dan rentang waktu. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan bidang untuk mengedit konfigurasi bidang tanggal dan waktu (dengan zona waktu). Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan untuk pemetaan bidang—memetakan bidang basis data ke Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah di formulir pengeditan setelah bidang dibuat. |
| Field interface | Didukung secara kondisional | Bidang basis data utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Didukung secara kondisional | Bidang basis data utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Melengkapi arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini memengaruhi cara bidang disimpan, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika data yang ada cukup banyak, pastikan terlebih dahulu bahwa format data sesuai.

:::

## Menghapus bidang

Klik 「Delete」 di sebelah kanan bidang untuk menghapus bidang tanggal dan waktu (dengan zona waktu). Di basis data utama, Anda juga dapat memilih beberapa bidang untuk dihapus secara massal.

Saat menghapus bidang tanggal dan waktu (dengan zona waktu) yang dibuat di basis data utama, kolom sebenarnya di basis data beserta data yang ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus bidang yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah bidang tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang tanggal dan waktu (dengan zona waktu) cocok digunakan dalam kalender, tabel, pemfilteran, dan alur kerja.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih tanggal dan waktu. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter waktu. |
| Blok kalender | Sebagai bidang waktu mulai atau waktu selesai. |
| Alur kerja | Sebagai kondisi waktu atau bidang terkait penjadwalan. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Tanggal dan waktu (tanpa zona waktu)](./datetime-without-tz.md) — Menyimpan tanggal dan waktu tanpa konversi zona waktu
- [Tanggal](./date.md) — Hanya menyimpan tanggal
- [Waktu](./time.md) — Hanya menyimpan waktu
