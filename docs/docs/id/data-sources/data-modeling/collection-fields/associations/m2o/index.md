---
title: "Many to One"
description: "Field relasi Many to One (M2O), beberapa entitas terhubung ke satu entitas parent, seperti siswa-kelas."
keywords: "Many to One,M2O,BelongsTo,terkait,NocoBase"
---


# Many to One

Sebuah database perpustakaan, dengan dua entitas: buku dan penulis. Seorang penulis dapat menulis banyak buku, tetapi setiap buku hanya memiliki satu penulis (dalam kebanyakan kasus). Dalam situasi ini, hubungan antara penulis dan buku adalah Many to One. Banyak buku dapat terhubung ke penulis yang sama, tetapi setiap buku hanya bisa memiliki satu penulis.

Relasi ER seperti berikut

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Konfigurasi field

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Penjelasan Parameter

### Source collection

Collection sumber, yaitu Collection tempat field saat ini berada.

### Target collection

Collection target, dengan Collection mana akan dihubungkan.

### Foreign key

Field Collection sumber, digunakan untuk membangun relasi antar dua Collection.

### Target key

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan.

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi foreign key di tabel anak yang terkait saat menghapus record di tabel parent. Ini adalah opsi yang digunakan saat mendefinisikan constraint foreign key. Opsi ON DELETE yang umum meliputi:

- CASCADE: Ketika record di tabel parent dihapus, semua record yang terkait di tabel anak akan otomatis dihapus.
- SET NULL: Ketika record di tabel parent dihapus, nilai foreign key di tabel anak yang terkait akan diatur menjadi NULL.
- RESTRICT: Opsi default. Ketika mencoba menghapus record di tabel parent, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
- NO ACTION: Mirip dengan RESTRICT, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
