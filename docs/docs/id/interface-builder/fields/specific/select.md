---
title: "Dropdown Select"
description: "Field Dropdown Select: dropdown single select/multi-select, mendukung asosiasi data source, pencarian remote, konfigurasi opsi."
keywords: "Dropdown Select, Select, single select multi-select, asosiasi data source, interface builder, NocoBase"
---

# Dropdown Select

## Pengantar

Dropdown Select mendukung pemilihan data dari data yang sudah ada di Table target untuk diasosiasikan atau menambahkan data ke Table target kemudian diasosiasikan. Opsi dropdown mendukung pencarian fuzzy.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Konfigurasi Field

### Atur Cakupan Data

Mengontrol cakupan data dropdown list.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/fields/field-settings/data-scope)

### Atur Aturan Sort

Mengontrol sort data Dropdown Select.

Contoh: Sort secara descending berdasarkan tanggal layanan.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Izinkan Tambah/Asosiasi Beberapa

Membatasi data relasi to-many hanya diizinkan untuk diasosiasikan satu data.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Field Judul

Field Judul adalah Field label yang ditampilkan di opsi.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Mendukung pencarian cepat berdasarkan Field Judul

Untuk informasi lebih lanjut, lihat [Field Judul](/interface-builder/fields/field-settings/title-field)


### Buat Cepat: Tambah Data Terlebih Dahulu Kemudian Pilih Data Tersebut

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Tambah dari Dropdown Menu

Setelah menambahkan data baru ke Table target, otomatis memilih data tersebut dan diasosiasikan setelah Form di-submit.

Tabel pesanan memiliki Field relasi many-to-one "Account".

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Tambah dari Popup

Tambah dari Popup cocok untuk skenario input yang lebih kompleks, dapat dikonfigurasi Form tambah baru.


![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)


[Komponen Field](/interface-builder/fields/association-field);
