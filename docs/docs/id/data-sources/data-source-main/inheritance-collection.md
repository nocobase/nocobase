---
pkg: "@nocobase/plugin-data-source-main"
title: "Tabel pewarisan"
description: "Tabel pewarisan menurunkan tabel anak berdasarkan tabel induk. Tabel anak mewarisi struktur field dari tabel induk dan dapat menentukan fieldnya sendiri. Fitur ini hanya didukung jika database utama menggunakan PostgreSQL."
keywords: "Tabel pewarisan,Inheritance Collection,Pewarisan tabel,Ekstensi tabel data,PostgreSQL,NocoBase"
---

# Tabel pewarisan

## Pendahuluan

Tabel pewarisan merupakan perluasan dari tabel biasa, cocok untuk beberapa tabel data yang berbagi sekumpulan field umum, sementara setiap tabel anak memiliki field khususnya sendiri.

Misalnya, buat tabel induk 「Aset」 terlebih dahulu untuk menyimpan field umum seperti nomor aset, nama aset, tanggal pembelian, penanggung jawab, dan lainnya. Kemudian turunkan tabel anak seperti 「Aset komputer」「Aset kendaraan」「Furnitur kantor」. Tabel anak akan mewarisi struktur field dari tabel induk dan tetap dapat menentukan fieldnya sendiri.

:::warning Perhatian

Tabel pewarisan hanya dapat dibuat jika database utama menggunakan PostgreSQL. Database utama lainnya, database eksternal, sumber data REST API, dan sumber data NocoBase eksternal tidak mendukung tabel pewarisan.

:::

## Skenario penggunaan

Tabel pewarisan cocok untuk skenario bisnis berikut:

- Tabel induk aset menurunkan aset komputer, aset kendaraan, dan furnitur kantor
- Tabel induk personel menurunkan karyawan, tenaga alih daya, dan pengunjung
- Tabel induk pekerjaan menurunkan tugas, bug, dan kebutuhan
- Tabel induk kontrak menurunkan kontrak pembelian, kontrak penjualan, dan kontrak layanan

Prasyarat penggunaan tabel pewarisan adalah objek-objek tersebut memiliki field umum yang stabil, sementara perbedaan antar-tabel anak terutama terletak pada sedikit field khusus.

## Pembuatan dan konfigurasi

Di database utama, klik 「Create collection」, lalu pilih tabel biasa atau titik masuk pembuatan yang mendukung pewarisan. Setelah itu, pilih tabel induk melalui `Inherits`.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Konfigurasi | Keterangan |
| --- | --- |
| Collection display name | Nama yang ditampilkan oleh tabel data di antarmuka, misalnya 「Aset komputer」「Aset kendaraan」「Furnitur kantor」. |
| Collection name | Nama identitas tabel data yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. |
| Inherits | Pilih tabel induk yang akan diwarisi. Tabel data saat ini akan mewarisi struktur field dari tabel induk dan tetap dapat menentukan fieldnya sendiri. |
| Categories | Kategori tabel data. Kategori hanya memengaruhi pengaturan di antarmuka pengelolaan tabel data dan tidak mengubah struktur tabel data. |
| Description | Deskripsi tabel data. Anda dapat menuliskan jenis data yang disimpan tabel anak ini, tabel induk asalnya, dan pihak yang memeliharanya. |
| Preset fields | Field prasetel. Tabel pewarisan biasanya juga mempertahankan field ID, waktu pembuatan, pembuat, waktu pembaruan, dan pembaru dari tabel biasa. |

Tabel pewarisan dapat menggunakan cara konfigurasi blok dan field dari [tabel biasa](./general-collection.md). Bagi blok halaman, tabel ini tetap merupakan tabel data yang dapat digunakan untuk menambah, menghapus, mengubah, dan melihat data.

:::warning Perhatian

Tabel pewarisan cocok untuk objek bisnis yang strukturnya sangat mirip. Jika alur bisnis, izin, dan halaman untuk setiap objek sangat berbeda, biasanya lebih jelas jika objek tersebut dipisahkan menjadi tabel biasa lalu dihubungkan menggunakan field relasi.

:::

### Field bawaan

Tabel pewarisan akan mewarisi field yang sudah ada di tabel induk dan tetap dapat menambahkan fieldnya sendiri.

| Sumber field | Keterangan |
| --- | --- |
| Field tabel induk | Tabel anak akan mewarisi field umum dari tabel induk, seperti nomor aset, nama aset, dan penanggung jawab. |
| Field tabel anak | Tabel anak dapat menentukan field khususnya sendiri, seperti 「Model CPU」 pada aset komputer dan 「Nomor pelat」 pada aset kendaraan. |
| Field sistem | Jika `Preset fields` dipertahankan saat pembuatan, tabel akan memiliki field ID, waktu pembuatan, pembuat, waktu pembaruan, pembaru, dan lainnya. |

:::warning Perhatian

Field tabel induk akan memengaruhi semua tabel anak yang mewarisinya. Sebelum mengubah field tabel induk, pastikan halaman, izin, alur kerja, dan API tabel anak tidak bergantung pada field tersebut.

:::

### Field kunci utama

Tabel pewarisan, sama seperti tabel biasa, memerlukan field kunci utama. Saat membuat tabel, disarankan untuk mempertahankan field prasetel ID. Secara default, jenis kunci utamanya adalah `Snowflake ID (53-bit)`.

Jika tabel pewarisan hasil integrasi atau sinkronisasi tidak memiliki kunci utama, atur 「Record unique key」 saat mengedit tabel data. Jika tidak, blok halaman mungkin tidak dapat melihat atau mengedit data dengan benar.

## Penggunaan dalam konfigurasi halaman

Tabel pewarisan dapat digunakan pada sebagian besar blok halaman yang didukung tabel biasa. Penggunaan yang umum adalah mengonfigurasi setiap tabel anak sebagai blok tabel, formulir, detail, atau kanban yang terpisah.

| Blok | Kegunaan |
| --- | --- |
| [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) | Melihat, memfilter, mengurutkan, dan memproses data tabel anak secara massal. |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Menambahkan atau mengedit satu data tabel anak. |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Melihat detail satu data tabel anak. |
| [Blok kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Menampilkan data tabel anak dalam kelompok berdasarkan field seperti status, tahap, dan penanggung jawab. |

## Mengedit konfigurasi

Di daftar tabel data, klik 「Edit」 di sisi kanan tabel pewarisan untuk mengubah konfigurasi seperti nama tampilan tabel data, kategori, deskripsi, mode paginasi sederhana, dan 「Record unique key」.

Sebaiknya hubungan pewarisan tidak sering diubah setelah banyak konfigurasi bisnis yang ada menggunakannya. Blok halaman, field relasi, izin, dan alur kerja mungkin bergantung pada struktur field saat ini.

## Menghapus tabel data

Di daftar tabel data, klik 「Delete」 di sisi kanan tabel pewarisan untuk menghapus tabel pewarisan.

Menghapus tabel pewarisan akan menghapus metadata Collection tabel anak ini dan tabel data fisik di database utama. Sebelum menghapus, pastikan tidak ada blok halaman, field relasi, izin, alur kerja, atau API yang masih menggunakan tabel anak ini.

:::danger Peringatan

Menghapus tabel pewarisan tidak secara otomatis berarti menghapus tabel induk. Apakah objek yang bergantung juga dihapus ditentukan oleh opsi dalam konfirmasi penghapusan. Sebelum melakukan operasi, pastikan tabel induk dan tabel anak lainnya masih perlu dipertahankan atau tidak.

:::

## Link terkait

- [Tabel biasa](./general-collection.md) — Lihat konfigurasi umum tabel biasa
- [Database utama](./index.md) — Lihat jenis database yang didukung database utama
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat cara mengonfigurasi field