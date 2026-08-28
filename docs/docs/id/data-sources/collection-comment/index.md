---
pkg: "@nocobase/plugin-comments"
title: "Tabel Komentar"
description: "Tabel komentar menyimpan komentar, balasan, dan umpan balik pada rekaman bisnis, serta mendukung konten teks kaya, pelacakan pengguna, komentar bertingkat, dan blok komentar."
keywords: "tabel komentar,fitur komentar,komentar teks kaya,komentar bertingkat,Collection Comment,NocoBase"
---

# Tabel Komentar

## Pengenalan

Tabel komentar cocok digunakan untuk menyimpan diskusi, umpan balik, dan anotasi yang berkaitan dengan rekaman bisnis. Misalnya, komentar tugas, pendapat dalam persetujuan, komentar artikel, dan umpan balik pelanggan dapat disimpan menggunakan tabel komentar.

Tabel komentar biasanya tidak digunakan sebagai tabel bisnis utama secara terpisah. Cara yang lebih umum adalah membuat tabel komentar terlebih dahulu, kemudian mengonfigurasi field relasi di tabel bisnis, dan terakhir menambahkan blok komentar di halaman detail atau pop-up rekaman bisnis.

![komentar-tabel-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Skenario penggunaan

Tabel komentar cocok untuk skenario bisnis berikut:

- Diskusi kolaboratif tentang tugas, kebutuhan, dan bug
- Pendapat penanganan untuk formulir persetujuan, tiket kerja, dan kontrak
- Komentar pada artikel, basis pengetahuan, dan pengumuman
- Umpan balik pelanggan, tindak lanjut purnajual, dan catatan internal

## Alur penggunaan

Tabel komentar biasanya digunakan bersama tabel bisnis dan blok komentar:

1. Buat tabel komentar untuk menyimpan konten komentar, hubungan balasan, pembuat, waktu pembuatan, dan informasi lainnya.
2. Buat field relasi di tabel bisnis untuk menghubungkannya ke tabel komentar. Misalnya, hubungkan tabel 「Tugas」 ke tabel 「Komentar Tugas」.
3. Tambahkan blok komentar di halaman detail atau pop-up tabel bisnis.
4. Pengguna dapat memposting komentar atau balasan di blok komentar. Data komentar akan ditulis ke tabel komentar dan dihubungkan ke rekaman bisnis saat ini.
5. Konfigurasikan izin tabel komentar sesuai kebutuhan bisnis untuk mengontrol siapa yang dapat melihat, membuat, atau menghapus komentar.

## Pembuatan dan konfigurasi

Klik 「Create collection」 di basis data utama, lalu pilih 「Comment collection」 untuk membuat tabel komentar.

![komentar-tabel-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Collection display name | Nama tabel yang ditampilkan di antarmuka, misalnya 「Komentar Tugas」, 「Pendapat Persetujuan」, atau 「Komentar Artikel」. |
| Collection name | Nama identifikasi tabel yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. |
| Inherits | Pilih tabel induk yang akan diwarisi. Hanya terlihat jika basis data utama menggunakan PostgreSQL. |
| Categories | Kategori tabel. Kategori hanya memengaruhi cara pengorganisasian antarmuka pengelolaan tabel, bukan struktur tabel. |
| Description | Deskripsi tabel. Anda dapat menjelaskan objek bisnis yang dilayani tabel komentar ini, pihak yang memeliharanya, dan cara merancang izin komentar. |
| Preset fields | Field prasetel. Saat membuat tabel komentar, disarankan untuk mempertahankan field sistem dan field bawaan tabel komentar. |

### Field bawaan

Setelah dibuat, tabel komentar biasanya berisi field bawaan berikut. Blok komentar terutama bergantung pada `content`, `createdBy`, dan `createdAt` untuk menampilkan konten komentar, pemberi komentar, dan waktu komentar.

| Field | Nama field | Deskripsi |
| --- | --- | --- |
| ID | `id` | Field kunci utama bawaan yang digunakan untuk mengidentifikasi satu rekaman komentar secara unik. |
| Konten komentar | `content` | Menyimpan isi komentar yang dimasukkan pengguna, secara default menggunakan komponen Markdown Vditor. |
| Waktu pembuatan | `createdAt` | Secara otomatis mencatat waktu pembuatan komentar dan digunakan oleh blok komentar untuk menampilkan waktu komentar. |
| Pembuat | `createdBy` | Secara otomatis mencatat pengguna yang memposting komentar dan digunakan oleh blok komentar untuk menampilkan pemberi komentar. |
| Waktu pembaruan | `updatedAt` | Secara otomatis mencatat waktu terakhir komentar diperbarui. |
| Diperbarui oleh | `updatedBy` | Secara otomatis mencatat pengguna yang terakhir memperbarui komentar. |
| Ruang | `space` | Tersedia setelah [plugin multi-ruang](../../multi-app/multi-space/index.md) diaktifkan dan digunakan untuk mengisolasi data berdasarkan ruang. Field ini tidak akan muncul jika multi-ruang tidak diaktifkan. |

:::warning Perhatian

Field bawaan tabel komentar biasanya dikelola oleh blok komentar. Sebaiknya jangan menghapusnya sembarangan atau mengubahnya menjadi makna bisnis lain. Jika perlu menyimpan kategori komentar, status penanganan, atau informasi lainnya, Anda dapat menambahkan field bisnis baru.

:::

### Field kunci utama

Seperti tabel biasa, tabel komentar juga memerlukan field kunci utama. Blok komentar menggunakan kunci utama untuk menemukan rekaman komentar dan hubungan balasan.

Jika tabel komentar tidak memiliki kunci utama, tetapkan 「Record unique key」 saat mengedit tabel data. Jika tidak, blok komentar mungkin tidak dapat melihat, membalas, atau menghapus komentar dengan benar.

## Membangun hubungan relasi
Buat field relasi di tabel bisnis untuk menghubungkannya ke tabel komentar
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Konfigurasi penggunaan halaman

Tabel komentar biasanya digunakan melalui blok komentar. Anda dapat menambahkan blok komentar di halaman detail, pop-up, atau halaman rekaman tabel bisnis agar pengguna dapat memberikan komentar seputar rekaman saat ini.

![Aktifkan Koleksi Komentar](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Lokasi konfigurasi | Kegunaan |
| --- | --- |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Menampilkan akses komentar di detail rekaman bisnis. |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Menggunakan field relasi komentar bersama alur pengeditan tabel bisnis. |
| Blok komentar | Menampilkan daftar komentar, memposting komentar, dan membalas komentar. |

## Edit konfigurasi

Di daftar tabel data, klik 「Edit」 di sebelah kanan tabel komentar untuk mengubah nama tampilan, kategori, deskripsi, mode paginasi sederhana, 「Record unique key」, dan konfigurasi lainnya.

Setelah tabel komentar digunakan dalam produksi, sebaiknya jangan mengubah field konten komentar dan field hubungan balasan sembarangan. Blok komentar, izin, alur kerja, dan API mungkin bergantung pada field-field tersebut.

## Hapus tabel data

Di daftar tabel data, klik 「Delete」 di sebelah kanan tabel komentar untuk menghapus tabel komentar.

Menghapus tabel komentar akan menghapus rekaman komentar, hubungan balasan, dan metadata Collection terkait. Sebelum menghapus, pastikan apakah field relasi di tabel bisnis, blok komentar, izin, alur kerja, dan API masih bergantung padanya.

:::danger Peringatan

Menghapus tabel komentar akan menyebabkan rekaman bisnis yang ada kehilangan data komentar. Komentar biasanya memuat proses kolaborasi dan pendapat penanganan. Sebelum melakukan tindakan ini, pastikan apakah perlu membuat cadangan atau arsip.

:::

## Tautan terkait

- [Tabel biasa](../data-source-main/general-collection.md) — Lihat konfigurasi umum dan cara menggunakan blok
- [Field relasi](../data-modeling/collection-fields/associations/index.md) — Pahami cara menghubungkan tabel bisnis dengan tabel komentar
- [Plugin komentar](../../plugins/@nocobase/plugin-comments/index.md) — Lihat blok komentar dan kemampuan komentar
- [Multi-ruang](../../multi-app/multi-space/index.md) — Pahami field ruang dan kemampuan isolasi ruang