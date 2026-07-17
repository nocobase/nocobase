---
title: "Koleksi File"
description: "Koleksi file menyimpan judul file, nama file, ukuran, tipe MIME, path, URL, alamat pratinjau, lokasi penyimpanan, dan metadata ekstensi, yang digunakan untuk relasi dengan field lampiran."
keywords: "Koleksi File,File Collection,attachments,metadata,Lampiran,NocoBase"
---

# Koleksi File

<PluginInfo name="file-manager"></PluginInfo>

## Pengenalan

Koleksi file cocok untuk menyimpan metadata file, seperti nama file, ekstensi, ukuran, tipe MIME, path, URL, alamat pratinjau, lokasi penyimpanan, dan meta kustom. File itu sendiri disimpan oleh mesin penyimpanan file, sedangkan koleksi file menyimpan metadata file.

Koleksi file hanya dapat dibuat melalui halaman database utama. Database eksternal, sumber data REST API, dan sumber data NocoBase eksternal tidak mendukung pembuatan koleksi file.

## Skenario penggunaan

Koleksi file cocok untuk skenario bisnis berikut:

- Lampiran kontrak, file faktur, bukti penggantian biaya
- Gambar produk, dokumen identitas karyawan, dokumen proyek
- File yang diunggah, dipratinjau, dan diunduh dari catatan bisnis
- Repositori lampiran yang memerlukan pengelolaan metadata file secara terpisah

## Alur penggunaan

Koleksi file biasanya tidak digunakan secara langsung sebagai tabel bisnis utama. Alur yang umum adalah:

1. Membuat koleksi file untuk menyimpan metadata seperti judul file, nama file, ukuran, tipe, URL, dan lokasi penyimpanan.
2. Membuat field relasi di tabel bisnis untuk menghubungkannya ke koleksi file. Misalnya, menghubungkan tabel「Lampiran Kontrak」ke koleksi file「Lampiran Kontrak」.
3. Menambahkan field relasi di blok formulir tabel bisnis, sehingga pengguna dapat mengunggah file saat menambahkan atau mengedit catatan bisnis.
4. Setelah pengunggahan selesai, NocoBase akan menulis metadata file ke koleksi file dan menghubungkan catatan file dengan catatan bisnis saat ini melalui field relasi.
5. Menampilkan field lampiran di blok detail, blok tabel, atau blok daftar tabel bisnis, sehingga pengguna dapat melihat, mempratinjau, atau mengunduh file.

## Konfigurasi pembuatan

Di database utama, klik「Create collection」, lalu pilih「File collection」untuk membuat koleksi file.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

Konfigurasi pembuatan koleksi file pada dasarnya sama dengan tabel biasa. Koleksi file telah dilengkapi sekumpulan field metadata file bawaan untuk menyimpan judul, path, URL, lokasi penyimpanan, dan informasi ekstensi file yang diunggah.

| Konfigurasi | Keterangan |
| --- | --- |
| Collection display name | Nama yang ditampilkan untuk tabel di antarmuka, misalnya「Lampiran Kontrak」「File Faktur」「Gambar Produk」。 |
| Collection name | Nama identifikasi tabel, yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. |
| Categories | Kategori tabel. Kategori hanya memengaruhi cara pengorganisasian antarmuka pengelolaan tabel, bukan struktur tabel. |
| Description | Deskripsi tabel. Anda dapat menjelaskan file apa yang disimpan oleh koleksi file ini, siapa yang mengunggahnya, dan tabel bisnis mana yang terkait. |
| Preset fields | Field prasetel. Saat membuat koleksi file, sebaiknya pertahankan field sistem dan field bawaan koleksi file. |

### Field bawaan

Setelah dibuat, koleksi file biasanya berisi field bawaan berikut. File itu sendiri disimpan di penyimpanan file, sedangkan koleksi file menyimpan metadata berikut.

| Field | Nama field | Keterangan |
| --- | --- | --- |
| ID | `id` | Field kunci utama default, yang digunakan untuk mengidentifikasi satu catatan file secara unik. |
| Title | `title` | Judul file, biasanya digunakan untuk ditampilkan di antarmuka. |
| File name | `filename` | Nama file. |
| Extension name | `extname` | Ekstensi file. |
| Size | `size` | Ukuran file. |
| MIME type | `mimetype` | Tipe MIME file. |
| Path | `path` | Path file di penyimpanan. |
| URL | `url` | Alamat akses file. |
| Preview | `preview` | Alamat pratinjau file. |
| Storage | `storage` / `storageId` | Penyimpanan tempat file berada. `storage` adalah field relasi, sedangkan `storageId` adalah foreign key terkait. |
| Meta | `meta` | Metadata ekstensi file. |
| Waktu dibuat | `createdAt` | Secara otomatis mencatat waktu pembuatan catatan file. |
| Pembuat | `createdBy` | Secara otomatis mencatat pengguna yang mengunggah atau membuat catatan file. |
| Waktu diperbarui | `updatedAt` | Secara otomatis mencatat waktu pembaruan terakhir catatan file. |
| Diperbarui oleh | `updatedBy` | Secara otomatis mencatat pengguna yang terakhir memperbarui catatan file. |
| Ruang | `space` | Tersedia setelah [plugin multi-ruang](../../multi-app/multi-space/index.md) diaktifkan, digunakan untuk mengisolasi data berdasarkan ruang. Field ini tidak akan muncul jika multi-ruang tidak diaktifkan. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Field kunci utama

Koleksi file, sama seperti tabel biasa, memerlukan field kunci utama. Field lampiran dan field relasi akan menggunakan kunci utama untuk menghubungkan metadata file.

Jika koleksi file tidak memiliki kunci utama, tetapkan「Record unique key」saat mengedit tabel data. Jika tidak, catatan lampiran mungkin tidak dapat dihubungkan, dipratinjau, atau diedit dengan benar.

## Membangun relasi
Buat field relasi di tabel bisnis untuk menghubungkannya ke koleksi file.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Penggunaan konfigurasi halaman

Data koleksi file biasanya dibuat secara otomatis melalui pengunggahan dengan komponen lampiran. Komponen ini digunakan di blok formulir, blok detail, atau blok relasi.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Lokasi konfigurasi | Tujuan |
| --- | --- |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Mengunggah lampiran dalam catatan tabel bisnis. |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Menampilkan, mempratinjau, atau mengunduh lampiran. |
| [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) | Menampilkan field lampiran dalam daftar. |
| [Blok relasi](../../interface-builder/blocks/data-blocks/table.md) | Mengelola langsung catatan file yang terkait dengan catatan bisnis saat ini. |


## Mengedit konfigurasi

Dalam daftar tabel data, klik「Edit」di sisi kanan koleksi file untuk mengubah nama tampilan, kategori, deskripsi, mode pagination sederhana,「Record unique key」, dan konfigurasi lainnya.

Field metadata file biasanya ditulis secara otomatis selama proses pengunggahan. Sebaiknya jangan mengubah `url`、`path`、`storageId` dan field lainnya menjadi makna bisnis yang berbeda. Jika perlu menambahkan informasi bisnis file, Anda dapat menambahkan field baru, misalnya「Tipe file」「Tahap terkait」「Diarsipkan」。

## Menghapus tabel data

Dalam daftar tabel data, klik「Delete」di sisi kanan koleksi file untuk menghapus koleksi file.

Menghapus koleksi file akan menghapus catatan metadata file dan metadata Collection terkait. Sebelum menghapus, pastikan terlebih dahulu apakah field lampiran, field relasi, blok halaman, izin, alur kerja, dan API di tabel bisnis masih bergantung padanya.

:::danger Peringatan

Koleksi file menyimpan metadata file. Menghapus catatan koleksi file dapat menyebabkan referensi lampiran dalam catatan bisnis tidak valid; apakah file itu sendiri ikut dihapus bergantung pada penyimpanan file dan konfigurasi bisnis. Sebelum melakukan operasi, pastikan terlebih dahulu apakah file tersebut masih digunakan oleh bisnis.

:::

## Tautan terkait

- [Tabel biasa](../data-source-main/general-collection.md) — Lihat konfigurasi umum dan cara penggunaan blok
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat konfigurasi field lampiran dan field relasi
- [Pengelola file](../../plugins/@nocobase/plugin-file-manager/index.md) — Lihat konfigurasi terkait penyimpanan file
- [Multi-ruang](../../multi-app/multi-space/index.md) — Pelajari field ruang dan kemampuan isolasi ruang
