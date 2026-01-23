:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Nilai Default

## Pendahuluan

Nilai default adalah nilai awal sebuah *field* saat *record* baru dibuat. Anda dapat menetapkan nilai default untuk *field* saat mengonfigurasinya di sebuah **koleksi**, atau menentukan nilai default untuk *field* di blok formulir Tambah (*Add Form*). Nilai ini dapat diatur sebagai konstanta atau variabel.

## Di Mana Nilai Default Dapat Diatur

### *Field* **Koleksi**

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### *Field* dalam Formulir Tambah (*Add Form*)

Sebagian besar *field* dalam Formulir Tambah (*Add Form*) mendukung pengaturan nilai default.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Penambahan dalam Sub-formulir (*Sub-form*)

Sub-data yang ditambahkan melalui *field* sub-formulir, baik dalam formulir Tambah (*Add Form*) maupun Edit (*Edit Form*), akan memiliki nilai default.

Tambah baru (*Add new*) dalam sub-formulir
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Saat mengedit data yang sudah ada, *field* yang kosong tidak akan diisi dengan nilai default. Hanya data yang baru ditambahkan yang akan diisi dengan nilai default.

### Nilai Default untuk *Field* Relasi (*Association Fields*)

Hanya relasi tipe **Banyak-ke-Satu** (*Many-to-One*) dan **Banyak-ke-Banyak** (*Many-to-Many*) yang memiliki nilai default saat menggunakan komponen pemilih (*selector components*) (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variabel Nilai Default

### Variabel Apa Saja yang Tersedia

-   Pengguna saat ini;
-   *Record* saat ini; ini hanya berlaku untuk *record* yang sudah ada;
-   Formulir saat ini, idealnya hanya mencantumkan *field* dalam formulir;
-   Objek saat ini, sebuah konsep dalam sub-formulir (objek data untuk setiap baris dalam sub-formulir);
-   Parameter URL
    Untuk informasi lebih lanjut tentang variabel, lihat [Variabel](/interface-builder/variables)

### Variabel Nilai Default *Field*

Dibagi menjadi dua kategori: *field* non-relasi dan *field* relasi.

#### Variabel Nilai Default *Field* Relasi

-   Objek variabel harus berupa *record* **koleksi**;
-   Harus berupa **koleksi** dalam rantai pewarisan, yang bisa berupa **koleksi** saat ini atau **koleksi** induk/anak;
-   Variabel "Record yang dipilih di tabel" hanya tersedia untuk *field* relasi "Banyak-ke-Banyak" dan "Satu-ke-Banyak/Banyak-ke-Satu";
-   **Untuk skenario multi-level, perlu diratakan (*flattened*) dan dihilangkan duplikatnya (*deduplicated*)**

```typescript
// Record yang dipilih di tabel:
[{id:1},{id:2},{id:3},{id:4}]

// Record yang dipilih di tabel/ke-satu:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Ratakan dan hilangkan duplikat
[{id: 2}, {id: 3}]

// Record yang dipilih di tabel/ke-banyak:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Ratakan
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variabel Nilai Default Non-Relasi

-   Tipe harus konsisten atau kompatibel, misalnya, *string* kompatibel dengan angka, dan semua objek yang menyediakan metode `toString`;
-   *Field* JSON bersifat khusus dan dapat menyimpan semua jenis data;

### Level *Field* (*Field* Opsional)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

-   Variabel nilai default non-relasi
    -   Saat memilih *field* multi-level, ini terbatas pada relasi *to-one* dan tidak mendukung relasi *to-many*;
    -   *Field* JSON bersifat khusus dan dapat tidak terbatas;

-   Variabel nilai default relasi
    -   `hasOne`, hanya mendukung relasi *to-one*;
    -   `hasMany`, mendukung *to-one* (konversi internal) dan *to-many*;
    -   `belongsToMany`, mendukung *to-one* (konversi internal) dan *to-many*;
    -   `belongsTo`, umumnya untuk *to-one*, tetapi ketika relasi induk adalah `hasMany`, ia juga mendukung *to-many* (karena `hasMany/belongsTo` pada dasarnya adalah relasi *many-to-many*);

## Penjelasan Kasus Khusus

### "Banyak-ke-Banyak" Setara dengan Kombinasi "Satu-ke-Banyak/Banyak-ke-Satu"

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Mengapa Relasi Satu-ke-Satu dan Satu-ke-Banyak Tidak Memiliki Nilai Default?

Misalnya, dalam relasi A.B, jika `b1` terkait dengan `a1`, maka `b1` tidak dapat terkait dengan `a2`. Jika `b1` terkait dengan `a2`, maka keterkaitannya dengan `a1` akan dihapus. Dalam kasus ini, data tidak dibagikan (*shared*), sedangkan nilai default adalah mekanisme yang dibagikan (semua dapat terkait). Oleh karena itu, relasi Satu-ke-Satu (*One-to-One*) dan Satu-ke-Banyak (*One-to-Many*) tidak dapat memiliki nilai default.

### Mengapa Sub-formulir atau Sub-tabel Relasi Banyak-ke-Satu dan Banyak-ke-Banyak Tidak Dapat Memiliki Nilai Default?

Karena fokus sub-formulir dan sub-tabel adalah untuk langsung mengedit data relasi (termasuk menambah dan menghapus), sementara nilai default relasi adalah mekanisme yang dibagikan di mana semua dapat terkait, tetapi data relasi tidak dapat dimodifikasi. Oleh karena itu, tidak cocok untuk menyediakan nilai default dalam skenario ini.

Selain itu, sub-formulir atau sub-tabel memiliki sub-*field*, dan akan menjadi tidak jelas apakah nilai default untuk sub-formulir atau sub-tabel adalah nilai default baris atau nilai default kolom.

Dengan mempertimbangkan semua faktor, lebih tepat jika sub-formulir atau sub-tabel tidak dapat memiliki nilai default yang diatur secara langsung, terlepas dari jenis relasinya.