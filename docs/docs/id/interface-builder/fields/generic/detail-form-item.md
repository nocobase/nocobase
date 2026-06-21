---
title: "Field Detail"
description: "Field Detail: komponen Field read-only yang digunakan dalam Block Detail, menampilkan data dalam bentuk read-only."
keywords: "Field Detail, DetailFormItem, tampilan read-only, Block Detail, interface builder, NocoBase"
---

# Field Detail

## Pengantar

Konfigurasi Field Block Detail, Block List, Block Grid Card, dll. pada dasarnya konsisten, terutama mengontrol tampilan Field dalam status baca.

![20251025172851](https://static-docs.nocobase.com/20251025172851.png)

## Konfigurasi Field

### Format Field Tanggal

![20251025173005](https://static-docs.nocobase.com/20251025173005.png)

Untuk informasi lebih lanjut, lihat [Format Tanggal](/interface-builder/fields/specific/date-picker)

### Format Field Numerik

![20251025173242](https://static-docs.nocobase.com/20251025173242.png)

Mendukung konversi unit sederhana, pemisah ribuan, prefix-suffix, presisi, notasi ilmiah.

Untuk informasi lebih lanjut, lihat [Format Angka](/interface-builder/fields/field-settings/number-format)

### Aktifkan Klik untuk Membuka

Selain Field relasi yang mendukung klik untuk membuka Popup, Field biasa juga dapat mengaktifkan klik untuk membuka sebagai entri membuka Popup. Anda juga dapat mengatur cara membuka Popup (drawer, dialog, sub-page).

![20251025173549](https://static-docs.nocobase.com/20251025173549.gif)

### Cara Tampilan Konten yang Overflow

Saat konten Field overflow lebar, Anda dapat mengatur cara overflow

- Ellipsis (default)
- Wrap

![20251025173917](https://static-docs.nocobase.com/20251025173917.png)

### Komponen Field

Beberapa Field mendukung berbagai bentuk tampilan yang dapat diimplementasikan dengan berpindah komponen Field.

Contoh: Komponen `URL` dapat di-switch ke komponen `Preview`.

![20251025174042](https://static-docs.nocobase.com/20251025174042.png)

Contoh: Field relasi dapat di-switch ke tampilan yang berbeda. Dari komponen Field judul beralih ke `Sub-Detail` untuk menampilkan lebih banyak konten Field relasi.

![20251025174311](https://static-docs.nocobase.com/20251025174311.gif)

- [Edit Judul Field](/interface-builder/fields/field-settings/edit-title)
- [Edit Deskripsi Field](/interface-builder/fields/field-settings/edit-description)
- [Edit Tooltip Field](/interface-builder/fields/field-settings/edit-tooltip)
