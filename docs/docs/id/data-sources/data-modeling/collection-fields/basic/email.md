---
title: "Email"
description: "Field email digunakan untuk menyimpan alamat email dan menyediakan validasi format email."
keywords: "email,email,informasi kontak,NocoBase"
---

# Email

## Pengenalan

Di NocoBase, **email (Email)** digunakan untuk menyimpan alamat email.

Field email cocok untuk email pelanggan, email karyawan, email pemasok, dan informasi kontak lainnya. Dibandingkan teks satu baris biasa, field ini menyediakan makna email dan validasi format yang lebih jelas.

Jika isinya bukan alamat email, melainkan hanya informasi kontak biasa, [teks satu baris](./input.md) lebih sesuai.

## Skenario penggunaan

Email cocok untuk skenario bisnis berikut:

- Email pelanggan, email kontak
- Email karyawan, email kontak untuk login
- Email pemasok, email layanan
- Alamat penerima notifikasi

## Pembuatan dan konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Email» untuk membuat field email.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Email sesuai dengan `email`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama field yang ditampilkan di antarmuka, misalnya «Email pelanggan», «Email kontak», atau «Email penerima». Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Secara default, field email adalah `string`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya validasi format email perlu diaktifkan, dan field juga dapat ditetapkan sebagai wajib diisi. |
| Description | Deskripsi field. Cocok digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan dirujuk oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat field

Perilaku default field email adalah sebagai berikut:

| Sifat | Deskripsi |
| --- | --- |
| Default Field interface | `email`. |
| Default Field type | `string`. |
| Field type yang tersedia | `string`. |
| Komponen halaman | Mode edit menggunakan kotak input dan memvalidasi format email. |
| Penyaringan | Mendukung penyaringan berbasis teks, seperti berisi, sama dengan, kosong, dan tidak kosong. |
| Pengurutan | Mendukung pengurutan di blok tabel. |
| Validasi | Mendukung validasi format email, wajib diisi, dan lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sisi kanan field untuk mengedit konfigurasi field email. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan dari database utama, pengeditan biasanya dilakukan untuk pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah pada formulir pengeditan setelah field dibuat. |
| Field interface | Bergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Bergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi penyaringan, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus field

Klik «Delete» di sisi kanan field untuk menghapus field email. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field email yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Menghapus field dapat memengaruhi blok halaman, formulir, penyaringan, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan terlebih dahulu apakah field tersebut masih dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field email cocok digunakan dalam formulir, detail, dan alur notifikasi.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memasukkan alamat email. |
| Blok detail | Menampilkan alamat email. |
| Blok penyaringan | Menyaring record berdasarkan alamat email. |
| Alur kerja dan notifikasi | Sebagai sumber penerima notifikasi email. |

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks satu baris](./input.md) — Menyimpan teks pendek biasa
- [Nomor ponsel](./phone.md) — Menyimpan nomor kontak
