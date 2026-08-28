---
title: "Field"
description: "Memahami fungsi Field NocoBase, cara membuat dan mengelolanya, skenario penggunaan berbagai jenis field, cara membuat field dari halaman, serta logika pemetaan field untuk sumber data utama dan sumber data eksternal."
keywords: "Field,Field type,Field interface,Pemetaan field,Field judul,Kendala unik,Field relasi,NocoBase"
---

# Field

## Pengenalan

Di NocoBase, **Field** adalah atribut bisnis dalam [Collection (tabel data)](../collection.md) yang digunakan untuk mendeskripsikan data. Field menjelaskan informasi apa saja yang dapat disimpan dalam sebuah record, serta bagaimana informasi tersebut dimasukkan, ditampilkan, difilter, dan digunakan dalam logika bisnis di halaman.

| Definisi | Penjelasan |
| --- | --- |
| Data apa yang disimpan | Misalnya teks, angka, tanggal, file, status, relasi, dan JSON. |
| Cara digunakan di halaman | Misalnya untuk memasukkan dan menampilkan data menggunakan kotak input, pemilih tanggal, menu tarik-turun, pengunggah lampiran, dan pemilih relasi. |
| Cara berpartisipasi dalam kemampuan bisnis | Field digunakan oleh blok halaman, filter, pengurutan, izin, alur kerja, API, impor dan ekspor data, serta fitur lainnya. |

Field dapat merujuk pada:
- Kolom database yang sebenarnya dalam database utama
- Kolom database yang sudah ada dalam database eksternal
- Field dalam view database
- Field dalam hasil kueri SQL
- Field dalam respons REST API
- Field relasi, field sistem, atau field virtual dalam tabel data

Anggaplah Field sebagai “atribut dari objek bisnis”. Contohnya:

| Objek bisnis | Field terkait |
| --- | --- |
| Pelanggan | Nama pelanggan, nomor ponsel, tingkat pelanggan, penanggung jawab |
| Pesanan | Nomor pesanan, jumlah pesanan, status pesanan, pelanggan |
| Kontrak | Nama kontrak, tanggal penandatanganan, lampiran kontrak, status persetujuan |
| Tugas | Judul tugas, waktu tenggat, prioritas, pelaksana |
| File | Nama file, ukuran, tipe MIME, URL |

## Skenario penggunaan

Di bawah ini adalah rangkuman skenario penggunaan umum berdasarkan kategori field. Bagian ini membantu Anda menentukan kategori field yang tepat. Untuk konfigurasi spesifik, pemetaan tipe, dan hal-hal yang perlu diperhatikan, lihat dokumentasi kategori terkait.

| Kategori field | Skenario penggunaan |
| --- | --- |
| [Field teks](./basic/input.md) | Cocok untuk menyimpan nama, nomor, keterangan, informasi kontak, alamat tautan, dan konten lainnya. |
| [Field teks kaya](./media/rich-text.md) | Cocok untuk menyimpan isi utama, dokumen penjelasan, solusi penanganan, potongan kode, dan konten kompleks lainnya. |
| [Field angka](./basic/number.md) | Cocok untuk menyimpan jumlah, nominal, penilaian, persentase, dan nilai numerik lainnya. |
| [Field tanggal dan waktu](./datetime/index.md) | Cocok untuk menyimpan titik waktu, tanggal, waktu, stempel waktu dari sistem eksternal, dan konten lainnya. |
| [Field status dan opsi](./choices/select.md) | Cocok untuk menyimpan nilai dalam rentang tetap, seperti apakah diaktifkan, status pesanan, tingkat pelanggan, dan label pelanggan. |
| [Field lampiran](./media/field-attachment.md) | Cocok untuk mengunggah file atau menyimpan alamat file eksternal. |
| [Field relasi](./associations/index.md) | Cocok untuk menyatakan hubungan antara tabel data yang berbeda, seperti pesanan dimiliki pelanggan, pelanggan memiliki pesanan, dan pengguna terkait dengan peran. |
| [Field identifikasi dan kode](./advanced/uuid.md) | Cocok untuk menyimpan kunci utama internal, ID sinkronisasi eksternal, identifikasi akses publik, dan nomor bisnis. |
| [Field geometri](./geometric/point.md) | Cocok untuk menyimpan informasi spasial atau geografis, seperti lokasi toko, rute pengiriman, dan area layanan. |
| [Field sistem](./system-info/created-at.md) | Cocok untuk menyimpan informasi sistem yang dikelola oleh NocoBase atau database, seperti ID, waktu dibuat, pembuat, dan waktu diperbarui. |
| [Field lainnya](./advanced/json.md) | Cocok untuk menangani kebutuhan field seperti pengurutan, formula, dan JSON yang tidak secara langsung termasuk dalam kategori lainnya. |

## Tipe Interface pada field

NocoBase mengelompokkan field ke dalam kategori berikut dari perspektif Interface:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipe data field

Setiap Field Interface memiliki tipe data default. Misalnya, untuk field dengan Interface angka (Number), tipe data defaultnya adalah double, tetapi dapat juga berupa float, decimal, dan lainnya. Saat ini tipe data yang didukung meliputi:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Pemetaan tipe field

Proses penambahan field pada database utama adalah:

1. Pilih tipe Interface
2. Konfigurasikan tipe data yang tersedia untuk Interface saat ini

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Proses pemetaan field pada sumber data eksternal adalah:

1. Secara otomatis memetakan tipe field yang sesuai (Field type) dan tipe UI (Field Interface) berdasarkan tipe field dalam database eksternal.
2. Jika diperlukan, ubah ke tipe data dan tipe Interface yang lebih sesuai

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)