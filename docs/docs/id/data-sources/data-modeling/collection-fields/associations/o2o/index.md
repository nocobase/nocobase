---
title: "One to One"
description: "Field relasi One to One (O2O), entitas dua Collection berkorespondensi satu-satu, digunakan untuk memisahkan aspek berbeda dari suatu entitas untuk disimpan."
keywords: "One to One,O2O,HasOne,BelongsTo,field terkait,NocoBase"
---

# One to One

Hubungan antara karyawan dan profil pribadi, setiap karyawan hanya bisa memiliki satu record profil pribadi, dan setiap record profil pribadi hanya bisa berkorespondensi dengan satu karyawan. Dalam situasi ini, hubungan antara karyawan dan profil pribadi adalah One to One.

Foreign key One to One dapat ditempatkan di Collection sumber atau Collection target. Jika menyatakan "Has One", lebih cocok menempatkan foreign key di Collection target; jika menyatakan "Belongs To", maka lebih cocok menempatkan foreign key di Collection sumber.

Sebagai contoh di atas, karyawan hanya memiliki satu profil pribadi, dan profil pribadi adalah milik karyawan, jadi foreign key ini cocok ditempatkan di Collection profil pribadi.

## One to One (Has One)

Menyatakan bahwa seorang karyawan memiliki satu record profil pribadi

Relasi ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Konfigurasi field

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## One to One (Belongs To)

Menyatakan bahwa suatu record profil pribadi adalah milik seorang karyawan

Relasi ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Konfigurasi field

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Penjelasan Parameter

### Source collection

Collection sumber, yaitu Collection tempat field saat ini berada.

### Target collection

Collection target, dengan Collection mana akan dihubungkan.

### Foreign key

Digunakan untuk membangun relasi antar dua Collection. Foreign key One to One dapat ditempatkan di Collection sumber atau Collection target. Jika menyatakan "Has One", lebih cocok menempatkan foreign key di Collection target; jika menyatakan "Belongs To", maka lebih cocok menempatkan foreign key di Collection sumber.

### Source key <- Foreign key (Foreign key di Collection target)

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan. Ketika foreign key ditempatkan di target, menyatakan "Has One".

### Target key <- Foreign key (Foreign key di Collection sumber)

Field yang dirujuk oleh constraint foreign key, harus memiliki keunikan. Ketika foreign key ditempatkan di Collection sumber, menyatakan "Belongs To".

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi foreign key di tabel anak yang terkait saat menghapus record di tabel parent. Ini adalah opsi yang digunakan saat mendefinisikan constraint foreign key. Opsi ON DELETE yang umum meliputi:

- CASCADE: Ketika record di tabel parent dihapus, semua record yang terkait di tabel anak akan otomatis dihapus.
- SET NULL: Ketika record di tabel parent dihapus, nilai foreign key di tabel anak yang terkait akan diatur menjadi NULL.
- RESTRICT: Opsi default. Ketika mencoba menghapus record di tabel parent, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
- NO ACTION: Mirip dengan RESTRICT, jika ada record di tabel anak yang terkait, penghapusan record tabel parent akan ditolak.
