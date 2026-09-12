---
title: "Grup tombol radio"
description: "Bidang grup tombol radio digunakan untuk menampilkan opsi secara berjajar di halaman dan memilih satu nilai dari opsi tersebut."
keywords: "grup tombol radio,radio group,bidang opsi,NocoBase"
---

# Grup tombol radio

## Pengenalan

Di NocoBase, **grup tombol radio (Radio group)** digunakan untuk memilih satu nilai dari sekumpulan opsi dan menampilkan opsi tersebut secara langsung di dalam formulir.

Grup tombol radio cocok untuk skenario dengan jumlah opsi yang sedikit dan pengguna perlu melihat semua opsi secara sekilas. Fungsinya mirip dengan pilihan tunggal dropdown, tetapi perbedaannya terutama terletak pada cara interaksi di halaman.

Jika opsinya banyak, pilih [pilihan tunggal dropdown](./select.md) untuk menghemat ruang. Jika ingin memilih beberapa opsi, pilih [grup kotak centang](./checkbox-group.md).

## Skenario penggunaan

Grup tombol radio cocok untuk skenario bisnis berikut:

- Tingkat prioritas: rendah, sedang, tinggi
- Jenis kelamin, tipe, opsi tambahan ya/tidak
- Hasil persetujuan: disetujui, ditolak
- Pemilihan cepat untuk sejumlah kecil opsi tetap

## Membuat konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Grup tombol radio» untuk membuat bidang grup tombol radio.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Grup tombol radio sesuai dengan `radioGroup`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk bidang di antarmuka, misalnya «Tingkat prioritas», «Hasil persetujuan», atau «Tipe». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Secara default, grup tombol radio adalah `string`, yang menyimpan nilai opsi yang dipilih. |
| Default value | Nilai default. Saat menambahkan catatan baru, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur bidang wajib diisi dan memelihara nilai opsi. |
| Description | Deskripsi bidang. Cocok digunakan untuk menuliskan arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama bidang akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang grup tombol radio adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Default Field interface | `radioGroup`. |
| Default Field type | `string`. |
| Field type yang dapat dipilih | `string`. |
| Komponen halaman | Mode edit menggunakan grup tombol radio. |
| Filter | Mendukung pemfilteran berdasarkan opsi. |
| Pengurutan | Mendukung pengurutan berdasarkan nilai opsi. |
| Validasi | Mendukung kewajiban pengisian dan pembatasan rentang opsi. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan bidang untuk mengedit konfigurasi bidang grup tombol radio. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan bidang—memetakan bidang database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah melalui formulir edit setelah bidang dibuat. |
| Field interface | Dengan syarat | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara memasukkan, menampilkan, dan memvalidasi data di halaman. |
| Field type | Dengan syarat | Bidang database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan arti bidang, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus bidang

Klik «Delete» di sebelah kanan bidang untuk menghapus bidang grup tombol radio. Di database utama, Anda juga dapat memilih beberapa bidang lalu menghapusnya secara massal.

Saat menghapus bidang grup tombol radio yang dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Menghapus bidang dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan bidang tersebut tidak lagi digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Grup tombol radio cocok untuk menampilkan sejumlah kecil opsi secara berjajar di dalam formulir.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menampilkan semua opsi secara langsung dan memilih satu opsi. |
| Blok detail | Menampilkan opsi yang dipilih. |
| Blok filter | Memfilter catatan berdasarkan opsi. |
| Alur kerja dan izin | Digunakan sebagai kondisi seperti status dan tipe dalam penentuan. |

## Tautan terkait

- [B bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang dalam tabel biasa
- [Pilihan tunggal dropdown](./select.md) — Digunakan saat jumlah opsi lebih banyak
- [Grup kotak centang](./checkbox-group.md) — Memilih beberapa nilai
