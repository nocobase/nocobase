---
title: "Teks satu baris"
description: "Field teks satu baris digunakan untuk menyimpan nama, nomor, judul, kontak, dan konten teks pendek lainnya. Secara default, field ini menggunakan tipe string dan kotak input Input."
keywords: "Teks satu baris,input,field teks,string,Field interface,NocoBase"
---

# Teks satu baris

## Pendahuluan

Di NocoBase, **teks satu baris (Single line text)** adalah field teks yang paling umum digunakan. Field ini cocok untuk menyimpan konten teks pendek yang panjangnya tidak lebih dari satu baris, seperti nama pelanggan, nomor pesanan, kontak, ringkasan alamat, dan nomor dari sistem eksternal.

Field teks satu baris secara default menggunakan `Input` kotak input, dengan Field type default `string`. Field ini dapat digunakan sebagai field judul, serta digunakan dalam filter, pengurutan, izin, kondisi alur kerja, dan kueri API.

Jika konten mungkin memerlukan baris baru atau cukup panjang, secara default [teks multibaris](./textarea.md) lebih sesuai. Jika konten memiliki format tetap, seperti email, nomor ponsel, atau URL, sebaiknya pilih field khusus yang sesuai.

## Skenario penggunaan

Teks satu baris cocok untuk skenario bisnis berikut:

- Nama pelanggan, nama perusahaan, nama kontak
- Nomor pesanan, nomor kontrak, nomor proyek
- Judul tugas, judul tiket, judul artikel
- ID sistem eksternal, nomor sinkronisasi, kode bisnis
- Kota, ringkasan alamat, nama toko, dan informasi teks pendek lainnya

## Membuat konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Single line text» untuk membuat field teks satu baris.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka field. Teks satu baris menggunakan `input`, dan secara default halaman menggunakan kotak input untuk memasukkan serta menampilkan data. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya «Nama pelanggan», «Nomor pesanan», atau «Judul tugas». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Setelah dibuat, nama ini biasanya tidak diubah lagi. Nama hanya boleh berisi huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Teks satu baris secara default menggunakan `string`, dan juga dapat memilih `uid`. Untuk teks pendek biasa, `string` sudah memadai. |
| Automatically remove heading and tailing spaces | Menghapus spasi di awal dan akhir secara otomatis. Cocok untuk konten seperti nama pelanggan, nomor, dan judul yang tidak perlu mempertahankan spasi di awal atau akhir. |
| Default value | Nilai default. Saat membuat record baru, teks default dapat diisikan secara otomatis jika pengguna tidak mengisi nilai. |
| Primary | Menetapkan field sebagai primary key. Hanya tersedia saat membuat field baru di database utama; teks bisnis biasa tidak disarankan digunakan sebagai primary key. |
| Unique | Batasan unik. Cocok untuk teks seperti nomor pesanan, nomor kontrak, dan ID sistem eksternal yang tidak boleh duplikat. |
| Validation rules | Aturan validasi. Dapat membatasi panjang minimum, panjang maksimum, panjang tetap, atau ekspresi reguler. |
| Description | Deskripsi field. Cocok untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Setelah dibuat, nama field akan digunakan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaan sebelum membuatnya untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field teks satu baris adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Field interface default | `input`. |
| Field type default | `string`. |
| Field type yang tersedia | `string`、`uid`. |
| Komponen halaman | Dalam mode pengeditan, digunakan kotak input `Input`. |
| Field judul | Dapat digunakan sebagai field judul tabel data. Cocok untuk menetapkan «Nama pelanggan», «Nomor pesanan», atau «Judul tugas» sebagai field judul. |
| Pengurutan | Mendukung pengurutan dalam blok tabel. |
| Filter | Mendukung filter teks, seperti berisi, tidak berisi, sama dengan, tidak sama dengan, kosong, tidak kosong, dan sebagainya. |
| Validasi | Mendukung validasi panjang minimum, panjang maksimum, panjang tetap, ekspresi reguler, dan sebagainya. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field teks satu baris. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau pengaturan penghapusan spasi di awal dan akhir secara otomatis.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk memetakan field—memetakan field database ke Field type dan Field interface NocoBase. Misalnya, kolom teks pendek seperti `varchar`、`char` dalam database dapat dipetakan sebagai field teks satu baris.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah dalam formulir pengeditan setelah field dibuat. |
| Field interface | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Automatically remove heading and tailing spaces | Ya | Mengontrol apakah spasi di awal dan akhir dihapus saat penyimpanan. |
| Default value | Ya | Menyesuaikan teks default saat membuat record baru. |
| Unique | Dengan syarat | Dapat dikonfigurasi saat membuat field baru di database utama. Jika data yang ada sudah memiliki nilai duplikat, penambahan batasan unik mungkin gagal. |
| Validation rules | Ya | Menyesuaikan validasi panjang, format, atau ekspresi reguler. |
| Description | Ya | Melengkapi arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara field disimpan, komponen input, aturan validasi, kondisi filter, dan cara variabel alur kerja digunakan. Jika data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field teks satu baris. Di database utama, beberapa field juga dapat dipilih untuk dihapus secara massal.

Saat menghapus field teks satu baris yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field teks satu baris dapat digunakan dalam sebagian besar skenario blok data dan formulir.

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memasukkan atau mengedit konten teks pendek, seperti nama pelanggan, nomor pesanan, atau judul tugas. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter konten teks pendek. Jika konten cukup panjang, tampilan dalam tabel akan dipersingkat sesuai konfigurasi antarmuka. |
| Blok detail | Menampilkan informasi teks dalam satu record. |
| Blok filter | Digunakan sebagai kondisi kueri untuk memfilter record, misalnya berdasarkan nama pelanggan, nomor, atau judul. |
| Tampilan field relasi | Setelah field teks satu baris ditetapkan sebagai field judul, teks ini akan diprioritaskan saat memilih record pada field relasi. |
| Alur kerja dan izin | Digunakan sebagai field kondisi untuk melakukan pemeriksaan, misalnya apakah nomor pesanan kosong atau apakah nama pelanggan mengandung kata kunci tertentu. |

### Mode pengeditan

Dalam mode pengeditan, field teks satu baris menggunakan kotak input untuk memasukkan konten.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Mode baca

Dalam mode baca, field teks satu baris ditampilkan sebagai teks biasa.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)