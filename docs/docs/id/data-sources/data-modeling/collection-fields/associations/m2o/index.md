---
title: "Banyak-ke-satu"
description: "Bidang relasi banyak-ke-satu (M2O), beberapa entitas terhubung ke entitas induk yang sama, seperti siswa-kelas."
keywords: "Banyak-ke-satu,M2O,BelongsTo,Relasi,NocoBase"
---


# Banyak-ke-satu

Sebuah basis data perpustakaan memiliki dua entitas: buku dan penulis. Seorang penulis dapat menulis banyak buku, tetapi setiap buku hanya memiliki satu penulis (dalam kebanyakan kasus). Dalam situasi ini, hubungan antara penulis dan buku adalah relasi banyak-ke-satu. Banyak buku dapat terhubung ke penulis yang sama, tetapi setiap buku hanya dapat memiliki satu penulis.

Relasi ER adalah sebagai berikut

![teks alt](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Konfigurasi bidang

![teks alt](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Deskripsi parameter

### Source collection

Tabel sumber, yaitu tabel tempat bidang saat ini berada.

### Target collection

Tabel target, yaitu tabel yang akan dihubungkan.

### Foreign key

Bidang pada tabel sumber yang digunakan untuk membangun hubungan antara kedua tabel.

### Target key

Bidang yang dirujuk oleh batasan kunci asing dan harus memiliki nilai unik.

### ON DELETE

ON DELETE mengacu pada aturan operasi terhadap referensi kunci asing di tabel anak yang terkait saat rekaman di tabel induk dihapus. Ini merupakan salah satu opsi saat menentukan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- CASCADE: Saat rekaman di tabel induk dihapus, semua rekaman terkait di tabel anak akan dihapus secara otomatis.
- SET NULL: Saat rekaman di tabel induk dihapus, nilai kunci asing yang terkait di tabel anak akan diatur menjadi NULL.
- RESTRICT: Opsi default. Saat mencoba menghapus rekaman di tabel induk, penghapusan akan ditolak jika terdapat rekaman terkait di tabel anak.
- NO ACTION: Mirip dengan RESTRICT. Jika terdapat rekaman terkait di tabel anak, penghapusan rekaman di tabel induk akan ditolak.