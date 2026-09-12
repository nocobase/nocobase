---
title: "Banyak-ke-banyak"
description: "Bidang relasi banyak-ke-banyak (M2M), asosiasi banyak-ke-banyak antar-entitas dari dua tabel, biasanya memerlukan tabel perantara, seperti siswa-kursus."
keywords: "Banyak-ke-banyak,M2M,BelongsToMany,tabel perantara,bidang relasi,NocoBase"
---

# Banyak-ke-banyak

Dalam sistem pemilihan kursus, terdapat dua entitas, yaitu siswa dan kursus. Seorang siswa dapat mengikuti banyak kursus, dan sebuah kursus juga dapat diikuti oleh banyak siswa. Hal ini membentuk relasi banyak-ke-banyak. Dalam basis data relasional, untuk merepresentasikan relasi banyak-ke-banyak antara siswa dan kursus, biasanya digunakan sebuah tabel perantara, misalnya tabel pemilihan kursus. Tabel ini dapat mencatat kursus yang dipilih oleh setiap siswa dan siswa yang mengikuti setiap kursus. Desain seperti ini dapat merepresentasikan relasi banyak-ke-banyak antara siswa dan kursus dengan baik.

Relasi ER adalah sebagai berikut

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Konfigurasi bidang

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Penjelasan parameter

### Source collection

Tabel sumber, yaitu tabel tempat bidang saat ini berada.

### Target collection

Tabel target, yang menjadi tabel relasi.

### Through collection

Tabel perantara. Ketika terdapat relasi banyak-ke-banyak antara dua entitas, tabel perantara diperlukan untuk menyimpan relasi tersebut. Tabel perantara memiliki dua kunci asing yang digunakan untuk menyimpan relasi antara kedua entitas.

### Source key

Bidang yang dirujuk oleh batasan kunci asing dan harus memiliki nilai unik.

### Foreign key 1

Bidang pada tabel perantara yang digunakan untuk membangun relasi dengan tabel sumber.

### Foreign key 2

Bidang pada tabel perantara yang digunakan untuk membangun relasi dengan tabel target.

### Target key

Bidang yang dirujuk oleh batasan kunci asing dan harus memiliki nilai unik.

### ON DELETE

ON DELETE merujuk pada aturan operasi terhadap referensi kunci asing di tabel anak yang terkait ketika rekaman di tabel induk dihapus. Ini merupakan salah satu opsi saat mendefinisikan batasan kunci asing. Opsi ON DELETE yang umum meliputi:

- CASCADE: ketika rekaman di tabel induk dihapus, semua rekaman terkait di tabel anak akan dihapus secara otomatis.
- SET NULL: ketika rekaman di tabel induk dihapus, nilai kunci asing yang terkait di tabel anak akan diatur menjadi NULL.
- RESTRICT: opsi default. Ketika mencoba menghapus rekaman di tabel induk, penghapusan akan ditolak jika terdapat rekaman terkait di tabel anak.
- NO ACTION: mirip dengan RESTRICT. Jika terdapat rekaman terkait di tabel anak, penghapusan rekaman di tabel induk akan ditolak.