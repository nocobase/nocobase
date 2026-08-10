---
title: "Waktu"
description: "Kolom waktu digunakan untuk menyimpan waktu dalam satu hari, seperti waktu mulai operasional dan waktu pengingat."
keywords: "waktu,time,kolom waktu,NocoBase"
---

# Waktu

## Pengenalan

Di NocoBase, **waktu (Time)** digunakan untuk menyimpan waktu dalam satu hari.

Kolom waktu cocok untuk data bisnis yang tidak terikat pada tanggal tertentu, seperti jam operasional, waktu pengingat, dan periode jadwal kerja.

Jika perlu menyimpan tanggal dan waktu secara bersamaan, pilih [tanggal dan waktu](./datetime.md).

## Skenario penggunaan

Waktu cocok untuk skenario bisnis berikut:

- Waktu mulai operasional dan waktu selesai operasional
- Waktu pengingat harian
- Waktu mulai dan selesai shift
- Konfigurasi waktu tetap

## Membuat konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」, lalu pilih 「时间」 untuk membuat kolom waktu.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Konfigurasi | Penjelasan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. Untuk waktu, pilih `time`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya 「开始时间」, 「提醒时间」, atau 「营业时间」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis kolom pada lapisan data. Secara default, kolom waktu adalah `time`. |
| Default value | Nilai default. Saat menambahkan record, nilai ini dapat otomatis diisi jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat dikonfigurasi sebagai wajib diisi, rentang waktu, dan lainnya. |
| Description | Penjelasan kolom. Cocok digunakan untuk menuliskan makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama kolom akan digunakan oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur kolom

Perilaku default kolom waktu adalah sebagai berikut:

| Fitur | Penjelasan |
| --- | --- |
| Field interface default | `time`. |
| Field type default | `time`. |
| Field type yang tersedia | `time`. |
| Komponen halaman | Mode edit menggunakan pemilih waktu. |
| Penyaringan | Mendukung penyaringan berdasarkan waktu, rentang, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan berdasarkan waktu. |
| Validasi | Mendukung validasi seperti wajib diisi dan rentang waktu. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan kolom untuk mengedit konfigurasi kolom waktu. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan untuk memetakan kolom—memetakan kolom database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Penjelasan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan kolom di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah melalui formulir edit setelah kolom dibuat. |
| Field interface | Tergantung kondisi | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Tergantung kondisi | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan makna kolom, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel dalam alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik 「Delete」 di sebelah kanan kolom untuk menghapus kolom waktu. Di database utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya sekaligus.

Saat menghapus kolom waktu yang dibuat di database utama, kolom nyata di database beserta data yang sudah ada di dalamnya biasanya akan dihapus secara bersamaan. Saat menghapus kolom yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Menghapus kolom dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan kolom tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom waktu cocok digunakan dalam formulir dan konfigurasi aturan.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih waktu dalam satu hari. |
| Blok tabel | Menampilkan, mengurutkan, dan menyaring waktu. |
| Blok penyaringan | Menyaring berdasarkan rentang waktu. |
| Alur kerja | Sebagai kolom kondisi waktu. |

## Tautan terkait

- [Kolom](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Tanggal](./date.md) — Hanya menyimpan tanggal
- [Tanggal dan waktu (dengan zona waktu)](./datetime.md) — Menyimpan tanggal dan waktu