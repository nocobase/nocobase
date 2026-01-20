---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Kolom Urutan

## Pendahuluan

Kolom urutan digunakan untuk mengurutkan catatan dalam sebuah koleksi, dengan dukungan pengurutan dalam grup.

:::warning
Karena kolom urutan adalah bagian dari koleksi yang sama, sebuah catatan tidak dapat ditetapkan ke beberapa grup saat menggunakan pengurutan grup.
:::

## Instalasi

Plugin bawaan, tidak memerlukan instalasi terpisah.

## Panduan Pengguna

### Membuat Kolom Urutan

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Saat membuat kolom urutan, nilai urutan akan diinisialisasi:

- Jika pengurutan grup tidak dipilih, inisialisasi akan berdasarkan kolom kunci utama dan kolom tanggal pembuatan.
- Jika pengurutan grup dipilih, data akan dikelompokkan terlebih dahulu, kemudian inisialisasi akan berdasarkan kolom kunci utama dan kolom tanggal pembuatan.

:::warning{title="Penjelasan Konsistensi Transaksi"}
- Saat membuat kolom, jika inisialisasi nilai urutan gagal, kolom urutan tidak akan dibuat.
- Dalam rentang tertentu, jika sebuah catatan bergerak dari posisi A ke posisi B, nilai urutan semua catatan antara A dan B akan berubah. Jika ada bagian dari pembaruan ini yang gagal, seluruh operasi pemindahan akan dibatalkan, dan nilai urutan catatan terkait tidak akan berubah.
:::

#### Contoh 1: Membuat kolom sort1

Kolom sort1 tidak dikelompokkan.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Kolom urutan setiap catatan akan diinisialisasi berdasarkan kolom kunci utama dan kolom tanggal pembuatan.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Contoh 2: Membuat kolom sort2 berdasarkan pengelompokan ID Kelas

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Pada saat ini, semua catatan dalam koleksi akan dikelompokkan terlebih dahulu (dikelompokkan berdasarkan ID Kelas), kemudian kolom urutan (sort2) akan diinisialisasi. Nilai awal setiap catatan adalah:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Pengurutan Tarik-dan-Lepas

Kolom urutan utamanya digunakan untuk pengurutan tarik-dan-lepas catatan di berbagai blok. Blok yang saat ini mendukung pengurutan tarik-dan-lepas meliputi tabel dan papan.

:::warning
- Ketika kolom urutan yang sama digunakan untuk pengurutan tarik-dan-lepas, penggunaannya di beberapa blok dapat mengganggu urutan yang sudah ada.
- Kolom untuk pengurutan tarik-dan-lepas tabel tidak dapat menjadi kolom urutan dengan aturan pengelompokan.
  - Pengecualian: Dalam blok tabel relasi satu-ke-banyak, kunci asing dapat berfungsi sebagai grup.
- Saat ini, hanya blok papan yang mendukung pengurutan tarik-dan-lepas dalam grup.
:::

#### Pengurutan Tarik-dan-Lepas Baris Tabel

Blok tabel

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Blok tabel relasi

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Dalam blok relasi satu-ke-banyak:

- Jika kolom urutan yang tidak dikelompokkan dipilih, semua catatan dapat berpartisipasi dalam pengurutan.
- Jika catatan dikelompokkan terlebih dahulu berdasarkan kunci asing dan kemudian diurutkan, aturan pengurutan hanya akan memengaruhi data dalam grup saat ini.

Efek akhirnya konsisten, tetapi jumlah catatan yang berpartisipasi dalam pengurutan berbeda. Untuk detail lebih lanjut, lihat [Penjelasan Aturan Pengurutan](#sorting-rule-explanation).
:::

#### Pengurutan Tarik-dan-Lepas Kartu Papan

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Penjelasan Aturan Pengurutan

#### Perpindahan antara elemen yang tidak dikelompokkan (atau dalam grup yang sama)

Misalkan ada sekumpulan data:

```
[1,2,3,4,5,6,7,8,9]
```

Ketika sebuah elemen, misalnya 5, bergerak maju ke posisi 3, hanya posisi item 3, 4, dan 5 yang berubah. Item 5 menempati posisi 3, dan item 3 serta 4 masing-masing bergeser mundur satu posisi.

```
[1,2,5,3,4,6,7,8,9]
```

Jika kemudian kita memindahkan item 6 mundur ke posisi 8, item 6 menempati posisi 8, dan item 7 serta 8 masing-masing bergeser maju satu posisi.

```
[1,2,5,3,4,7,8,6,9]
```

#### Perpindahan elemen antar grup yang berbeda

Saat mengurutkan berdasarkan grup, jika sebuah catatan dipindahkan ke grup lain, penugasan grupnya juga akan berubah. Contohnya:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Ketika item 1 dipindahkan setelah item 6 (perilaku bawaan), grupnya juga akan berubah dari A menjadi B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Perubahan urutan tidak terkait dengan data yang ditampilkan di antarmuka

Misalnya, pertimbangkan sekumpulan data:

```
[1,2,3,4,5,6,7,8,9]
```

Antarmuka hanya menampilkan tampilan yang difilter:

```
[1,5,9]
```

Ketika item 1 dipindahkan ke posisi item 9, posisi semua item perantara (2, 3, 4, 5, 6, 7, 8) juga akan berubah, meskipun tidak terlihat.

```
[2,3,4,5,6,7,8,9,1]
```

Antarmuka kini menampilkan urutan baru berdasarkan item yang difilter:

```
[5,9,1]
```