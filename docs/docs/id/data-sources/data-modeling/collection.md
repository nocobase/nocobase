---
title: "Tabel Data"
description: "Memahami fungsi tabel data NocoBase, jenis struktur tabel, perbedaan antara database utama dan tabel data eksternal, serta cara memilih tabel biasa, tabel turunan, tabel hierarkis, tabel file, tabel SQL, dan view database."
keywords: "tabel data,Collection,tabel biasa,tabel turunan,tabel hierarkis,tabel file,tabel SQL,view database,NocoBase"
---

# Tabel data

## Pengenalan

Di NocoBase, **Collection (tabel data)** adalah model data yang digunakan untuk mendeskripsikan suatu jenis data bisnis. Collection bukan sekadar nama tabel database, melainkan deskripsi terpadu NocoBase untuk suatu jenis data.

Sebuah Collection biasanya mendefinisikan tiga hal:

| Definisi | Penjelasan |
| --- | --- |
| Di mana data disimpan | Data dapat berasal dari tabel database utama, tabel database eksternal, hasil kueri SQL, view database, sumber daya REST API, atau aplikasi NocoBase eksternal. |
| Kolom apa saja yang tersedia | Kolom menjelaskan informasi yang dimiliki setiap catatan, seperti nama pelanggan, nomor ponsel, jumlah pesanan, waktu pembuatan, dan penanggung jawab. |
| Bagaimana digunakan oleh NocoBase | Blok halaman, izin, alur kerja, API, dan kolom relasi semuanya bekerja berdasarkan Collection. |

Anda dapat memahami Collection sebagai “struktur data objek bisnis”. Misalnya, 「pelanggan」「pesanan」「kontrak」「tugas」 semuanya dapat menjadi sebuah Collection.

Setelah tabel data dibuat atau dihubungkan, biasanya masih perlu melakukan tiga hal:

- Mengonfigurasi kolom agar tabel data dapat menyimpan informasi yang diperlukan bisnis
- Di halaman, [menambahkan blok](../../interface-builder/blocks/index.md#添加区块) agar pengguna dapat melihat, memasukkan, dan memproses data
- Mengonfigurasi izin, alur kerja, dan API agar data dapat diakses dan mengalir sesuai aturan bisnis

## Jenis struktur tabel

- **Tabel biasa** — cocok untuk menyimpan data bisnis umum seperti pelanggan, pesanan, kontrak, tiket kerja, formulir penggantian biaya, proyek, dan tugas
- **Tabel hierarkis** — cocok untuk menyimpan data bertingkat seperti struktur organisasi, kategori produk, hierarki wilayah, direktori departemen, dan direktori basis pengetahuan
- **Tabel kalender** — cocok untuk menyimpan data dengan rentang waktu seperti pemesanan ruang rapat, jadwal proyek, jadwal pelajaran, rencana piket, dan agenda kegiatan
- **Tabel komentar** — cocok untuk menyimpan konten diskusi yang dihasilkan seputar catatan bisnis, seperti komentar tugas, komentar artikel, pendapat persetujuan, dan umpan balik pelanggan; buat [kolom relasi](./collection-fields/associations/index.md) pada tabel bisnis (tabel biasa, tabel hierarkis, tabel kalender) untuk menghubungkan tabel komentar, lalu gunakan halaman pop-up tabel bisnis untuk membuat [blok komentar](../../plugins/@nocobase/plugin-comments/index.md) dan memberikan komentar pada data bisnis
- **Tabel file** — cocok untuk menyimpan metadata file seperti lampiran kontrak, dokumen faktur, gambar produk, dan dokumen identitas karyawan; file sebenarnya disimpan oleh mesin penyimpanan file; buat [kolom relasi](./collection-fields/associations/index.md) pada tabel bisnis (tabel biasa, tabel hierarkis, tabel kalender) untuk menghubungkan tabel file, lalu gunakan blok yang dibuat dari tabel bisnis untuk mengonfigurasi kolom relasi dan mengunggah file; metadata file akan otomatis disimpan ke tabel file
- **View database** — view yang sudah ada di database, seperti view laporan keuangan, view pelanggan yang telah difilter, dan view agregasi setelah sinkronisasi lintas sistem
- **Tabel SQL** — cocok untuk menggunakan hasil kueri SQL seperti ringkasan penjualan, peringatan stok, laporan statistik lintas tabel, dan dasbor operasional sebagai tabel data
- **Tabel turunan** — beberapa jenis objek bisnis berbagi sekumpulan kolom umum, sementara setiap jenis memiliki kolom khususnya sendiri, seperti tabel induk aset yang diturunkan menjadi aset komputer, aset kendaraan, dan furnitur kantor
