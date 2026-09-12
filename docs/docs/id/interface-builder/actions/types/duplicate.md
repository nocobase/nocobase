---
pkg: '@nocobase/plugin-action-duplicate'
title: "Action Duplikat"
description: "Action Duplikat: menduplikat record saat ini, membuat record baru dan mengisi data yang sama."
keywords: "Action Duplikat, Duplicate, duplikat record, interface builder, NocoBase"
---
# Duplikat

## Pengantar

Action Duplikat memungkinkan pengguna untuk dengan cepat membuat record baru berdasarkan data yang sudah ada. Mendukung dua cara duplikat: **Duplikat Langsung** dan **Duplikat ke Form dan Lanjutkan Mengisi**.

## Instalasi

Plugin bawaan, tidak perlu instalasi terpisah.

## Mode Duplikat

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplikat Langsung

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Secara default dieksekusi dengan cara "Duplikat Langsung";
- **Field Template**: Tentukan Field yang akan diduplikat, dapat memilih semua, wajib diisi.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Setelah konfigurasi selesai, klik tombol untuk menduplikat data.

### Duplikat ke Form dan Lanjutkan Mengisi

Field template yang dikonfigurasi akan diisi sebagai **nilai default** ke dalam Form. Pengguna dapat memodifikasi nilai Field template kemudian submit untuk menyelesaikan duplikat.


![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Konfigurasi Field Template**: Hanya Field yang dicentang yang akan dibawa keluar dan dijadikan nilai default.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sinkronisasi Field Form

- Otomatis menganalisis Field yang sudah dikonfigurasi di Block Form saat ini sebagai Field template;
- Jika Field Block Form selanjutnya dimodifikasi (seperti penyesuaian komponen Field relasi), perlu membuka konfigurasi template lagi dan klik **Sinkronisasi Field Form** untuk memastikan konsistensi.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Data template akan diisi sebagai nilai default Form, pengguna dapat memodifikasi kemudian submit untuk menyelesaikan duplikat.


### Catatan Tambahan

#### Duplikat, Reference, Preload

Field yang berbeda (tipe relasi) memiliki logika pemrosesan yang berbeda: **Duplikat / Reference / Preload**. **Komponen Field** Field relasi juga akan mempengaruhi logika pemrosesan:

- Select / Record picker: digunakan untuk **Reference**
- Sub-form / Sub-table: digunakan untuk **Duplikat**

**Duplikat**

- Field biasa adalah duplikat;
- hasOne / hasMany hanya bisa duplikat (relasi tipe ini tidak boleh menggunakan komponen Field tipe pemilihan seperti dropdown select, popup select, dll., harus menggunakan komponen Field seperti Sub-form, Sub-table);
- Perubahan komponen pada hasOne / hasMany **tidak akan** mengubah logika pemrosesan (tetap duplikat);
- Field relasi yang diduplikat, semua sub-Field dapat dipilih.

**Reference**

- belongsTo / belongsToMany adalah reference;
- Jika komponen Field disesuaikan dari "Dropdown Select" menjadi "Sub-form", relasi akan berubah dari **reference menjadi duplikat** (setelah berubah menjadi duplikat, semua sub-Field dapat dipilih).

**Preload**

- Field relasi di bawah Field reference adalah preload;
- Field preload mungkin berubah menjadi reference atau duplikat setelah perubahan komponen.

#### Pilih Semua

- Akan mencentang semua **Field Duplikat** dan **Field Reference**.

#### Record yang Dipilih sebagai Template Data Akan Memfilter Field Berikut

- Primary key data relasi yang diduplikat akan difilter; reference dan preload tidak memfilter primary key;
- Foreign key;
- Field yang tidak diizinkan duplikat;
- Field sort;
- Field auto-encoding;
- Password;
- Created by, Created at;
- Last updated by, Last updated at.

#### Sinkronisasi Field Form

- Otomatis menganalisis Field yang sudah dikonfigurasi di Block Form saat ini sebagai Field template;
- Setelah memodifikasi Field Block Form selanjutnya (seperti penyesuaian komponen Field relasi), perlu sinkronisasi lagi untuk memastikan konsistensi.
