---
title: "URL Lampiran"
description: "Kolom URL lampiran digunakan untuk menyimpan alamat file eksternal, cocok untuk skenario yang tidak memerlukan pengunggahan file."
keywords: "URL lampiran,attachment url,file eksternal,URL,NocoBase"
---

# URL Lampiran

## Pengenalan

Di NocoBase, **URL lampiran (Attachment URL)** digunakan untuk menyimpan alamat akses file eksternal.

Kolom URL lampiran cocok untuk skenario ketika file sudah disimpan di sistem eksternal, penyimpanan objek, atau CDN, dan hanya alamat aksesnya yang perlu disimpan di NocoBase.

Jika file perlu diunggah dan dikelola oleh NocoBase, pilih [Lampiran](../file-manager/field-attachment.md). Jika hanya berupa alamat halaman web biasa, pilih [URL](../data-modeling/collection-fields/basic/url.md).

## Skenario penggunaan

URL lampiran cocok untuk skenario bisnis berikut:

- Alamat file di penyimpanan objek eksternal
- Alamat gambar CDN
- Alamat dokumen sistem pihak ketiga
- Tautan file setelah migrasi data historis

## Membuat konfigurasi

Pada halaman «Configure fields» tabel data, klik «Add field», lalu pilih «URL lampiran» untuk membuat kolom URL lampiran.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Field interface | Jenis antarmuka kolom. URL lampiran sesuai dengan `attachmentUrl`, yang menentukan cara memasukkan dan menampilkannya di halaman. |
| Field display name | Nama yang ditampilkan untuk kolom di antarmuka, misalnya «Alamat file», «URL gambar», atau «Lampiran eksternal». Sebaiknya gunakan nama yang mudah dipahami langsung oleh staf bisnis. |
| Field name | Nama identifikasi kolom yang digunakan untuk referensi internal seperti API, kolom relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis kolom pada lapisan data. URL lampiran biasanya menggunakan `string` atau `text` untuk menyimpan alamat. |
| Default value | Nilai default. Saat menambahkan catatan baru, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat digunakan untuk mengatur format URL, panjang, atau kewajiban pengisian. |
| Description | Keterangan kolom. Cocok untuk menjelaskan arti kolom, persyaratan pengisian, sumber data, atau pihak yang bertanggung jawab memeliharanya. |

:::warning Perhatian

Nama kolom akan direferensikan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat kolom untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik kolom

Perilaku default kolom URL lampiran adalah sebagai berikut:

| Karakteristik | Keterangan |
| --- | --- |
| Field interface default | `attachmentUrl`. |
| Field type default | `string`. |
| Field type yang tersedia | `string`, `text`, sesuai dengan konfigurasi kolom aktual. |
| Komponen halaman | Mode pengeditan menggunakan komponen input URL atau alamat lampiran. |
| Filter | Mendukung filter berbasis teks dan pemeriksaan nilai kosong. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi format URL, panjang, kewajiban pengisian, dan lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan kolom untuk mengedit konfigurasi kolom URL lampiran. Pengeditan kolom terutama digunakan untuk menyesuaikan cara kolom ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, keterangan, nilai default, aturan validasi, atau konfigurasi khusus kolom.

Jika kolom berasal dari tabel yang sudah disinkronkan di database utama, pengeditan biasanya dilakukan untuk pemetaan kolom—memetakan kolom database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Keterangan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama kolom yang ditampilkan di antarmuka tanpa mengubah nama identifikasi kolom. |
| Field name | Tidak | Nama identifikasi kolom biasanya tidak dapat diubah melalui formulir pengeditan setelah kolom dibuat. |
| Field interface | Dengan syarat | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Penyesuaian ini akan memengaruhi cara memasukkan, menampilkan, dan memvalidasi data di halaman. |
| Field type | Dengan syarat | Kolom database utama atau kolom tersinkron dapat disesuaikan saat pemetaan kolom. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi kolom. |
| Description | Ya | Menambahkan arti kolom, persyaratan pengisian, sumber data, atau pihak yang bertanggung jawab memeliharanya. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan kolom, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format datanya sesuai.

:::

## Menghapus kolom

Klik «Delete» di sebelah kanan kolom untuk menghapus kolom URL lampiran. Di database utama, Anda juga dapat memilih beberapa kolom lalu menghapusnya secara massal.

Saat menghapus kolom URL lampiran yang dibuat di database utama, kolom fisik di database beserta data yang ada di dalamnya biasanya juga akan dihapus. Saat menghapus kolom yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal kolom terkait.

:::danger Peringatan

Penghapusan kolom dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang ada. Pastikan sebelum menghapus bahwa kolom tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Kolom URL lampiran cocok untuk menampilkan dan mengakses file eksternal.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memasukkan alamat file eksternal. |
| Blok detail | Menampilkan tautan file. |
| Blok tabel | Menampilkan tautan atau akses cepat ke thumbnail. |
| Alur kerja | Memasukkan alamat file ke dalam notifikasi atau permintaan eksternal. |

## Tautan terkait

- [Kolom](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan kolom
- [Tabel biasa](../data-source-main/general-collection.md) — Membuat dan mengelola kolom dalam tabel biasa
- [Lampiran](../file-manager/field-attachment.md) — Mengunggah dan mengaitkan file NocoBase
- [URL](../data-modeling/collection-fields/basic/url.md) — Menyimpan tautan biasa
