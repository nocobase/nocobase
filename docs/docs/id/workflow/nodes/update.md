---
title: "Node Workflow - Update Data"
description: "Node Update Data: update record tabel data berdasarkan kondisi, mendukung kondisi filter, mode update, assignment dengan variable."
keywords: "Workflow,Update Data,Update,operasi tabel data,kondisi filter,NocoBase"
---

# Update Data

Digunakan untuk meng-update data pada tabel data tertentu yang memenuhi kondisi.

Bagian tabel data dan assignment field sama dengan Node Tambah, perbedaan utama Node Update adalah penambahan kondisi filter, dan Anda perlu memilih mode update. Selain itu, hasil Node Update akan mengembalikan jumlah baris data yang berhasil diupdate, hanya dapat dilihat di riwayat eksekusi, dan tidak dapat digunakan sebagai variable pada Node berikutnya.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Update Data":

![Update Data_Tambah](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Konfigurasi Node

![Node Update_Konfigurasi](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Tabel Data

Pilih tabel data yang akan diupdate.

### Mode Update

Mode update memiliki dua mode:

* Update batch: tidak akan memicu event tabel data untuk setiap record yang diupdate, performanya lebih baik, cocok untuk operasi update data dalam jumlah besar.
* Update satu per satu: akan memicu event tabel data untuk setiap record yang diupdate, tetapi pada jumlah data besar akan ada masalah performa, perlu digunakan dengan hati-hati.

Biasanya pemilihan didasarkan pada data target yang diupdate dan apakah perlu memicu event workflow lain. Jika update record tunggal berdasarkan primary key, disarankan menggunakan update satu per satu. Jika update beberapa record berdasarkan kondisi, disarankan menggunakan update batch.

### Kondisi Filter

Mirip dengan kondisi filter pada query tabel data biasa, dapat menggunakan variable konteks alur.

### Nilai Field

Mirip dengan assignment field pada Node Tambah, dapat menggunakan variable konteks alur, atau mengisi nilai statis secara manual.

Catatan: data yang diupdate oleh Node Update di workflow tidak akan otomatis memproses data "terakhir dimodifikasi oleh", Anda perlu mengkonfigurasi nilai field ini sendiri sesuai situasi.

## Contoh

Misalnya saat menambah "Artikel", perlu otomatis meng-update field "Jumlah Artikel" pada tabel "Kategori Artikel", dapat diimplementasikan menggunakan Node Update:

![Node Update_Contoh_Konfigurasi Node](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Saat workflow di-trigger, akan secara otomatis meng-update field "Jumlah Artikel" pada tabel "Kategori Artikel" menjadi jumlah artikel saat ini +1.
