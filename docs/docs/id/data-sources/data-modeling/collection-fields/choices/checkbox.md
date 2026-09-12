---
title: "Kotak centang"
description: "Field kotak centang digunakan untuk menyimpan nilai boolean seperti ya atau tidak, aktif atau nonaktif."
keywords: "kotak centang,checkbox,nilai boolean,boolean,NocoBase"
---

# Kotak centang

## Pengenalan

Di NocoBase, **kotak centang (Checkbox)** digunakan untuk menyimpan nilai boolean dengan dua pilihan.

Field kotak centang cocok untuk status aktif, apakah default, apakah selesai, apakah memerlukan persetujuan, dan penilaian sederhana lainnya. Maknanya lebih jelas daripada menyimpan “ya/tidak” sebagai teks.

Jika status memiliki lebih dari dua nilai, misalnya draf, sedang berlangsung, dan selesai, pilih [dropdown pilihan tunggal](./select.md).

## Skenario yang sesuai

Kotak centang cocok untuk skenario bisnis berikut:

- Apakah aktif, apakah default
- Apakah selesai, apakah sudah dibaca
- Apakah memerlukan persetujuan, apakah perlu diterbitkan faktur
- Apakah publik, apakah diarsipkan

## Membuat konfigurasi

Pada halaman «Configure fields» di tabel data, klik «Add field», lalu pilih «Kotak centang» untuk membuat field kotak centang.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Kotak centang sesuai dengan `checkbox`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya «Apakah aktif», «Apakah selesai», atau «Apakah perlu diterbitkan faktur». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field kotak centang secara default adalah `boolean`. |
| Default value | Nilai default. Saat menambahkan record baru, jika pengguna tidak mengisinya, nilai default dapat diisi secara otomatis. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur wajib diisi atau nilai default. |
| Description | Deskripsi field. Cocok untuk menuliskan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, izin, workflow, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik field

Perilaku default field kotak centang adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Field interface default | `checkbox`. |
| Field type default | `boolean`. |
| Field type yang tersedia | `boolean`. |
| Komponen halaman | Mode edit menggunakan kotak centang. |
| Penyaringan | Mendukung penyaringan berdasarkan ya, tidak, atau kosong. |
| Pengurutan | Mendukung pengurutan berdasarkan nilai boolean. |
| Validasi | Mendukung konfigurasi dasar seperti wajib diisi dan nilai default. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field kotak centang. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang sudah disinkronkan dalam database utama, pengeditan biasanya dilakukan untuk memetakan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama identifikasinya. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah di formulir edit setelah dibuat. |
| Field interface | Didukung dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung dengan syarat | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan makna field, persyaratan pengisian, sumber data, atau pengelola. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel workflow. Jika data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik «Delete» di sebelah kanan field untuk menghapus field kotak centang. Dalam database utama, beberapa field juga dapat dipilih lalu dihapus secara massal.

Saat menghapus field kotak centang yang baru dibuat di database utama, kolom sebenarnya di database beserta data yang sudah ada di kolom tersebut biasanya akan ikut terhapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Menghapus field dapat memengaruhi blok halaman, formulir, penyaringan, izin, workflow, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field kotak centang cocok digunakan dalam formulir, tabel, penyaringan, dan kondisi workflow.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan nilai ya atau tidak. |
| Blok tabel | Menampilkan status kotak centang dan mendukung penyaringan. |
| Blok penyaringan | Menyaring berdasarkan kondisi seperti apakah aktif atau apakah selesai. |
| Workflow dan izin | Digunakan sebagai kondisi boolean dalam penilaian. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Dropdown pilihan tunggal](./select.md) — Menyimpan satu nilai dari beberapa status
- [Grup tombol radio](./radio-group.md) — Menampilkan opsi dalam bentuk tombol pilihan tunggal