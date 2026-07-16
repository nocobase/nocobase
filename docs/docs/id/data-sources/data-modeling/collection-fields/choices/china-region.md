---
title: "Pembagian Administratif Tiongkok"
description: "Bidang pembagian administratif Tiongkok digunakan untuk memilih informasi administratif seperti provinsi, kota, dan distrik atau kabupaten di Tiongkok."
keywords: "pembagian administratif Tiongkok,china region,alamat,bidang pilihan,NocoBase"
---

# Pembagian Administratif Tiongkok (deprecated)

## Pengenalan

:::warning Perhatian

Bidang pembagian administratif Tiongkok sudah tidak digunakan lagi. Disarankan untuk menggunakan bidang relasi guna menghubungkan tabel hierarkis.

:::

Di NocoBase, **pembagian administratif Tiongkok (China region)** digunakan untuk memilih pembagian administratif seperti provinsi, kota, dan distrik atau kabupaten di Tiongkok.

Bidang pembagian administratif Tiongkok cocok untuk skenario yang memerlukan pemilihan wilayah secara terstruktur, seperti alamat pelanggan, alamat toko, dan area layanan. Dibandingkan dengan memasukkan alamat secara manual, bidang ini lebih memudahkan penyaringan dan pembuatan statistik.

Jika perlu menyimpan alamat lengkap dan terperinci, Anda dapat mengombinasikannya dengan [teks satu baris](../basic/input.md) atau [teks multi-baris](../basic/textarea.md) untuk menyimpan nama jalan dan nomor bangunan.

## Skenario yang sesuai

Pembagian administratif Tiongkok cocok untuk skenario bisnis berikut:

- Provinsi, kota, dan distrik atau kabupaten tempat pelanggan berada
- Area layanan toko
- Wilayah pelaksanaan proyek
- Pembagian administratif dalam alamat penerima

## Pembuatan dan konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」 lalu pilih 「中国行政区划」 untuk membuat bidang pembagian administratif Tiongkok.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Untuk pembagian administratif Tiongkok, nilainya adalah `chinaRegion`, yang menentukan cara memasukkan dan menampilkan data pada halaman. |
| Field display name | Nama yang ditampilkan untuk bidang pada antarmuka, misalnya 「所在地区」, 「服务区域」, atau 「收货地区」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak dapat diubah lagi. Hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis bidang pada lapisan data. Bidang pembagian administratif biasanya disimpan sebagai nilai terstruktur. Field type yang digunakan bergantung pada konfigurasi bidang. |
| Default value | Nilai default. Saat membuat catatan baru, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur apakah bidang wajib diisi dan tingkat wilayah yang dapat dipilih. |
| Description | Deskripsi bidang. Dapat digunakan untuk menjelaskan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur bidang

Perilaku default bidang pembagian administratif Tiongkok adalah sebagai berikut:

| Fitur | Keterangan |
| --- | --- |
| Field interface default | `chinaRegion`. |
| Field type default | `json`. |
| Field type yang dapat dipilih | `json`、`string`, sesuai dengan konfigurasi bidang yang sebenarnya. |
| Komponen halaman | Mode pengeditan menggunakan komponen pemilih pembagian administratif. |
| Penyaringan | Mendukung penyaringan berdasarkan nilai wilayah. Kemampuan spesifiknya bergantung pada konfigurasi bidang. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi. |

## Pengeditan konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan bidang untuk mengedit konfigurasi bidang pembagian administratif Tiongkok. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan bidang—memetakan bidang database menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan untuk bidang pada antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah melalui formulir pengeditan setelah bidang dibuat. |
| Field interface | Dengan syarat | Bidang dari database utama atau bidang tersinkronkan dapat disesuaikan saat pemetaan bidang. Penyesuaian akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi pada halaman. |
| Field type | Dengan syarat | Bidang dari database utama atau bidang tersinkronkan dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikan, pastikan data yang sudah ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat membuat catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Penghapusan bidang

Klik 「Delete」 di sebelah kanan bidang untuk menghapus bidang pembagian administratif Tiongkok. Dalam database utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang pembagian administratif Tiongkok yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Penghapusan bidang dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan bidang tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang pembagian administratif Tiongkok cocok digunakan dalam skenario alamat, wilayah, dan statistik.

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memilih provinsi, kota, dan distrik atau kabupaten. |
| Blok detail | Menampilkan pembagian administratif. |
| Blok penyaringan | Menyaring catatan berdasarkan wilayah. |
| Blok diagram | Membuat statistik data bisnis berdasarkan wilayah. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Teks satu baris](../basic/input.md) — Menyimpan alamat terperinci
- [Teks multi-baris](../basic/textarea.md) — Menyimpan keterangan alamat yang lebih panjang
