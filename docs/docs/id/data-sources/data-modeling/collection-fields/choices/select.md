---
title: "Pilihan Tunggal Dropdown"
description: "Kolom pilihan tunggal dropdown digunakan untuk memilih satu nilai dari opsi yang telah ditentukan, cocok untuk kolom seperti status, tingkat, jenis, dan lainnya."
keywords: "pilihan tunggal dropdown,select,kolom opsi,NocoBase"
---

# Pilihan Tunggal Dropdown

## Pengenalan

Di NocoBase, **pilihan tunggal dropdown (Select)** digunakan untuk memilih satu nilai dari sekumpulan opsi.

Pilihan tunggal dropdown cocok untuk kolom bisnis dengan rentang tetap, seperti status, tingkat, jenis, dan sumber. Opsi dapat dikonfigurasi dengan nama tampilan, nilai opsi, dan warna.

Jika perlu memilih beberapa nilai, pilih [pilihan ganda dropdown](./multiple-select.md). Jika hanya ada pilihan ya atau tidak, pilih [kotak centang](./checkbox.md).

## Skenario penggunaan

Pilihan tunggal dropdown cocok untuk skenario bisnis berikut:

- Status pesanan, status tiket, status persetujuan
- Tingkat pelanggan, sumber prospek, prioritas
- Jenis proyek, kategori aset, jenis kontrak
- Kolom yang hanya dapat memilih satu nilai dalam rentang yang telah ditentukan

## Pembuatan dan konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「Pilihan Tunggal Dropdown」 untuk membuat kolom pilihan tunggal dropdown.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Pilihan tunggal dropdown sesuai dengan `select`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「Status pesanan」「Tingkat pelanggan」「Prioritas」. Disarankan menggunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak dapat diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. Pilihan tunggal dropdown secara default adalah `string`, yang menyimpan nilai opsi yang dipilih. |
| Default value | Nilai default. Saat menambahkan rekaman, nilai default dapat diisi secara otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk menetapkan kolom wajib diisi dan mengelola nilai opsi. |
| Description | Deskripsi kolom. Cocok untuk menuliskan arti kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama kolom akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom pilihan tunggal dropdown adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Default Field interface | `select`. |
| Default Field type | `string`. |
| Field type yang tersedia | `string`. |
| Komponen halaman | Mode edit menggunakan pemilih dropdown. |
| Penyaringan | Mendukung penyaringan berdasarkan opsi. |
| Pengurutan | Mendukung pengurutan berdasarkan nilai opsi. |
| Validasi | Mendukung kolom wajib diisi dan pembatasan rentang opsi. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom pilihan tunggal dropdown. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel di database utama yang telah disinkronkan, pengeditan biasanya dilakukan untuk memetakan kolom—memetakan kolom database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah melalui formulir edit setelah kolom dibuat. |
| Field interface | Mendukung secara kondisional | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Penyesuaian akan memengaruhi cara halaman menerima input, menampilkan, dan memvalidasi data. |
| Field type | Mendukung secara kondisional | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikan, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan rekaman. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Melengkapi arti kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Penghapusan kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom pilihan tunggal dropdown. Di database utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom pilihan tunggal dropdown yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di dalamnya biasanya akan ikut dihapus. Saat menghapus kolom yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah kolom tersebut masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom pilihan tunggal dropdown cocok digunakan dalam formulir, tabel, kanban, dan penyaringan.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih satu nilai dari opsi dropdown. |
| Blok tabel | Menampilkan opsi sebagai label atau teks. |
| Blok kanban | Mengelompokkan berdasarkan opsi seperti status dan tahapan. |
| Blok penyaringan | Menyaring rekaman dengan cepat berdasarkan opsi. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Pilihan ganda dropdown](./multiple-select.md) — Memilih beberapa nilai dari opsi
- [Grup tombol pilihan tunggal](./radio-group.md) — Memilih satu nilai menggunakan grup tombol