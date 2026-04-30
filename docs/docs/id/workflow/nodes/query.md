---
title: "Node Workflow - Query Data"
description: "Node Query Data: query satu atau beberapa record berdasarkan kondisi, hasil dapat digunakan sebagai variable oleh Node berikutnya."
keywords: "Workflow,Query Data,Query,operasi tabel data,variable,NocoBase"
---

# Query Data

Digunakan untuk meng-query record data dari tabel data tertentu yang memenuhi kondisi.

Anda dapat mengkonfigurasi query untuk mendapatkan satu atau beberapa data, hasil query dapat digunakan sebagai variable oleh Node berikutnya. Saat query beberapa data, hasil query berupa array. Saat hasil query kosong, Anda dapat memilih apakah akan tetap mengeksekusi Node berikutnya.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Query Data":

![Query Data_Tambah](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Konfigurasi Node

![Node Query_Konfigurasi](https://static-docs.nocobase.com/20240520131324.png)

### Tabel Data

Pilih tabel data yang akan diquery.

### Tipe Hasil

Tipe hasil terbagi menjadi dua jenis "data tunggal" dan "data multi-baris":

- Data tunggal: hasil berupa objek, hanya record pertama yang cocok, atau nilai kosong.
- Data multi: hasil berupa array, berisi record yang cocok dengan kondisi, jika tidak ada record yang cocok berupa array kosong. Dapat diproses satu per satu menggunakan Node Loop.

### Kondisi Filter

Mirip dengan kondisi filter pada query tabel data biasa, dapat menggunakan variable konteks alur.

### Pengurutan

Saat query satu atau beberapa data, dapat dilakukan kontrol hasil yang diinginkan melalui aturan pengurutan. Misalnya untuk query data terbaru, Anda dapat mengurutkan secara descending menggunakan field "waktu pembuatan".

### Pagination

Saat hasil set kemungkinan sangat besar, Anda dapat menggunakan pagination untuk mengontrol jumlah hasil query. Misalnya untuk query 10 data terbaru, Anda dapat mengurutkan secara descending menggunakan field "waktu pembuatan", lalu mengatur pagination ke halaman 1 dengan 10 data.

### Penanganan Saat Hasil Kosong

Pada mode hasil tunggal, jika tidak ada data yang memenuhi kondisi, hasil query akan menjadi `null`. Pada mode hasil multi berupa array kosong (`[]`). Anda dapat memilih untuk mencentang "keluar dari alur saat hasil query kosong" sesuai kebutuhan. Jika dicentang, ketika hasil query kosong, Node berikutnya tidak akan dieksekusi dan alur akan keluar lebih awal dengan status gagal.
