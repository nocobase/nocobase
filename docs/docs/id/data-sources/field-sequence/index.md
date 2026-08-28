---
title: "Urutan"
description: "Field urutan digunakan untuk menghasilkan nomor bisnis yang meningkat atau dibuat berdasarkan aturan tertentu."
keywords: "urutan,sequence,nomor,penomoran otomatis,NocoBase"
---

# Urutan

## Pengenalan

Di NocoBase, **urutan (Sequence)** digunakan untuk menghasilkan nomor bisnis.

Field urutan cocok untuk nomor pesanan, nomor kontrak, nomor tiket kerja, nomor permohonan, dan nomor lain yang memerlukan aturan yang mudah dibaca. Berbeda dari kunci utama, field ini lebih ditujukan untuk tampilan bisnis dan identifikasi oleh manusia.

Jika hanya memerlukan pengenal unik internal, gunakan Snowflake ID, UUID, atau Nano ID.

## Skenario penggunaan

Urutan cocok untuk skenario bisnis berikut:

- Nomor pesanan dan nomor kontrak
- Nomor tiket kerja dan nomor permohonan
- Nomor aset dan nomor perangkat
- Nomor dengan awalan, tanggal, atau aturan peningkatan

## Membuat konfigurasi

Pada halaman «Configure fields» tabel data, klik «Add field», lalu pilih «Urutan» untuk membuat field urutan.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Urutan sesuai dengan `sequence`, yang menentukan cara field diisi dan ditampilkan pada halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya «Nomor pesanan», «Nomor kontrak», atau «Nomor tiket kerja». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama pengenal field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Jenis penyimpanan field urutan bergantung pada aturan urutan, yang umumnya berupa `string`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Biasanya dibuat oleh sistem berdasarkan aturan dan tidak memerlukan validasi manual. |
| Description | Keterangan field. Cocok digunakan untuk menulis makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan dirujuk oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat field

Perilaku default field urutan adalah sebagai berikut:

| Sifat | Keterangan |
| --- | --- |
| Default Field interface | `sequence`. |
| Default Field type | `string`. |
| Field type yang tersedia | `string` dan `integer`, sesuai dengan konfigurasi urutan aktual. |
| Komponen halaman | Biasanya dibuat secara otomatis dan digunakan setelah aturan penomoran dikonfigurasi. |
| Penyaringan | Mendukung pencarian berdasarkan nomor secara tepat atau penyaringan teks. |
| Pengurutan | Kesesuaian untuk pengurutan bergantung pada aturan penomoran. |
| Validasi | Bergantung pada aturan urutan dan biasanya tetap unik. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field urutan. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, keterangan, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama pengenal field. |
| Field name | Tidak | Nama pengenal field biasanya tidak dapat diubah melalui formulir pengeditan setelah dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkron dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi pada halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkron dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Melengkapi makna field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field urutan. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field urutan yang dibuat di database utama, kolom aktual di database beserta data yang sudah ada di kolom tersebut biasanya ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field masih dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field urutan cocok digunakan dalam skenario nomor bisnis dan pencarian manual.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Skenario | Kegunaan |
| --- | --- |
| Membuat record | Menghasilkan nomor bisnis secara otomatis. |
| Blok tabel | Menampilkan, mencari, dan menyaring nomor. |
| Blok detail | Sebagai pengenal record yang mudah dibaca. |
| Alur kerja dan notifikasi | Merujuk nomor bisnis dalam persetujuan dan notifikasi. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks satu baris](../data-modeling/collection-fields/basic/input.md) — Memelihara nomor bisnis secara manual
- [Snowflake ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Menggunakan ID kunci utama internal
