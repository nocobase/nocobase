---
title: "Poligon"
description: "Field poligon digunakan untuk menyimpan data spasial berbentuk area seperti wilayah, batas, dan cakupan layanan."
keywords: "poligon,Polygon,wilayah,bentuk geometris,NocoBase"
---

# Poligon

## Pengenalan

Di NocoBase, **poligon (Polygon)** digunakan untuk menyimpan area spasial berbentuk bidang.

Field poligon cocok untuk data bisnis seperti distrik administratif, area pengiriman, wilayah penjualan, dan zona terlarang. Jika dipadukan dengan blok peta, poligon dapat menampilkan cakupan suatu area.

Jika areanya berbentuk lingkaran sederhana, pilih [lingkaran](./circle.md). Jika hanya perlu menyimpan satu lokasi, pilih [titik](./point.md).

## Skenario penggunaan

Poligon cocok untuk skenario bisnis berikut:

- Wilayah penjualan dan area pengiriman
- Area layanan dan distrik pengelolaan
- Zona terlarang dan area berisiko
- Batas cakupan bisnis di peta

## Membuat konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」 lalu pilih 「多边形」 untuk membuat field poligon.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Konfigurasi | Penjelasan |
| --- | --- |
| Field interface | Jenis antarmuka field. Poligon menggunakan `polygon`, yang menentukan cara pengisian dan penampilan data pada halaman. |
| Field display name | Nama field yang ditampilkan pada antarmuka, misalnya 「销售区域」, 「配送范围」, atau 「风险区域」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama pengenal field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Field poligon secara default adalah `polygon`. |
| Default value | Nilai default. Saat membuat record baru, nilai ini dapat otomatis diisi jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya cukup dikonfigurasi sebagai wajib diisi. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku default field poligon adalah sebagai berikut:

| Fitur | Penjelasan |
| --- | --- |
| Default Field interface | `polygon`. |
| Default Field type | `polygon`. |
| Field type yang tersedia | `polygon`. |
| Komponen halaman | Mode edit menggunakan komponen peta untuk menggambar. |
| Penyaringan | Kemampuan penyaringan spasial bergantung pada plugin peta dan kemampuan sumber data. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field poligon. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel di database utama yang telah disinkronkan, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Penjelasan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan pada antarmuka tanpa mengubah nama pengenal field. |
| Field name | Tidak | Nama pengenal field biasanya tidak dapat diubah melalui formulir pengeditan setelah field dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara data diinput, ditampilkan, dan divalidasi pada halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat record baru dibuat. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field poligon. Dalam database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field poligon yang dibuat di database utama, kolom aktual di database beserta data yang tersimpan di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Menghapus field dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field poligon cocok digunakan dalam skenario pengelolaan wilayah dan visualisasi peta.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menggambar batas wilayah. |
| Blok detail | Menampilkan cakupan wilayah. |
| Blok peta | Menampilkan area berbentuk bidang pada peta. |
| Grafik dan statistik | Digunakan sebagai dimensi wilayah untuk menganalisis data bisnis. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Titik](./point.md) — Menyimpan satu lokasi
- [Lingkaran](./circle.md) — Menyimpan area berbentuk lingkaran
