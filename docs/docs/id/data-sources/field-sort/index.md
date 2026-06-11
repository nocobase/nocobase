---
pkg: "@nocobase/plugin-field-sort"
title: "Field Sort"
description: "Field sort untuk mengurutkan record Collection, mendukung pengelompokan terlebih dahulu lalu sort (sort1), digunakan untuk mengkustomisasi urutan tampilan record."
keywords: "field sort,Field Sort,sort grouping,sort1,NocoBase"
---
# Field Sort

## Pengantar

Field Sort digunakan untuk mengurutkan record dalam Collection, mendukung pengelompokan terlebih dahulu lalu sort (sort1).

:::warning
Karena Field Sort adalah field di Collection yang sama, saat sort dengan grouping, satu record yang sama tidak dapat berada di beberapa grup.
:::

## Instalasi

Plugin bawaan, tidak perlu diinstal secara terpisah.

## Panduan Penggunaan

### Membuat Field Sort

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Saat membuat Field Sort, nilai sort akan diinisialisasi:

- Jika tidak memilih grouping sort, akan diinisialisasi berdasarkan field Primary Key dan field tanggal pembuatan.
- Jika memilih grouping sort, data akan dikelompokkan terlebih dahulu, lalu diinisialisasi berdasarkan field Primary Key dan field tanggal pembuatan.

:::warning{title="Penjelasan Konsistensi Transaksi"}
- Saat membuat field, jika inisialisasi nilai sort gagal, Field Sort tidak akan dibuat;
- Dalam suatu rentang, ketika suatu record dipindah dari posisi A ke posisi B, nilai sort semua record dalam rentang AB akan berubah. Jika ada satu yang gagal, perpindahan akan gagal, dan nilai sort record terkait tidak akan berubah.
:::

#### Contoh 1: Membuat Field sort1

Field sort1 tanpa grouping

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Field sort setiap record akan diinisialisasi berdasarkan field Primary Key dan field tanggal pembuatan:

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Contoh 2: Membuat Field sort2 dengan Grouping berdasarkan Class ID

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Saat ini, semua record dalam Collection akan dikelompokkan terlebih dahulu (berdasarkan Class ID), lalu Field Sort (sort2) akan diinisialisasi. Nilai inisialisasi setiap record:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Drag and Drop Sort

Field Sort terutama digunakan untuk drag and drop sort record di berbagai block. Block yang saat ini mendukung drag and drop sort meliputi tabel dan kanban.

:::warning
- Saat Field Sort yang sama digunakan sebagai drag and drop sort, penggunaan campuran multi block dapat merusak sort yang sudah ada;
- Field drag and drop sort tabel tidak dapat memilih Field Sort dengan aturan grouping;
  - Pengecualian: Pada block tabel relasi One to Many, foreign key dapat digunakan sebagai grouping;
- Saat ini hanya block kanban yang mendukung drag and drop sort dengan grouping.
:::

#### Drag and Drop Sort Baris Tabel

Block tabel

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Block tabel relasi

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Pada block relasi One to Many

- Jika yang dipilih adalah Field Sort tanpa grouping, maka semua record dapat berpartisipasi dalam sort;
- Jika sort dengan grouping berdasarkan foreign key terlebih dahulu, maka aturan sort hanya akan memengaruhi data dalam grup saat ini.

Hasil akhirnya konsisten, tetapi jumlah record yang berpartisipasi dalam sort berbeda. Untuk penjelasan lebih detail, lihat [Penjelasan Aturan Sort](#penjelasan-aturan-sort)
:::

#### Drag and Drop Sort Kartu Kanban

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Penjelasan Aturan Sort

#### Pergeseran antar Elemen Tanpa Grouping (atau Grup yang Sama)

Misalkan ada sekelompok data

```
[1,2,3,4,5,6,7,8,9]
```

Ketika suatu elemen, misalnya 5 dipindah ke depan ke posisi 3, saat ini, hanya nomor urut 3,4,5 yang berubah, 5 menempati posisi 3, 3,4 masing-masing bergeser satu posisi ke belakang.

```
[1,2,5,3,4,6,7,8,9]
```

Saat ini lanjutkan dengan memindah 6 ke belakang ke posisi 8, 6 menempati posisi 8, 7,8 masing-masing bergeser satu posisi ke depan.

```
[1,2,5,3,4,7,8,6,9]
```

#### Perpindahan Elemen antar Grup yang Berbeda

Saat sort dengan grouping, ketika suatu record dipindah ke grup lain, grup miliknya juga akan berubah. Contoh sebagai berikut:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Ketika 1 dipindah ke 6 (default di belakang), grup tempat 1 berada juga akan berubah dari A menjadi B

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Perubahan Sort Tidak Terkait dengan Data yang Ditampilkan UI

Contoh ada sekelompok data

```
[1,2,3,4,5,6,7,8,9]
```

UI hanya menampilkan

```
[1,5,9]
```

Ketika 1 dipindah ke posisi 9, posisi data 2,3,4,5,6,7,8 di tengah semua akan berubah

```
[2,3,4,5,6,7,8,9,1]
```

UI menampilkan

```
[5,9,1]
```
