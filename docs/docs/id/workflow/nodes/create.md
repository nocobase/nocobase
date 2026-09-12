---
title: "Node Workflow - Tambah Data"
description: "Node tambah data: menambah satu baris ke tabel data, mendukung variabel konteks alur, penugasan field relasi, referensi foreign key."
keywords: "Workflow,tambah data,Create,operasi tabel data,penugasan variabel,NocoBase"
---

# Tambah Data

Digunakan untuk menambah satu baris data ke tabel data tertentu.

Nilai field baris data baru dapat menggunakan variabel konteks alur. Penugasan untuk field relasi dapat langsung merujuk variabel data yang sesuai dalam konteks, dapat berupa objek, atau juga nilai foreign key. Jika tidak menggunakan variabel, perlu mengisi nilai foreign key secara manual. Untuk beberapa nilai foreign key relasi to-many perlu menggunakan format yang dipisahkan koma.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "Tambah Data":

![Buat Node tambah data](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Konfigurasi Node

![Node tambah_contoh_konfigurasi Node](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Tabel Data

Pilih tabel data yang akan ditambah data.

### Nilai Field

Lakukan penugasan untuk field tabel data, dapat menggunakan variabel konteks alur, atau juga mengisi nilai statis secara manual.

:::info{title="Tips"}
Data yang ditambahkan oleh Node tambah dalam Workflow tidak akan secara otomatis menangani data pengguna seperti "Pembuat", "Pengubah Terakhir", dll., perlu mengonfigurasi nilai kedua field ini sendiri sesuai situasi.
:::

### Pre-load Data Relasi

Jika field data baru mengandung field relasi, dan Anda ingin menggunakan data relasi yang sesuai dalam alur berikutnya, dapat mencentang field relasi yang sesuai pada konfigurasi pre-load. Dengan demikian setelah data baru ditambahkan, data relasi yang sesuai akan otomatis dimuat dan disimpan di data hasil Node.

## Contoh

Misalnya ketika data tabel "Artikel" ditambah atau diperbarui, perlu otomatis menambah satu data "Versi Artikel", mencatat satu riwayat perubahan artikel, dapat menggunakan Node tambah untuk implementasi:

![Node tambah_contoh_konfigurasi alur](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Node tambah_contoh_konfigurasi Node](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Setelah Workflow diaktifkan dengan konfigurasi ini, ketika data tabel "Artikel" berubah, akan otomatis menambah satu data "Versi Artikel", mencatat riwayat perubahan artikel.
