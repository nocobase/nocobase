---
title: "Grup kotak centang"
description: "Kolom grup kotak centang digunakan untuk menampilkan beberapa opsi secara berjajar di halaman dan memungkinkan pemilihan beberapa nilai."
keywords: "grup kotak centang,checkbox group,multi-pilihan,kolom opsi,NocoBase"
---

# Grup kotak centang

## Pengenalan

Di NocoBase, **grup kotak centang (Checkbox group)** digunakan untuk memilih beberapa nilai dari sekumpulan opsi dan menampilkan opsi tersebut langsung di dalam formulir.

Grup kotak centang cocok untuk skenario dengan jumlah opsi yang sedikit dan memerlukan pemilihan ganda. Fungsinya mirip dengan pilihan ganda dropdown, tetapi perbedaan utamanya terletak pada cara interaksinya di halaman.

Jika opsinya banyak, pilih [pilihan ganda dropdown](./multiple-select.md) untuk menghemat ruang. Jika hanya dapat memilih satu, pilih [grup tombol radio](./radio-group.md).

## Skenario penggunaan

Grup kotak centang cocok untuk skenario bisnis berikut:

- Cakupan layanan dan kanal yang berlaku
- Item pilihan untuk mencentang izin fungsi
- Label kebutuhan pelanggan
- Sejumlah kecil opsi tetap dengan pemilihan ganda

## Pembuatan dan konfigurasi

Pada halaman «Configure fields» di tabel data, klik «Add field», lalu pilih «Grup kotak centang» untuk membuat kolom grup kotak centang.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Grup kotak centang sesuai dengan `checkboxGroup`, yang menentukan cara pengisian dan penampilannya di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya «Cakupan layanan», «Kanal yang berlaku», atau «Label kebutuhan». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Grup kotak centang biasanya disimpan sebagai array atau JSON, bergantung pada konfigurasi kolom dan kemampuan sumber data. |
| Default value | Nilai default. Saat membuat catatan baru, nilai default dapat diisi secara otomatis jika pengguna belum mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur apakah kolom wajib diisi dan menentukan rentang opsi yang diperbolehkan. |
| Description | Deskripsi kolom. Cocok digunakan untuk menjelaskan arti kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama kolom akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur kolom

Perilaku default kolom grup kotak centang adalah sebagai berikut:

| Fitur | Keterangan |
| --- | --- |
| Default Field interface | `checkboxGroup`. |
| Default Field type | `array`. |
| Field type yang tersedia | `array`、`json`, sesuai dengan pemetaan kolom yang sebenarnya. |
| Komponen halaman | Menggunakan grup kotak centang dalam mode pengeditan. |
| Filter | Mendukung pemfilteran berdasarkan ada tidaknya opsi tertentu. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung batasan kolom wajib diisi dan rentang opsi. |

## Pengeditan konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan kolom untuk mengedit konfigurasi kolom grup kotak centang. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan kolom—memetakan kolom database ke Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah dalam formulir pengeditan setelah kolom dibuat. |
| Field interface | Dengan syarat | Kolom database utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara pengisian, penampilan, dan validasi di halaman. |
| Field type | Dengan syarat | Kolom database utama atau kolom yang disinkronkan dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi arti kolom, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik «Delete» di sebelah kanan kolom untuk menghapus kolom grup kotak centang. Di database utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya sekaligus.

Saat menghapus kolom grup kotak centang yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di dalamnya biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah kolom tersebut masih digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Grup kotak centang cocok untuk menampilkan sejumlah kecil opsi pilihan ganda secara berjajar dalam formulir.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menampilkan semua opsi secara langsung dan memilih beberapa di antaranya. |
| Blok detail | Menampilkan beberapa opsi sebagai label atau teks. |
| Blok filter | Memfilter berdasarkan ada tidaknya opsi tertentu. |
| Alur kerja dan izin | Digunakan dalam penilaian sebagai kondisi seperti berisi atau tidak berisi. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Pilihan ganda dropdown](./multiple-select.md) — Digunakan saat jumlah opsi lebih banyak
- [Grup tombol radio](./radio-group.md) — Memilih satu nilai
