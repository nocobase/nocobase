---
title: "Timestamp Unix"
description: "Field Timestamp Unix digunakan untuk menyimpan nilai timestamp dari sistem eksternal."
keywords: "Timestamp Unix,unix timestamp,timestamp,NocoBase"
---

# Timestamp Unix

## Pengenalan

Di NocoBase, **Timestamp Unix (Unix timestamp)** digunakan untuk menyimpan timestamp Unix.

Timestamp Unix sering digunakan untuk mengintegrasikan sistem eksternal, data log, atau migrasi data historis. Nilai yang disimpan berupa angka, tetapi makna bisnisnya adalah waktu.

Jika tidak ada persyaratan timestamp dari sistem eksternal, menggunakan [tanggal dan waktu](./datetime.md) secara langsung akan lebih mudah dipahami dan dipelihara.

## Skenario penggunaan

Timestamp Unix sesuai untuk skenario bisnis berikut:

- Sinkronisasi timestamp dari sistem eksternal
- Waktu terjadinya log
- Unix timestamp yang dikembalikan oleh API
- Kolom waktu dalam migrasi data historis

## Pembuatan konfigurasi

Pada halaman «Configure fields» di tabel data, klik «Add field», lalu pilih «Timestamp Unix» untuk membuat kolom Timestamp Unix.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Timestamp Unix sesuai dengan `unixTimestamp`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya «Timestamp sinkronisasi», «Waktu log», atau «Waktu pembaruan eksternal». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama pengenal kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Timestamp Unix biasanya disimpan sebagai bilangan bulat atau bilangan bulat besar. |
| Default value | Nilai default. Saat menambahkan record baru, nilai ini dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat dikonfigurasi sebagai wajib diisi dan rentang nilai. |
| Description | Deskripsi kolom. Cocok untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan digunakan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom Timestamp Unix adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `unixTimestamp`. |
| Field type default | `bigInt`. |
| Field type yang tersedia | `integer`, `bigInt`. |
| Komponen halaman | Dalam mode pengeditan, diproses sebagai komponen kolom timestamp. |
| Pemfilteran | Mendukung pemfilteran berdasarkan nilai angka timestamp atau rentang waktu setelah pemetaan. |
| Pengurutan | Mendukung pengurutan. |
| Validasi | Mendukung validasi wajib diisi dan rentang nilai. |

## Pengeditan konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan kolom untuk mengedit konfigurasi kolom Timestamp Unix. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di basis data utama, pengeditan biasanya dilakukan untuk memetakan kolom—memetakan kolom basis data menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama pengenal kolom. |
| Field name | Tidak | Nama pengenal kolom biasanya tidak dapat diubah dalam formulir pengeditan setelah dibuat. |
| Field interface | Bergantung kondisi | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Bergantung kondisi | Kolom basis data utama atau kolom tersinkronisasi dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi makna kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini memengaruhi cara kolom disimpan, komponen input, aturan validasi, kondisi pemfilteran, dan cara variabel alur kerja digunakan. Jika data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Penghapusan kolom

Klik «Delete» di sebelah kanan kolom untuk menghapus kolom Timestamp Unix. Di basis data utama, Anda juga dapat memilih beberapa kolom untuk menghapusnya secara massal.

Saat menghapus kolom Timestamp Unix yang baru dibuat di basis data utama, kolom nyata di basis data beserta data yang ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari basis data atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah kolom tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom Timestamp Unix sesuai untuk integrasi dengan sistem eksternal dan skenario berbasis log.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan atau memetakan timestamp. |
| Blok tabel | Menampilkan, mengurutkan, dan memfilter timestamp. |
| Alur kerja | Digunakan sebagai kondisi waktu untuk sistem eksternal. |
| API | Mengintegrasikan API yang mensyaratkan Unix timestamp. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Tanggal dan waktu (dengan zona waktu)](./datetime.md) — Menyimpan tanggal dan waktu biasa
- [Bilangan bulat](../basic/integer.md) — Menyimpan bilangan bulat biasa
