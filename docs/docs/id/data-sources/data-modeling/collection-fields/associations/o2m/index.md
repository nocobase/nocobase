---
title: "One to Many"
description: "Field relasi One to Many (O2M), satu entitas terhubung ke beberapa entitas anak, seperti penulis-artikel."
keywords: "One to Many,O2M,HasMany,terkait,NocoBase"
---

# One to Many

Hubungan antara kelas dan siswa, satu kelas dapat memiliki banyak siswa, tetapi seorang siswa hanya bisa berada di satu kelas. Dalam situasi ini, hubungan antara kelas dan siswa adalah One to Many.

Relasi ER seperti berikut

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Konfigurasi field

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Penjelasan Parameter

### Source collection

Collection sumber, yaitu Collection tempat field saat ini berada.

### Target collection

Collection target, dengan Collection mana akan dihubungkan.

### Source key

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan.

### Foreign key

Field Collection target, digunakan untuk membangun relasi antar dua Collection.

### Target key

Field Collection target, digunakan untuk melihat setiap baris record pada block relasi, biasanya merupakan field yang memiliki keunikan.

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi foreign key di tabel anak yang terkait saat menghapus record di tabel parent. Ini adalah opsi yang digunakan saat mendefinisikan constraint foreign key. Opsi ON DELETE yang umum meliputi:

- CASCADE: Ketika record di tabel parent dihapus, semua record yang terkait di tabel anak akan otomatis dihapus.
- SET NULL: Ketika record di tabel parent dihapus, nilai foreign key di tabel anak yang terkait akan diatur menjadi NULL.
- RESTRICT: Opsi default. Ketika mencoba menghapus record di tabel parent, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
- NO ACTION: Mirip dengan RESTRICT, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
