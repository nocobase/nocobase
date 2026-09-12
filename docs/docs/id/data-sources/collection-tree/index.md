---
pkg: "@nocobase/plugin-collection-tree"
title: "Tabel hierarki"
description: "Tabel hierarki digunakan untuk menyimpan data bertingkat seperti struktur organisasi, kategori produk, hierarki wilayah, direktori departemen, dan data lain dengan hubungan atasan-bawahan, menggunakan struktur adjacency list untuk menyimpan hubungan induk-anak."
keywords: "Tabel hierarki,Koleksi hierarki,Adjacency list,Data hierarkis,Tree Collection,NocoBase"
---

# Tabel hierarki

## Pengenalan

Tabel hierarki cocok untuk menyimpan data yang memiliki hubungan atasan-bawahan, seperti struktur organisasi, kategori produk, hierarki wilayah, direktori departemen, dan direktori basis pengetahuan. Tabel hierarki menggunakan struktur adjacency list untuk menyimpan hubungan induk-anak. Setiap record dapat menunjuk ke node induknya sendiri.

Tabel hierarki hanya dapat dibuat melalui halaman database utama. Database eksternal, sumber data REST API, dan sumber data NocoBase eksternal tidak mendukung pembuatan tabel hierarki.

## Skenario penggunaan

Tabel hierarki cocok untuk skenario bisnis berikut:

- Struktur organisasi perusahaan dan hierarki departemen
- Kategori produk, direktori basis pengetahuan, dan direktori dokumen
- Provinsi, kota, distrik, wilayah penjualan, dan hierarki titik layanan
- Kategori BOM, kategori peralatan, dan kategori aset

## Konfigurasi pembuatan

Di database utama, klik 「Create collection」, lalu pilih 「Tree collection」 untuk membuat tabel hierarki.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

Konfigurasi pembuatan tabel hierarki pada dasarnya sama dengan tabel biasa.

| Konfigurasi | Keterangan |
| --- | --- |
| Collection display name | Nama tabel yang ditampilkan di antarmuka, misalnya 「Struktur organisasi」「Kategori produk」「Hierarki wilayah」. |
| Collection name | Nama identitas tabel yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. |
| Inherits | Pilih tabel induk yang ingin diwarisi. Hanya terlihat jika database utama menggunakan PostgreSQL. |
| Categories | Kategori tabel. Kategori hanya memengaruhi cara pengorganisasian di antarmuka pengelolaan tabel, bukan struktur tabel. |
| Description | Deskripsi tabel. Anda dapat menuliskan jenis data bertingkat yang disimpan tabel ini, pihak yang memeliharanya, dan halaman tempat tabel ini digunakan sebagai filter. |
| Preset fields | Field prasetel. Saat membuat tabel hierarki, disarankan untuk mempertahankan field sistem dan field bawaan tabel hierarki. |

### Field bawaan

Setelah dibuat, tabel hierarki biasanya berisi field bawaan berikut. `parentId`, `parent`, dan `children` digunakan untuk menyimpan hubungan hierarkis.

| Field | Nama field | Keterangan |
| --- | --- | --- |
| ID | `id` | Field kunci utama default yang digunakan untuk mengidentifikasi satu record secara unik. |
| Waktu pembuatan | `createdAt` | Secara otomatis mencatat waktu pembuatan record ini. |
| Dibuat oleh | `createdBy` | Secara otomatis mencatat pengguna yang membuat record ini. |
| Waktu pembaruan | `updatedAt` | Secara otomatis mencatat waktu terakhir record ini diperbarui. |
| Diperbarui oleh | `updatedBy` | Secara otomatis mencatat pengguna yang terakhir memperbarui record ini. |
| Parent ID | `parentId` | Menyimpan ID node induk. Node akar biasanya kosong. |
| Parent | `parent` | Field relasi banyak-ke-satu yang menunjuk ke node induk dalam tabel saat ini. |
| Children | `children` | Field relasi satu-ke-banyak yang menunjukkan node anak dari node saat ini. |
| Ruang | `space` | Tersedia setelah [plugin multi-ruang](../../multi-app/multi-space/index.md) diaktifkan, dan digunakan untuk mengisolasi data berdasarkan ruang. Field ini tidak akan muncul jika multi-ruang tidak diaktifkan. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Perhatian

Hindari terbentuknya hubungan siklik dalam data tabel hierarki, misalnya node A memiliki B sebagai induk, sementara B kembali memiliki A sebagai induk. Hubungan siklik akan menyebabkan tampilan hierarki dan hasil filter menjadi tidak normal.

:::

### Field kunci utama

Seperti tabel biasa, tabel hierarki memerlukan field kunci utama. Field hubungan hierarkis mengaitkan ID node induk dengan record kunci utama dalam tabel yang sama.

Jika tabel hierarki tidak memiliki kunci utama, tetapkan 「Record unique key」 saat mengedit tabel. Jika tidak, beberapa blok halaman mungkin tidak dapat menampilkan atau mengedit record dengan benar, dan tampilan hierarki mungkin tidak dapat menemukan node secara stabil.

## Penggunaan dalam konfigurasi halaman

Tabel hierarki dapat menggunakan sebagian besar blok data dari [tabel biasa](../data-source-main/general-collection.md) untuk melakukan operasi tambah, hapus, ubah, dan lihat. Selain itu, tabel ini juga dapat digunakan bersama kemampuan hierarki:

| Blok | Kegunaan |
| --- | --- |
| [Blok tabel](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Menampilkan record hierarkis untuk melihat dan mengelola struktur atasan-bawahan. |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Menambahkan atau mengedit satu record node hierarkis. |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Melihat detail satu node hierarkis. |
| [Blok filter hierarki](../../interface-builder/blocks/filter-blocks/tree.md) | Memfilter blok data lain menggunakan struktur hierarki, biasanya untuk memfilter kategori, organisasi, wilayah, dan hierarki lainnya. |

## Edit konfigurasi

Dalam daftar tabel, klik 「Edit」 di sebelah kanan tabel hierarki untuk mengubah konfigurasi seperti nama tampilan tabel, kategori, deskripsi, mode pagination sederhana, dan 「Record unique key」.

Field hubungan induk-anak pada tabel hierarki biasanya tidak disarankan untuk dihapus atau diubah penggunaannya secara sembarangan. Jika perlu menyesuaikan struktur hierarki, ubah hubungan node induk langsung pada data record.

## Menghapus tabel

Dalam daftar tabel, klik 「Delete」 di sebelah kanan tabel hierarki untuk menghapusnya.

Menghapus tabel hierarki akan menghapus metadata Collection, tabel data sebenarnya, dan data hubungan hierarkis dari tabel tersebut. Sebelum menghapus, pastikan terlebih dahulu apakah blok halaman, blok filter hierarki, field relasi, izin, alur kerja, dan API masih bergantung padanya.

:::danger Peringatan

Tabel hierarki sering digunakan sebagai kondisi filter untuk blok lain. Setelah tabel hierarki dihapus, blok filter hierarki terkait dan konfigurasi halaman yang bergantung pada hierarki kategori tersebut mungkin tidak lagi berfungsi.

:::

## Tautan terkait

- [Tabel biasa](../data-source-main/general-collection.md) — Lihat konfigurasi umum dan cara menggunakan blok
- [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) — Mengaktifkan tampilan tabel hierarki dalam tabel
- [Blok filter hierarki](../../interface-builder/blocks/filter-blocks/tree.md) — Memfilter data menggunakan struktur hierarki
- [Multi-ruang](../../multi-app/multi-space/index.md) — Pelajari field ruang dan kemampuan isolasi ruang
