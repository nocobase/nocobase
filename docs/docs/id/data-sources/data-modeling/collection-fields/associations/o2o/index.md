---
title: "Satu-ke-satu"
description: "Kolom relasi satu-ke-satu (O2O), dua entitas tabel yang saling berpasangan satu per satu, digunakan untuk menyimpan aspek berbeda dari suatu entitas secara terpisah."
keywords: "satu-ke-satu,O2O,HasOne,BelongsTo,kolom relasi,NocoBase"
---

# Satu-ke-satu

Relasi antara karyawan dan profil pribadi: setiap karyawan hanya dapat memiliki satu catatan profil pribadi, dan setiap catatan profil pribadi juga hanya dapat dikaitkan dengan satu karyawan. Dalam situasi ini, karyawan dan profil pribadi memiliki relasi satu-ke-satu.

Foreign key untuk relasi satu-ke-satu dapat ditempatkan di tabel sumber maupun tabel target. Jika relasi tersebut menyatakan “memiliki satu”, foreign key lebih tepat ditempatkan di tabel target; jika menyatakan “milik”, foreign key lebih tepat ditempatkan di tabel sumber.

Dalam contoh di atas, seorang karyawan hanya memiliki satu profil pribadi, dan profil pribadi tersebut merupakan milik karyawan. Oleh karena itu, foreign key ini lebih tepat ditempatkan di tabel profil pribadi.

## Satu-ke-satu (memiliki satu)

Menunjukkan bahwa seorang karyawan memiliki satu catatan profil pribadi

Relasi ER

![teks alt](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Konfigurasi kolom

![teks alt](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Satu-ke-satu (milik)

Menunjukkan bahwa suatu catatan profil pribadi merupakan milik seorang karyawan

Relasi ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Konfigurasi kolom

![teks alt](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Penjelasan parameter

### Koleksi sumber

Tabel sumber, yaitu tabel tempat kolom saat ini berada.

### Koleksi target

Tabel target, yang menjadi tabel terkait.

### Foreign key

Digunakan untuk membuat relasi antara dua tabel. Foreign key untuk relasi satu-ke-satu dapat ditempatkan di tabel sumber maupun tabel target. Jika relasi tersebut menyatakan “memiliki satu”, foreign key lebih tepat ditempatkan di tabel target; jika menyatakan “milik”, foreign key lebih tepat ditempatkan di tabel sumber.

### Source key <- Foreign key (foreign key berada di tabel target)

Kolom yang dirujuk oleh batasan foreign key dan harus memiliki nilai unik. Jika foreign key berada di tabel target, relasi tersebut menyatakan “memiliki satu”.

### Target key <- Foreign key (foreign key berada di tabel sumber)

Kolom yang dirujuk oleh batasan foreign key dan harus memiliki nilai unik. Jika foreign key berada di tabel sumber, relasi tersebut menyatakan “milik”.

### ON DELETE

ON DELETE mengacu pada aturan operasi terhadap referensi foreign key di tabel anak terkait saat catatan di tabel induk dihapus. Ini merupakan salah satu opsi saat mendefinisikan batasan foreign key. Opsi ON DELETE yang umum meliputi:

- CASCADE: saat catatan di tabel induk dihapus, semua catatan terkait di tabel anak akan otomatis dihapus.
- SET NULL: saat catatan di tabel induk dihapus, nilai foreign key yang terkait di tabel anak akan diubah menjadi NULL.
- RESTRICT: opsi default; saat mencoba menghapus catatan di tabel induk, penghapusan ditolak jika terdapat catatan terkait di tabel anak.
- NO ACTION: mirip dengan RESTRICT; jika terdapat catatan terkait di tabel anak, penghapusan catatan di tabel induk akan ditolak.