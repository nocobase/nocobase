---
pkg: '@nocobase/plugin-workflow-aggregate'
title: "Node Workflow - Kueri Agregasi"
description: "Node kueri agregasi: melakukan kueri fungsi agregasi pada tabel data, mengembalikan hasil statistik untuk digunakan Node berikutnya, sering digunakan untuk laporan."
keywords: "Workflow,kueri agregasi,Aggregate,statistik,laporan,NocoBase"
---

# Kueri Agregasi

## Pengantar

Digunakan untuk melakukan kueri fungsi agregasi terhadap data dari tabel data tertentu yang memenuhi kondisi, dan mengembalikan hasil statistik yang sesuai. Sering digunakan untuk memproses data statistik terkait laporan.

Implementasi Node berbasis fungsi agregasi database, saat ini hanya mendukung statistik untuk satu field dari satu tabel data, nilai hasil statistik akan disimpan dalam hasil Node untuk digunakan oleh Node lainnya.

## Instalasi

Plugin bawaan, tidak perlu diinstal.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "Kueri Agregasi":

![Buat Node kueri agregasi](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Konfigurasi Node

![Node kueri agregasi_konfigurasi Node](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Fungsi Agregasi

Mendukung 5 fungsi agregasi dalam SQL: `COUNT`, `SUM`, `AVG`, `MIN`, dan `MAX`. Pilih salah satunya untuk melakukan kueri agregasi pada data.

### Tipe Target

Target kueri agregasi dapat dipilih melalui dua mode, satu adalah langsung memilih tabel data target dan salah satu field di dalamnya, lainnya adalah melalui objek data yang sudah ada di konteks alur, memilih tabel data relasi to-many dan field-nya, untuk melakukan kueri agregasi.

### Distinct

Yaitu `DISTINCT` dalam SQL, field distinct sama dengan field tabel data yang dipilih, sementara belum mendukung pilihan field yang berbeda untuk keduanya.

### Kondisi Filter

Mirip dengan kondisi filter pada kueri tabel data biasa, dapat menggunakan variabel konteks alur.

## Contoh

Target agregasi "Data Tabel Data" relatif mudah dipahami, di sini diambil contoh "menghitung total artikel kategori artikel setelah penambahan artikel" untuk memperkenalkan penggunaan target agregasi sebagai "Data Tabel Data Relasi".

Pertama, buat dua tabel data: "Artikel" dan "Kategori", di mana artikel memiliki satu field relasi many-to-one yang menunjuk ke tabel kategori, sambil membuat field relasi balik kategori one-to-many artikel:

| Nama Field      | Tipe              |
| --------------- | ----------------- |
| Judul           | Single Line Text  |
| Kategori        | Many-to-One (Kategori) |

| Nama Field      | Tipe                |
| --------------- | ------------------- |
| Nama Kategori   | Single Line Text    |
| Mengandung Artikel | One-to-Many (Artikel) |

Selanjutnya buat sebuah Workflow yang dipicu event tabel data, pilih tabel artikel "Setelah Penambahan Data" untuk memicu.

Kemudian tambahkan Node kueri agregasi, konfigurasi seperti di bawah:

![Node kueri agregasi_contoh_konfigurasi Node](https://static-docs.nocobase.com/542272e638c6c0a567373d1b37ddda78.png)

Dengan demikian setelah Workflow dipicu, Node kueri agregasi akan menghitung jumlah semua artikel di kategori artikel yang baru ditambahkan, dan disimpan sebagai hasil Node.

:::info{title=Tips}
Jika perlu menggunakan data relasi dari Trigger event tabel data, perlu mengonfigurasi field terkait "Pre-load Data Relasi" pada Trigger, jika tidak tidak akan dapat dipilih.
:::
