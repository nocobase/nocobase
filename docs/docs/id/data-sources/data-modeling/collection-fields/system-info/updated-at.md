---
title: "Tanggal pembaruan"
description: "Field tanggal pembaruan digunakan untuk mencatat waktu terakhir pembaruan suatu record secara otomatis."
keywords: "tanggal pembaruan,updatedAt,field sistem,NocoBase"
---

# Tanggal pembaruan

## Pendahuluan

Di NocoBase, **tanggal pembaruan (Updated at)** digunakan untuk mencatat waktu terakhir pembaruan record secara otomatis.

Tanggal pembaruan biasanya dibuat oleh field bawaan. Field ini cocok untuk audit, menentukan sinkronisasi, pengurutan, penyaringan, dan kondisi workflow.

Jika perlu menyimpan waktu penyelesaian, waktu persetujuan, atau waktu bisnis lainnya, gunakan [tanggal dan waktu](../datetime/datetime.md).

## Skenario penggunaan

Tanggal pembaruan cocok untuk skenario bisnis berikut:

- Melihat waktu pembaruan terakhir
- Menyaring data yang baru saja diperbarui
- Menentukan apakah data sudah lama tidak dipelihara
- Membandingkan waktu pembaruan saat menyinkronkan sistem eksternal

## Membuat konfigurasi

Pada halaman 「Configure fields」 tabel data, klik 「Add field」, lalu pilih 「Tanggal pembaruan」 untuk membuat field tanggal pembaruan.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Tanggal pembaruan menggunakan `updatedAt`, yang menentukan cara field diinput dan ditampilkan pada halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「Tanggal pembaruan」 atau 「Waktu pembaruan terakhir」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama identitas field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Setelah dibuat, nama ini biasanya tidak diubah lagi; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Tanggal pembaruan biasanya menggunakan `date`. |
| Default value | Nilai default. Saat membuat record baru, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Dikelola secara otomatis oleh sistem dan biasanya tidak memerlukan validasi manual. |
| Description | Deskripsi field. Cocok digunakan untuk menjelaskan makna field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, workflow, dan API. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field tanggal pembaruan adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `updatedAt`. |
| Default Field type | `date`. |
| Field type yang tersedia | `date`. |
| Komponen halaman | Diisi otomatis oleh sistem dan biasanya hanya ditampilkan sebagai informasi baca saja pada halaman. |
| Penyaringan | Mendukung penyaringan berdasarkan waktu dan rentang waktu. |
| Pengurutan | Mendukung pengurutan berdasarkan waktu. |
| Validasi | Diisi otomatis oleh sistem. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field tanggal pembaruan. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang sudah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan pada antarmuka tanpa mengubah nama identitas field. |
| Field name | Tidak | Nama identitas field biasanya tidak dapat diubah melalui formulir pengeditan setelah field dibuat. |
| Field interface | Tergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi pada halaman. |
| Field type | Tergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan makna field, persyaratan pengisian, sumber data, atau pihak yang memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara field disimpan, komponen input, aturan validasi, kondisi penyaringan, dan cara variabel digunakan dalam workflow. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field tanggal pembaruan. Di database utama, Anda juga dapat memilih beberapa field sekaligus untuk menghapusnya secara massal.

Saat menghapus field tanggal pembaruan yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di kolom tersebut biasanya ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, penyaringan, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field tanggal pembaruan cocok digunakan pada daftar, detail, penyaringan, dan penentuan sinkronisasi.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok tabel | Menampilkan dan mengurutkan waktu pembaruan terakhir. |
| Blok penyaringan | Menyaring record yang baru saja diperbarui atau sudah lama tidak diperbarui. |
| Blok detail | Melihat waktu pembaruan terakhir. |
| Workflow | Digunakan sebagai kondisi waktu dalam proses penentuan. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field di tabel biasa
- [Tanggal pembuatan](./created-at.md) — Mencatat waktu pembuatan secara otomatis
- [Tanggal dan waktu (dengan zona waktu)](../datetime/datetime.md) — Menyimpan waktu bisnis
