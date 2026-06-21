---
title: "Komponen Field Relasi"
description: "Komponen Field Relasi: konfigurasi umum dan penggunaan Field asosiasi seperti BelongsTo, HasMany, BelongsToMany, dll."
keywords: "Field Relasi, Association, BelongsTo, HasMany, BelongsToMany, interface builder, NocoBase"
---

# Komponen Field Relasi

## Pengantar

Komponen Field Relasi NocoBase dirancang untuk membantu pengguna lebih baik menampilkan dan memproses data terkait. Terlepas dari tipe relasi, komponen ini fleksibel dan universal, pengguna dapat memilih dan mengkonfigurasi komponen ini sesuai kebutuhan tertentu.

### Dropdown Select

Kecuali untuk semua Field relasi yang Table targetnya adalah Table file, komponen default dalam status edit adalah dropdown select. Opsi dropdown menampilkan nilai Field judul, cocok untuk skenario di mana data terkait dipilih dengan cepat melalui menampilkan satu informasi Field kunci.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Untuk informasi lebih lanjut, lihat [Dropdown Select](/interface-builder/fields/specific/select)

### Data Picker

Data Picker menampilkan data dalam bentuk Popup. Pengguna dapat mengkonfigurasi Field yang perlu ditampilkan (termasuk Field relasi dari relasi) di Data Picker, sehingga lebih akurat memilih data terkait.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Untuk informasi lebih lanjut, lihat [Data Picker](/interface-builder/fields/specific/picker)

### Sub-Form

Saat menangani data relasi yang lebih kompleks, menggunakan dropdown select atau data picker tidak akan nyaman. Dalam kasus ini, pengguna perlu sering membuka Popup. Untuk skenario ini, dapat menggunakan sub-form. Pengguna dapat langsung memelihara Field Table relasi di Page saat ini atau Block Popup saat ini, tanpa perlu berulang kali membuka Popup baru, alur Action lebih lancar. Relasi multi-level ditampilkan dalam bentuk Form bersarang.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Untuk informasi lebih lanjut, lihat [Sub-Form](/interface-builder/fields/specific/sub-form)

### Sub-Table

Sub-Table menampilkan record relasi one-to-many atau many-to-many dalam bentuk Table. Memberikan cara yang jelas dan terstruktur untuk menampilkan dan mengelola data terkait, mendukung pembuatan data batch baru atau memilih data yang sudah ada untuk diasosiasikan.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Untuk informasi lebih lanjut, lihat [Sub-Table](/interface-builder/fields/specific/sub-table)

### Sub-Detail

Sub-Detail adalah komponen yang sesuai dengan sub-form dalam mode baca, mendukung tampilan data relasi multi-level bersarang.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Untuk informasi lebih lanjut, lihat [Sub-Detail](/interface-builder/fields/specific/sub-detail)

### File Manager

File Manager adalah komponen Field relasi yang dirancang khusus untuk menangani Field relasi yang Table target relasinya adalah Table file.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Untuk informasi lebih lanjut, lihat [File Manager](/interface-builder/fields/specific/file-manager)

### Title

Komponen Field Title adalah komponen Field relasi yang digunakan dalam mode baca. Dengan mengkonfigurasi Field judul, dapat mengkonfigurasi komponen Field yang sesuai.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Untuk informasi lebih lanjut, lihat [Title](/interface-builder/fields/specific/title)
