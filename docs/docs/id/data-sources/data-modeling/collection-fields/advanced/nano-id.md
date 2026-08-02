---
title: "Nano ID"
description: "Field Nano ID digunakan untuk menghasilkan pengenal unik acak yang lebih pendek."
keywords: "Nano ID,nanoid,pengenal unik,NocoBase"
---

# Nano ID

## Pengenalan

Di NocoBase, **Nano ID (Nano ID)** digunakan untuk menghasilkan ID unik acak yang pendek.

Nano ID cocok untuk skenario yang memerlukan pengenal berupa string yang lebih pendek, seperti tautan pendek, nomor publik, dan ID referensi eksternal.

Jika digunakan sebagai kunci utama internal default, Snowflake ID biasanya lebih praktis. Jika memerlukan nomor bisnis yang mudah dibaca, pilih [sekuens](../../../field-sequence/index.md).

## Skenario yang sesuai

Nano ID cocok untuk skenario bisnis berikut:

- Pengenal tautan pendek
- ID berbagi publik
- Nomor referensi eksternal
- String unik acak yang lebih pendek

## Pembuatan konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Nano ID» untuk membuat field Nano ID.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Nano ID menggunakan `nanoId`, yang menentukan cara pengisian dan penampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya «ID berbagi», «ID publik», atau «pengenal pendek». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama pengenal field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Nano ID secara default menggunakan `string`. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Biasanya dibuat secara otomatis oleh sistem dan tidak memerlukan validasi manual. |
| Description | Deskripsi field. Cocok digunakan untuk menulis arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Nama field akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya terlebih dahulu untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat field

Perilaku default field Nano ID adalah sebagai berikut:

| Sifat | Keterangan |
| --- | --- |
| Field interface default | `nanoId`. |
| Field type default | `string`. |
| Field type yang tersedia | `string`. |
| Komponen halaman | Biasanya dibuat secara otomatis dan tidak memerlukan input manual. |
| Filter | Mendukung pencarian tepat berdasarkan Nano ID. |
| Pengurutan | Biasanya Nano ID tidak digunakan untuk pengurutan bisnis. |
| Validasi | Biasanya dibuat secara otomatis dan dijaga agar tetap unik. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field Nano ID. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field basis data ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama pengenal field. |
| Field name | Tidak | Nama pengenal field biasanya tidak dapat diubah melalui formulir pengeditan setelah dibuat. |
| Field interface | Mendukung dengan syarat | Field basis data utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Mendukung dengan syarat | Field basis data utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field Nano ID. Di basis data utama, Anda juga dapat memilih beberapa field lalu menghapusnya sekaligus.

Saat menghapus field Nano ID yang baru dibuat di basis data utama, kolom sebenarnya di basis data beserta data yang ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapusnya, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field Nano ID cocok untuk skenario pengenal pendek publik dan referensi eksternal.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Biasanya tidak diedit secara manual dan dibuat oleh sistem. |
| Blok detail | Menampilkan pengenal pendek. |
| API | Sebagai pengenal publik catatan. |
| Tautan eksternal | Sebagai bagian dari tautan pendek atau tautan berbagi. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field di tabel biasa
- [Snowflake ID](./snowflake-id.md) — Menggunakan ID internal default
- [UUID](./uuid.md) — Menggunakan UUID
- [Sekuens](../../../field-sequence/index.md) — Menghasilkan nomor bisnis yang mudah dibaca