---
title: "Nilai Default"
description: "Konfigurasi Field: mengkonfigurasi nilai default Field, mendukung nilai tetap, ekspresi, referensi variabel."
keywords: "nilai default, default value, default Field, interface builder, NocoBase"
---

# Nilai Default

## Pengantar

Nilai default adalah nilai awal Field dalam status tambah baru. Anda dapat menetapkan nilai default untuk Field saat mengkonfigurasi Field Collection, atau menentukan nilai default untuk Field di Block Form tambah baru. Dapat diatur sebagai konstanta atau variabel.

## Di Mana Dapat Mengatur Nilai Default

### Field Collection

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Field di Tambah Form

Sebagian besar Field di Tambah Form mendukung pengaturan nilai default.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Penambahan Sub-Form

Baik di Sub-Form di Tambah atau Edit Form, sub-data yang ditambahkan memiliki nilai default.

Add new Sub-Form
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Saat mengedit data yang sudah ada, ketika data kosong, nilai default tidak akan otomatis terisi. Hanya data baru yang ditambahkan yang akan diisi dengan nilai default.

### Nilai Default Data Relasi

Hanya relasi tipe "**many-to-one**" dan "**many-to-many**", dan menggunakan komponen selector (Select, RecordPicker), yang memiliki nilai default.

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variabel Nilai Default

### Variabel Apa Saja

- Pengguna saat ini;
- Record saat ini, hanya data yang sudah ada yang memiliki konsep record saat ini;
- Form saat ini, idealnya hanya menampilkan Field di Form;
- Objek saat ini, konsep di sub-form (objek data setiap baris di sub-form);
- Parameter URL
  Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables)

### Variabel Nilai Default Field

Dibagi menjadi dua kategori: Field non-relasi dan Field relasi.

#### Variabel Nilai Default Field Relasi

- Objek variabel harus berupa record collection;
- Harus berada di rantai inheritance Table, dapat berupa Table saat ini, atau Table parent-child;
- Variabel "Record terpilih Form" hanya tersedia di Field relasi "many-to-many" dan "one-to-many/many-to-one";
- **Saat multi-level, perlu di-flatten dan dedup**

```typescript
// Record terpilih Table:
[{id:1},{id:2},{id:3},{id:4}]

// Record terpilih Table/to-one:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Flatten dan dedup
[{id: 2}, {id: 3}]

// Record terpilih Table/to-many:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Flatten
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variabel Nilai Default Non-Relasi

- Tipe konsisten atau kompatibel, seperti string kompatibel dengan number, dan semua objek yang menyediakan metode toString;
- Field JSON cukup khusus, dapat menyimpan data apa pun;

### Level Field (Field Opsional)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Variabel nilai default non-relasi
  - Saat memilih Field multi-level, hanya terbatas pada relasi to-one, tidak mendukung relasi to-many;
  - Field JSON cukup khusus, dapat tidak dibatasi;

- Variabel nilai default relasi
  - hasOne, hanya mendukung relasi to-one;
  - hasMany, baik to-one (konversi internal) dan to-many keduanya bisa;
  - belongsToMany, baik to-one (konversi internal) dan to-many keduanya bisa;
  - belongsTo, umumnya to-one. Saat relasi parent adalah hasMany, juga mendukung to-many (karena hasMany/belongsTo pada dasarnya adalah relasi many-to-many);

## Penjelasan Kasus Khusus

### "Many-to-Many" Setara dengan Kombinasi "One-to-Many/Many-to-One"

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Mengapa One-to-One dan One-to-Many Tidak Memiliki Nilai Default?

Misalnya relasi A.B, b1 yang sudah diasosiasikan dengan a1 tidak dapat diasosiasikan dengan a2. Jika b1 diasosiasikan dengan a2, maka asosiasi dengan a1 akan dilepaskan. Dalam kasus ini, data tidak shared, sedangkan nilai default adalah mekanisme shared (semuanya dapat diasosiasikan), sehingga one-to-one dan one-to-many tidak dapat mengatur nilai default.

### Mengapa Sub-Form atau Sub-Table dari Many-to-One dan Many-to-Many Juga Tidak Dapat Memiliki Nilai Default?

Karena fokus sub-form dan sub-table adalah mengedit data relasi secara langsung (termasuk tambah, hapus), sedangkan nilai default relasi adalah mekanisme shared, semuanya dapat diasosiasikan, tetapi tidak dapat memodifikasi data relasi. Jadi dalam skenario ini tidak cocok untuk menyediakan nilai default.

Selain itu, sub-form atau sub-table memiliki sub-Field. Pengaturan nilai default sub-form atau sub-table sebagai nilai default baris atau nilai default kolom akan membingungkan.

Mempertimbangkan secara komprehensif, lebih cocok untuk tidak dapat langsung mengatur nilai default untuk sub-form atau sub-table apa pun relasinya.
