---
title: "Sub-Table (Edit Popup)"
description: "Field Sub-Table: mode edit Popup, klik untuk membuka Popup mengedit data terkait one-to-many."
keywords: "Sub-Table, edit Popup, SubTable, one-to-many, interface builder, NocoBase"
---

# Sub-Table (Edit Popup)

## Pengantar

Sub-Table (edit Popup) digunakan untuk mengelola data relasi to-many (seperti one-to-many, many-to-many) dalam Form. Table hanya menampilkan record yang sudah diasosiasikan, tambah/edit dilakukan di Popup, data akan disubmit bersama dengan Form utama.

## Petunjuk Penggunaan

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

Skenario yang Cocok:

- Field relasi: o2m / m2m / mbm
- Penggunaan tipikal: detail pesanan, list sub-item, tag/anggota terkait, dll.

## Konfigurasi Field

### Izinkan Memilih Data yang Sudah Ada (Default: Aktif)

Mendukung pemilihan data yang sudah ada untuk diasosiasikan.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Komponen Field

[Komponen Field](/interface-builder/fields/association-field): switch ke komponen Field relasi lainnya, seperti dropdown select, data picker, dll.

### Izinkan Melepaskan Asosiasi Data yang Sudah Ada (Default: Aktif)

> Mengontrol apakah data yang sudah diasosiasikan di Edit Form diizinkan untuk dilepaskan asosiasinya. Data yang baru ditambahkan selalu diizinkan untuk dihapus.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Izinkan Tambah Baru (Default: Aktif)

Mengontrol apakah tombol tambah ditampilkan. Saat pengguna tidak memiliki izin create di Table target saat ini, tombol akan dinonaktifkan dan menampilkan prompt no permission.

### Izinkan Edit Cepat (Default: Nonaktif)

Setelah diaktifkan, saat mouse hover ke cell akan muncul ikon edit, dapat dengan cepat mengedit konten cell.

Mendukung mengaktifkan edit cepat untuk semua Field di komponen Field relasi.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Juga mendukung mengaktifkan edit cepat untuk Field kolom tunggal.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Ukuran Pagination (Default: 10)

Atur jumlah record yang ditampilkan per halaman di Sub-Table.

## Penjelasan Perilaku

- Saat memilih record yang sudah ada akan dedup berdasarkan primary key, menghindari record yang sama diasosiasikan berulang
- Record yang baru ditambahkan akan langsung diisi kembali ke Sub-Table, default jump ke pagination yang berisi record baru
- Edit inline hanya memodifikasi data baris saat ini
- Hapus hanya akan melepaskan asosiasi di Form saat ini, tidak menghapus data sumber
- Data disubmit bersama dengan Form utama
