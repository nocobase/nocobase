---
title: "Many to Many"
description: "Field relasi Many to Many (M2M), entitas dua Collection terhubung many-to-many, biasanya butuh tabel perantara, seperti siswa-mata kuliah."
keywords: "Many to Many,M2M,BelongsToMany,tabel perantara,field terkait,NocoBase"
---

# Many to Many

Dalam sistem pemilihan mata kuliah, ada dua entitas: siswa dan mata kuliah. Seorang siswa dapat memilih banyak mata kuliah, dan satu mata kuliah juga dapat dipilih oleh banyak siswa, hal ini membentuk relasi Many to Many. Dalam database relasional, untuk merepresentasikan hubungan Many to Many antara siswa dan mata kuliah, biasanya digunakan tabel perantara, seperti tabel pemilihan mata kuliah. Tabel ini dapat mencatat mata kuliah apa saja yang dipilih oleh setiap siswa, dan mata kuliah apa saja yang dipilih oleh siswa mana. Desain seperti ini dapat dengan baik merepresentasikan hubungan Many to Many antara siswa dan mata kuliah.

Relasi ER seperti berikut

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Konfigurasi field

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Penjelasan Parameter

### Source collection

Collection sumber, yaitu Collection tempat field saat ini berada.

### Target collection

Collection target, dengan Collection mana akan dihubungkan.

### Through collection

Tabel perantara, ketika ada hubungan Many to Many antara dua entitas, perlu menggunakan tabel perantara untuk menyimpan hubungan ini. Tabel perantara memiliki dua foreign key, yang digunakan untuk menyimpan hubungan antar dua entitas.

### Source key

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan.

### Foreign key 1

Field tabel perantara, digunakan untuk membangun relasi dengan Collection sumber.

### Foreign key 2

Field tabel perantara, digunakan untuk membangun relasi dengan Collection target.

### Target key

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan.

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi foreign key di tabel anak yang terkait saat menghapus record di tabel parent. Ini adalah opsi yang digunakan saat mendefinisikan constraint foreign key. Opsi ON DELETE yang umum meliputi:

- CASCADE: Ketika record di tabel parent dihapus, semua record yang terkait di tabel anak akan otomatis dihapus.
- SET NULL: Ketika record di tabel parent dihapus, nilai foreign key di tabel anak yang terkait akan diatur menjadi NULL.
- RESTRICT: Opsi default. Ketika mencoba menghapus record di tabel parent, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
- NO ACTION: Mirip dengan RESTRICT, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
