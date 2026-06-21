---
title: "Field Table"
description: "Field Table: komponen kolom yang digunakan di Block Table, mendukung render kolom kustom, sort, filter."
keywords: "Field Table, TableColumn, kolom Table, render kolom, interface builder, NocoBase"
---

# Field Table

## Pengantar

Field Table selain mendukung penyesuaian lebar kolom, judul Field, sort untuk Field, juga mendukung lebih banyak konfigurasi tampilan personal untuk Field tertentu (seperti Field tanggal, Field relasi, Field numerik).

![20251024174558](https://static-docs.nocobase.com/20251024174558.png)

## Konfigurasi Field

### Format Field Tanggal

![20251024175303](https://static-docs.nocobase.com/20251024175303.png)

Untuk informasi lebih lanjut, lihat [Format Tanggal](/interface-builder/fields/specific/date-picker)

### Format Field Numerik

Mendukung konversi unit sederhana, pemisah ribuan, prefix-suffix, presisi, notasi ilmiah.

![20251024175445](https://static-docs.nocobase.com/20251024175445.png)

Untuk informasi lebih lanjut, lihat [Format Angka](/interface-builder/fields/field-settings/number-format)

### Aktifkan Edit Cepat

Saat edit cepat diaktifkan, ketika hover mouse pada kolom akan muncul tombol edit, klik untuk dengan cepat mengedit dan menyimpan data di Popup.

![20251025171158](https://static-docs.nocobase.com/20251025171158.gif)

### Aktifkan Klik untuk Membuka

Selain Field relasi yang mendukung klik untuk membuka Popup, Field biasa juga dapat mengaktifkan klik untuk membuka sebagai entri membuka Popup.

![20251025172308](https://static-docs.nocobase.com/20251025172308.gif)

### Cara Tampilan Konten yang Overflow

Saat konten kolom overflow lebar kolom Table, Anda dapat mengatur cara overflow

- Ellipsis (default)
- Wrap

![20251025172549](https://static-docs.nocobase.com/20251025172549.png)

### Fix Kolom

![20251025170858](https://static-docs.nocobase.com/20251025170858.gif)

### Komponen Field

Beberapa Field mendukung berbagai bentuk tampilan, pengguna dapat berpindah komponen Field untuk mengimplementasikan efek tampilan yang berbeda, memenuhi kebutuhan dalam berbagai skenario. Misalnya, Field tipe **URL** dapat di-switch ke komponen **Preview**, untuk lebih baik menampilkan konten link atau preview gambar.

![20251025171658](https://static-docs.nocobase.com/20251025171658.png)

### Style Tampilan

- Tag
- Text

![20251025172723](https://static-docs.nocobase.com/20251025172723.png)

### Dapat Di-sort

Saat ini sebagian besar tipe Field mendukung sort di server side. Setelah sort diaktifkan, mendukung sort data secara descending/ascending berdasarkan Field target.

![20251125221247](https://static-docs.nocobase.com/20251125221247.png)

#### Sort Field di Block Table

![20251125221425](https://static-docs.nocobase.com/20251125221425.gif)

#### Sort Field Sub-Table di Block Detail

![20251125221949](https://static-docs.nocobase.com/20251125221949.gif)
