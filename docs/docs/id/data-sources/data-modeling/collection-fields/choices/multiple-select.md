---
title: "Pilihan dropdown multipel"
description: "Bidang pilihan dropdown multipel digunakan untuk memilih beberapa nilai dari opsi yang telah ditentukan, cocok untuk bidang seperti label, kemampuan, preferensi, dan lainnya."
keywords: "pilihan dropdown multipel,multiple select,label,bidang opsi,NocoBase"
---

# Pilihan dropdown multipel

## Pengenalan

Di NocoBase, **pilihan dropdown multipel (Multiple select)** digunakan untuk memilih beberapa nilai dari sekumpulan opsi.

Pilihan dropdown multipel cocok untuk bidang seperti label, kemampuan, preferensi, cakupan penerapan, dan lainnya. Bidang ini menyimpan beberapa nilai opsi dan biasanya menampilkannya dalam bentuk label di halaman.

Jika hanya dapat memilih satu nilai, pilih [pilihan dropdown tunggal](./select.md) atau [grup tombol radio](./radio-group.md).

## Skenario penggunaan

Pilihan dropdown multipel cocok untuk skenario bisnis berikut:

- Label pelanggan dan preferensi pengguna
- Skenario penerapan produk dan kemampuan perangkat
- Titik risiko proyek dan klasifikasi masalah
- BIdang yang memungkinkan pemilihan beberapa nilai tetap

## Membuat konfigurasi

Di halaman 「Configure fields」 pada tabel data, klik 「Add field」, lalu pilih 「Pilihan dropdown multipel」 untuk membuat bidang pilihan dropdown multipel.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka bidang. Pilihan dropdown multipel menggunakan `multipleSelect`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk bidang di antarmuka, misalnya 「Label pelanggan」, 「Skenario penerapan」, atau 「Klasifikasi masalah」. Sebaiknya gunakan nama yang mudah dipahami langsung oleh pengguna bisnis. |
| Field name | Nama identifikasi bidang yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis bidang pada lapisan data. Pilihan dropdown multipel biasanya disimpan sebagai array atau JSON, bergantung pada konfigurasi bidang dan kemampuan sumber data. |
| Default value | Nilai default. Saat membuat catatan baru, nilai default dapat terisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur apakah bidang wajib diisi dan rentang opsi yang diperbolehkan. |
| Description | Deskripsi bidang. Cocok digunakan untuk menjelaskan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama bidang akan dirujuk oleh blok halaman, izin, alur kerja, dan API setelah dibuat. Pastikan penamaannya sebelum membuat bidang untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Karakteristik bidang

Perilaku default bidang pilihan dropdown multipel adalah sebagai berikut:

| Karakteristik | Deskripsi |
| --- | --- |
| Default Field interface | `multipleSelect`。 |
| Default Field type | `array`。 |
| Field type yang dapat dipilih | `array`、`json`, sesuai dengan pemetaan bidang yang sebenarnya. |
| Komponen halaman | Mode pengeditan menggunakan pemilih dropdown multipel. |
| Pemfilteran | Mendukung pemfilteran berdasarkan apakah suatu opsi tertentu disertakan. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung batasan bidang wajib diisi dan rentang opsi. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan bidang untuk mengedit konfigurasi bidang pilihan dropdown multipel. Pengeditan bidang terutama digunakan untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus bidang.

Jika bidang berasal dari tabel di database utama yang telah disinkronkan, pengeditan biasanya dilakukan untuk memetakan bidang—memetakan bidang database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan bidang di antarmuka tanpa mengubah nama identifikasi bidang. |
| Field name | Tidak | Nama identifikasi bidang biasanya tidak dapat diubah melalui formulir pengeditan setelah bidang dibuat. |
| Field interface | Tergantung kondisi | Bidang dari database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Tergantung kondisi | Bidang dari database utama atau bidang tersinkronisasi dapat disesuaikan saat pemetaan bidang. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru tersebut. |
| Default value | Ya | Menyesuaikan nilai default saat membuat catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi bidang. |
| Description | Ya | Menambahkan arti bidang, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Perubahan ini akan memengaruhi cara penyimpanan bidang, komponen input, aturan validasi, kondisi pemfilteran, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus bidang

Klik 「Delete」 di sebelah kanan bidang untuk menghapus bidang pilihan dropdown multipel. Di database utama, Anda juga dapat memilih beberapa bidang untuk dihapus secara massal.

Saat menghapus bidang pilihan dropdown multipel yang dibuat di database utama, kolom sebenarnya di database beserta data yang telah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus bidang yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal bidang terkait.

:::danger Peringatan

Menghapus bidang dapat memengaruhi blok halaman, formulir, pemfilteran, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah bidang tersebut masih dirujuk oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Bidang pilihan dropdown multipel cocok untuk menyatakan beberapa label atau beberapa opsi tetap.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Memilih beberapa nilai dari opsi. |
| Blok tabel | Menampilkan opsi sebagai beberapa label. |
| Blok pemfilteran | Memfilter berdasarkan label tertentu yang disertakan. |
| Alur kerja dan izin | Digunakan sebagai kondisi seperti menyertakan atau tidak menyertakan dalam penilaian. |

## Tautan terkait

- [Bidang](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan bidang
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola bidang di tabel biasa
- [Pilihan dropdown tunggal](./select.md) — Memilih satu nilai dari opsi
- [Grup kotak centang](./checkbox-group.md) — Memilih beberapa nilai menggunakan kotak centang
