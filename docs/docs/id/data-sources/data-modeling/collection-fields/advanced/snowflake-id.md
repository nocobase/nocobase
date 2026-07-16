---
title: "Snowflake ID"
description: "Kolom Snowflake ID digunakan untuk menghasilkan ID Snowflake 53-bit dan sering digunakan sebagai kunci utama default."
keywords: "Snowflake ID,snowflakeId,kunci utama,NocoBase"
---

# Snowflake ID

## Pendahuluan

Di NocoBase, **Snowflake ID (Snowflake ID)** digunakan untuk menghasilkan pengenal unik.

Snowflake ID adalah jenis kunci utama yang umum digunakan pada kolom ID default tabel biasa di NocoBase. Jenis ini cocok sebagai pengenal unik untuk catatan internal.

Jika memerlukan nomor yang dapat dibaca oleh sistem eksternal, gunakan [urutan](../../../field-sequence/index.md) atau kolom nomor bisnis.

## Skenario penggunaan

Snowflake ID cocok untuk skenario bisnis berikut:

- Kunci utama default tabel biasa
- ID catatan internal
- Tabel bisnis yang memerlukan pembuatan ID unik berperforma tinggi
- Pengenal unik yang tidak perlu dikenali secara manual

## Konfigurasi pembuatan

Pada halaman 「Configure fields」 tabel data, klik 「Add field」, lalu pilih 「Snowflake ID」 untuk membuat kolom Snowflake ID.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Snowflake ID menggunakan `snowflakeId`, yang menentukan cara kolom diisi dan ditampilkan di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「ID」「ID catatan」「ID internal」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama pengenal kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Snowflake ID biasanya menggunakan `bigInt`. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Biasanya dibuat secara otomatis oleh sistem dan tidak perlu divalidasi secara manual. |
| Description | Keterangan kolom. Cocok digunakan untuk menjelaskan makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama kolom akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom Snowflake ID adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Field interface default | `snowflakeId`. |
| Field type default | `bigInt`. |
| Field type yang tersedia | `bigInt`. |
| Komponen halaman | Biasanya dibuat secara otomatis dan tidak perlu diisi secara manual. |
| Penyaringan | Mendukung pencarian berdasarkan ID secara tepat. |
| Pengurutan | Mendukung pengurutan. |
| Validasi | Biasanya dibuat secara otomatis dan dijaga agar tetap unik. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sisi kanan kolom untuk mengedit konfigurasi kolom Snowflake ID. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, keterangan, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan untuk pemetaan kolom—memetakan kolom basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama pengenal kolom. |
| Field name | Tidak | Nama pengenal kolom biasanya tidak dapat diubah dalam formulir pengeditan setelah dibuat. |
| Field interface | Bergantung kondisi | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara pengisian, tampilan, dan validasi di halaman. |
| Field type | Bergantung kondisi | Kolom basis data utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sisi kanan kolom untuk menghapus kolom Snowflake ID. Di basis data utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom Snowflake ID yang dibuat di basis data utama, kolom nyata di basis data beserta data yang telah ada di dalamnya biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan sebelum menghapus apakah kolom tersebut masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom Snowflake ID cocok digunakan sebagai kunci utama dan pengenal unik internal.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Skenario | Penggunaan |
| --- | --- |
| Membuat tabel | Digunakan sebagai kolom ID default. |
| Kolom relasi | Digunakan sebagai pengenal unik untuk catatan terkait. |
| API | Digunakan untuk menemukan satu catatan tertentu. |
| Izin dan alur kerja | Digunakan sebagai pengenal unik catatan dalam pemrosesan internal. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [UUID](./uuid.md) — Menggunakan UUID sebagai pengenal unik
- [Nano ID](./nano-id.md) — Menggunakan ID pendek
- [Urutan](../../../field-sequence/index.md) — Menghasilkan nomor bisnis
