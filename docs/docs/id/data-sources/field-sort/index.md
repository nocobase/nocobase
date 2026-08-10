---
pkg: "@nocobase/plugin-field-sort"
title: "Bidang pengurutan"
description: "Bidang pengurutan mengurutkan catatan tabel data, mendukung pengelompokan sebelum pengurutan, untuk menyesuaikan urutan tampilan catatan."
keywords: "bidang pengurutan,Bidang Sort,pengurutan grup,sort,NocoBase"
---
<!-- translation-inline-code: `sort1` `Class ID` `sort2` `Class ID` -->

# Bidang pengurutan

## Pengenalan

Di NocoBase, **bidang pengurutan (Sort)** digunakan untuk mencatat nilai urutan catatan dalam tabel data. Bidang ini umum digunakan untuk pengurutan drag-and-drop pada blok seperti tabel dan kanban.

Bidang pengurutan mendukung pengurutan tanpa pengelompokan, serta pengelompokan sebelum pengurutan. Pengurutan berdasarkan kelompok cocok untuk skenario “pengurutan mandiri dalam kelompok yang sama”, misalnya mengurutkan siswa berdasarkan kelas atau tugas berdasarkan status kanban.

:::warning Catatan

Karena bidang pengurutan adalah bidang dalam tabel yang sama, saat pengurutan berdasarkan kelompok, satu catatan tidak dapat muncul di beberapa kelompok secara bersamaan.

:::

## Instalasi

Bidang pengurutan disediakan oleh plugin bawaan dan tidak memerlukan instalasi terpisah.

## Membuat bidang pengurutan

Pada halaman «Configure fields» tabel data, klik «Add field», lalu pilih «Urutkan» untuk membuat bidang pengurutan.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Saat membuat bidang pengurutan, NocoBase akan menginisialisasi nilai urutan:

- Jika pengurutan berdasarkan kelompok tidak dipilih, inisialisasi akan dilakukan berdasarkan bidang kunci utama dan bidang tanggal pembuatan
- Jika pengurutan berdasarkan kelompok dipilih, data akan dikelompokkan terlebih dahulu, lalu diinisialisasi berdasarkan bidang kunci utama dan bidang tanggal pembuatan

:::warning Catatan

Saat membuat bidang, jika inisialisasi nilai urutan gagal, bidang pengurutan tidak akan dibuat. Dalam suatu rentang, jika sebuah catatan dipindahkan dari posisi A ke posisi B, nilai urutan semua catatan dalam interval AB akan berubah; jika salah satunya gagal, pemindahan akan gagal dan nilai urutan catatan terkait tidak akan berubah.

:::

### Membuat bidang pengurutan tanpa kelompok

Berikut adalah contoh pembuatan bidang , yang tidak menggunakan pengurutan berdasarkan kelompok.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Bidang pengurutan setiap catatan akan diinisialisasi berdasarkan bidang kunci utama dan bidang tanggal pembuatan.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Membuat bidang pengurutan berdasarkan kelompok

Berikut adalah pembuatan bidang  berdasarkan pengelompokan .

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Pada saat ini, semua catatan dalam tabel data akan dikelompokkan terlebih dahulu berdasarkan Class ID, lalu bidang pengurutan akan diinisialisasi.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Pengurutan drag-and-drop

Bidang pengurutan terutama digunakan untuk pengurutan drag-and-drop catatan di berbagai blok. Saat ini, blok yang mendukung pengurutan drag-and-drop adalah tabel dan kanban.

:::warning Catatan

- Saat bidang pengurutan yang sama digunakan untuk pengurutan drag-and-drop, penggunaan campuran di beberapa blok dapat merusak urutan yang sudah ada
- Bidang untuk pengurutan drag-and-drop tabel tidak dapat memilih bidang pengurutan dengan aturan pengelompokan
- Dalam blok tabel relasi satu-ke-banyak, kunci asing dapat digunakan sebagai kelompok
- Saat ini, hanya blok kanban yang mendukung pengurutan drag-and-drop berdasarkan kelompok

:::

### Pengurutan drag-and-drop baris tabel

Blok tabel dapat menggunakan bidang pengurutan untuk menyesuaikan urutan catatan dengan drag-and-drop.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Blok tabel relasi juga dapat menggunakan bidang pengurutan untuk pengurutan drag-and-drop.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Pengurutan drag-and-drop blok tabel relasi"></video>

:::warning Catatan

Dalam blok relasi satu-ke-banyak, jika memilih bidang pengurutan tanpa kelompok, semua catatan mungkin ikut diurutkan; jika dikelompokkan terlebih dahulu berdasarkan kunci asing lalu diurutkan, aturan pengurutan hanya akan memengaruhi data dalam kelompok saat ini. Hasil akhirnya mungkin tampak sama, tetapi cakupan catatan yang ikut diurutkan berbeda.

:::

### Pengurutan drag-and-drop kartu kanban

Blok kanban dapat menggunakan bidang pengurutan untuk menyesuaikan urutan kartu dengan drag-and-drop.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Penjelasan aturan pengurutan

### Pemindahan antarcatatan tanpa kelompok

Misalkan ada sekumpulan data:

```text
[1,2,3,4,5,6,7,8,9]
```

Saat 5 dipindahkan ke depan ke posisi 3, hanya nomor urut 3, 4, dan 5 yang berubah. 5 menempati posisi 3, sedangkan 3 dan 4 masing-masing mundur satu posisi.

```text
[1,2,5,3,4,6,7,8,9]
```

Kemudian, jika 6 dipindahkan ke belakang ke posisi 8, 6 menempati posisi 8, sedangkan 7 dan 8 masing-masing maju satu posisi.

```text
[1,2,5,3,4,7,8,6,9]
```

### Pemindahan antar kelompok yang berbeda

Dalam pengurutan berdasarkan kelompok, saat sebuah catatan dipindahkan ke kelompok lain, kelompok tempat catatan tersebut berada juga akan berubah. Misalkan ada dua kelompok data:

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Saat 1 dipindahkan ke belakang 6, kelompok tempat 1 berada juga akan berubah dari A menjadi B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### Perubahan pengurutan tidak terkait dengan data yang ditampilkan di antarmuka

Misalkan ada sekumpulan data:

```text
[1,2,3,4,5,6,7,8,9]
```

Antarmuka hanya menampilkan:

```text
[1,5,9]
```

Saat 1 dipindahkan ke posisi 9, posisi 2, 3, 4, 5, 6, 7, dan 8 di antaranya semuanya akan berubah.

```text
[2,3,4,5,6,7,8,9,1]
```

Tampilan akhir antarmuka adalah:

```text
[5,9,1]
```

## Tautan terkait

- [Bidang tabel data](../index.md) — Lihat tipe bidang dan penjelasan pemetaan bidang
- [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) — Gunakan pengurutan drag-and-drop dalam tabel
- [Blok kanban](../../interface-builder/blocks/data-blocks/kanban.md) — Gunakan pengurutan drag-and-drop dalam kanban