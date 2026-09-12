---
title: "Tanggal"
description: "Kolom tanggal digunakan untuk menyimpan tanggal seperti ulang tahun, tanggal penandatanganan, tanggal kedaluwarsa, dan tanggal lain yang tidak mencakup waktu spesifik."
keywords: "tanggal,date,kolom tanggal,NocoBase"
---

# Tanggal

## Pengenalan

Di NocoBase, **tanggal (Date)** digunakan untuk menyimpan tanggal tanpa waktu spesifik.

Kolom tanggal cocok untuk data bisnis yang hanya memperhatikan tahun, bulan, dan hari, seperti ulang tahun, tanggal penandatanganan, tanggal kedaluwarsa, dan tanggal yang direncanakan.

Jika perlu menyimpan jam, menit, dan detik tertentu, pilih [tanggal waktu](./datetime.md). Jika hanya memerlukan waktu dalam satu hari, pilih [waktu](./time.md).

## Skenario penggunaan

Tanggal cocok untuk skenario bisnis berikut:

- Tanggal lahir pelanggan, tanggal mulai kerja karyawan
- Tanggal penandatanganan kontrak, tanggal kedaluwarsa
- Tanggal yang direncanakan, tanggal pengiriman
- Tanggal bisnis yang tidak memerlukan waktu spesifik

## Membuat konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」 lalu pilih 「Tanggal」 untuk membuat kolom tanggal.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Untuk tanggal adalah `date`, yang menentukan cara memasukkan dan menampilkannya di halaman. |
| Field display name | Nama yang ditampilkan kolom di antarmuka, misalnya 「Tanggal penandatanganan」, 「Tanggal kedaluwarsa」, atau 「Tanggal lahir」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Kolom tanggal secara default adalah `dateonly`. |
| Default value | Nilai default. Saat menambahkan catatan baru, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat digunakan untuk mengatur wajib diisi, rentang tanggal, dan lainnya. |
| Description | Deskripsi kolom. Cocok untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Nama kolom akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom tanggal adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `date`. |
| Default Field type | `dateonly`. |
| Field type yang tersedia | `dateonly`. |
| Komponen halaman | Mode edit menggunakan pemilih tanggal. |
| Filter | Mendukung filter berdasarkan tanggal, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan berdasarkan tanggal. |
| Validasi | Mendukung validasi seperti wajib diisi dan rentang tanggal. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom tanggal. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan dalam basis data utama, pengeditan biasanya dilakukan sebagai pemetaan kolom—memetakan kolom basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan kolom di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah dalam formulir edit setelah dibuat. |
| Field interface | Dengan syarat | Field basis data utama atau field tersinkronisasi dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara halaman melakukan input, menampilkan, dan memvalidasi data. |
| Field type | Dengan syarat | Field basis data utama atau field tersinkronisasi dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan makna kolom, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini memengaruhi cara kolom disimpan, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom tanggal. Dalam basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya sekaligus.

Saat menghapus kolom tanggal yang dibuat di basis data utama, biasanya kolom fisik dalam basis data beserta data yang sudah ada di kolom tersebut juga akan dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Menghapus kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah kolom tersebut masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom tanggal cocok digunakan dalam formulir, tabel, filter, kalender, dan statistik.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih tanggal. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter tanggal. |
| Blok kalender | Sebagai kolom tanggal acara. |
| Alur kerja | Sebagai kolom kondisi tanggal. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Tanggal waktu (termasuk zona waktu)](./datetime.md) — Menyimpan tanggal dan waktu tertentu
- [Waktu](./time.md) — Hanya menyimpan waktu
