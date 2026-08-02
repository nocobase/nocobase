---
title: "UUID"
description: "Field UUID digunakan untuk menghasilkan identifikasi unik universal, cocok untuk sinkronisasi sistem eksternal dan skenario identifikasi publik."
keywords: "UUID,identifikasi unik,kunci utama,NocoBase"
---

# UUID

## Pengenalan

Di NocoBase, **UUID (UUID)** digunakan untuk menghasilkan identifikasi unik UUID.

UUID cocok untuk skenario sinkronisasi lintas sistem, identifikasi API publik, impor dan ekspor, serta lainnya. Dibandingkan ID auto-increment, UUID lebih sulit mengungkapkan skala data.

Jika hanya digunakan sebagai kunci utama default internal NocoBase, Snowflake ID biasanya sudah cukup. Jika memerlukan nomor pendek, pilih [Nano ID](./nano-id.md) atau[sekuens](../../../field-sequence/index.md).

## Skenario penggunaan

UUID cocok untuk skenario bisnis berikut:

- ID sinkronisasi sistem eksternal
- Identifikasi API publik
- Identifikasi catatan saat migrasi lintas database
- ID catatan yang tidak ingin memperlihatkan pola kenaikan

## Membuat konfigurasi

Di halaman「Configure fields」tabel data, klik「Add field」, lalu pilih「UUID」untuk membuat field UUID.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. UUID terkait dengan `uuid`, yang menentukan cara input dan penampilannya di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya「UUID」「Identifikasi eksternal」「ID publik」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field, digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field UUID secara default adalah `uuid`. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Biasanya dibuat otomatis oleh sistem dan tidak perlu divalidasi secara manual. |
| Description | Deskripsi field. Cocok untuk menjelaskan makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan dirujuk oleh blok halaman, izin, workflow, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field UUID adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `uuid`. |
| Default Field type | `uuid`. |
| Field type yang tersedia | `uuid`. |
| Komponen halaman | Biasanya dibuat secara otomatis dan tidak perlu diisi secara manual. |
| Filter | Mendukung pencarian tepat berdasarkan UUID. |
| Pengurutan | Mendukung pengurutan, tetapi UUID biasanya tidak digunakan untuk pengurutan bisnis. |
| Validasi | Biasanya dibuat secara otomatis dan dijaga keunikannya. |

## Mengedit konfigurasi

Setelah dibuat, klik「Edit」di sebelah kanan field untuk mengedit konfigurasi field UUID. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah dalam formulir pengeditan setelah dibuat. |
| Field interface | Didukung dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel workflow. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik「Delete」di sebelah kanan field untuk menghapus field UUID. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field UUID yang dibuat di database utama, biasanya kolom aktual di database beserta data yang ada di kolom tersebut juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field masih dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field UUID cocok digunakan dalam skenario integrasi dan identifikasi publik.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Skenario | Penggunaan |
| --- | --- |
| Membuat tabel | Digunakan sebagai kunci utama atau identifikasi unik. |
| API | Digunakan sebagai identifikasi catatan publik. |
| Sinkronisasi data | Menyinkronkan catatan lintas sistem. |
| Impor dan ekspor | Mempertahankan keunikan catatan. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Snowflake ID](./snowflake-id.md) — Menggunakan Snowflake ID default
- [Nano ID](./nano-id.md) — Menggunakan ID acak pendek
