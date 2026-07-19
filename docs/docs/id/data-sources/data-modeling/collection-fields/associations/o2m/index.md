---
title: "Satu ke Banyak"
description: "Bidang relasi satu ke banyak (O2M), satu entitas terhubung dengan beberapa entitas anak, seperti penulis-artikel."
keywords: "Satu ke Banyak,O2M,HasMany,Relasi,NocoBase"
---

# Satu ke Banyak

Relasi antara kelas dan siswa: satu kelas dapat memiliki banyak siswa, tetapi satu siswa hanya dapat menjadi anggota satu kelas. Dalam hal ini, kelas dan siswa memiliki relasi satu ke banyak.

Relasi ER adalah sebagai berikut

![teks alternatif](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Konfigurasi bidang

![teks alternatif](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Penjelasan parameter

### Koleksi sumber

Tabel sumber, yaitu tabel tempat bidang saat ini berada.

### Koleksi target

Tabel target, yaitu tabel yang akan dihubungkan.

### Kunci sumber

Bidang yang dirujuk oleh batasan kunci asing dan harus memiliki nilai unik.

### Kunci asing

Bidang pada tabel target yang digunakan untuk membangun relasi antara kedua tabel.

### Kunci target

Bidang pada tabel target yang digunakan untuk menampilkan setiap record dalam blok relasi, biasanya berupa bidang yang memiliki nilai unik.

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi kunci asing di tabel anak saat record di tabel induk dihapus. Ini merupakan salah satu opsi saat menentukan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- CASCADE: saat record di tabel induk dihapus, semua record terkait di tabel anak akan otomatis dihapus.
- SET NULL: saat record di tabel induk dihapus, nilai kunci asing yang terkait di tabel anak akan diatur menjadi NULL.
- RESTRICT: opsi default; saat mencoba menghapus record di tabel induk, penghapusan akan ditolak jika terdapat record terkait di tabel anak.
- NO ACTION: mirip dengan RESTRICT; jika terdapat record terkait di tabel anak, penghapusan record di tabel induk akan ditolak.