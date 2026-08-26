---
title: "Filter Form Block"
description: "Filter Form Block: mengkonfigurasi kondisi filter, melakukan filter pada Data Block, mendukung filter kombinasi multi-Field, refresh linkage."
keywords: "Filter Form, FilterForm, kondisi filter, filter data, refresh linkage, interface builder, NocoBase"
---

# Filter Form

## Pengantar

Filter Form memungkinkan pengguna untuk memfilter data dengan mengisi Field Form. Dapat digunakan untuk memfilter Block Table, Block Chart, Block List, dll.

## Cara Penggunaan

Mari kita mulai dengan contoh sederhana untuk dengan cepat memahami cara penggunaan Filter Form. Asumsikan kita memiliki Block Table yang berisi informasi pengguna, dan kita ingin dapat memfilter data melalui Filter Form. Seperti berikut ini:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Langkah konfigurasi adalah sebagai berikut:

1. Aktifkan mode konfigurasi, tambahkan Block "Filter Form" dan Block "Table" di Page.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Tambahkan Field "Nickname" di Block Table dan Block Filter Form.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Sekarang Anda dapat mulai menggunakannya.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Penggunaan Lanjutan

Block Filter Form mendukung lebih banyak konfigurasi lanjutan. Berikut adalah beberapa penggunaan umum.

### Mengaitkan Beberapa Block

Field Form tunggal dapat memfilter data dari beberapa Block secara bersamaan. Operasi spesifik adalah sebagai berikut:

1. Klik konfigurasi "Connect fields" Field.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Tambahkan Block target yang perlu dikaitkan, di sini kita pilih Block List di Page.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Pilih satu atau lebih Field di Block List untuk dikaitkan. Di sini kita pilih Field "Nickname".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klik tombol simpan untuk menyelesaikan konfigurasi, hasilnya seperti berikut:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Mengaitkan Block Chart

Referensi: [Filter Page dan Linkage](../../../data-visualization/guide/filters-and-linkage.md)

### Field Kustom

Selain memilih Field dari Collection, Anda juga dapat membuat Field Form melalui "Field Kustom". Misalnya, Anda dapat membuat Field dropdown single select dan mengkustomisasi opsinya. Operasi spesifik adalah sebagai berikut:

1. Klik opsi "Field Kustom", muncul antarmuka konfigurasi.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Isi judul Field, di "Tipe Field" pilih "Pilihan", dan konfigurasi opsi.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Field kustom yang baru ditambahkan perlu dikaitkan secara manual dengan Field Block target. Cara operasi adalah sebagai berikut:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurasi selesai, hasilnya seperti berikut:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Tipe Field yang saat ini didukung:

- Text Box
- Number
- Tanggal
- Pilihan
- Radio Box
- Checkbox
- Record Relasi

#### Record Relasi (Field Relasi Kustom)

"Record Relasi" cocok untuk skenario "filter berdasarkan record Table relasi". Misalnya di list pesanan, filter pesanan berdasarkan "Pelanggan", atau di list tugas filter tugas berdasarkan "Penanggung Jawab".

Penjelasan item konfigurasi:

- **Collection Target**: menunjukkan Collection mana yang akan dimuat record yang tersedia.
- **Field Judul**: digunakan untuk teks tampilan dropdown opsi dan label yang dipilih (seperti nama, judul).
- **Field Nilai**: digunakan untuk nilai yang disubmit saat filter sebenarnya, biasanya pilih Field primary key (seperti `id`).
- **Izinkan Multi-Select**: setelah diaktifkan dapat memilih beberapa record sekaligus.
- **Operator**: mendefinisikan bagaimana kondisi filter dicocokkan (lihat penjelasan "Operator" di bawah).

Konfigurasi yang Direkomendasikan:

1. `Field Judul` pilih Field yang readability tinggi (seperti "Nama"), hindari menggunakan ID murni untuk mempengaruhi usability.
2. `Field Nilai` prioritaskan Field primary key, memastikan filter stabil dan unik.
3. Skenario single select biasanya menonaktifkan `Izinkan Multi-Select`, skenario multi-select aktifkan `Izinkan Multi-Select` dan kombinasikan dengan `Operator` yang sesuai.

#### Operator

`Operator` digunakan untuk mendefinisikan hubungan pencocokan antara "nilai Field Filter Form" dan "nilai Field Block target".

### Collapse

Tambahkan tombol collapse, dapat collapse dan expand konten Filter Form, menghemat ruang Page.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Mendukung konfigurasi berikut:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Jumlah Baris yang Ditampilkan saat Collapse**: Atur jumlah baris Field Form yang ditampilkan dalam status collapse.
- **Default Collapse**: Setelah diaktifkan, Filter Form ditampilkan dalam status collapse secara default.
