---
title: "Workflow - Menggunakan Variabel"
description: "Menggunakan variabel: konteks Trigger, data Node hulu, variabel lokal, variabel sistem, menghubungkan alur."
keywords: "Workflow,Variabel,Variable,konteks Trigger,variabel alur,NocoBase"
---

# Menggunakan Variabel

## Konsep Inti

Seperti variabel dalam bahasa pemrograman, dalam Workflow **variabel** adalah alat penting untuk menghubungkan dan mengorganisir alur.

Saat setiap Node dieksekusi setelah Workflow dipicu, beberapa item konfigurasi dapat memilih untuk menggunakan variabel. Sumber variabel adalah data Node hulu dari Node tersebut, termasuk beberapa kategori berikut:

- Data konteks Trigger: dalam kasus pemicuan oleh action, pemicuan oleh tabel data, dll., objek data baris tunggal dapat digunakan sebagai variabel oleh semua Node, implementasinya berbeda-beda tergantung pada masing-masing Trigger.
- Data Node hulu: ketika alur berlanjut ke Node manapun, data hasil dari Node yang sudah selesai sebelumnya.
- Variabel lokal: ketika Node berada dalam struktur cabang khusus, dapat menggunakan variabel lokal khusus dalam cabang tersebut, misalnya dalam struktur loop dapat menggunakan objek data setiap putaran loop.
- Variabel sistem: beberapa parameter sistem bawaan, seperti waktu saat ini, dll.

Kita sudah berkali-kali menggunakan fitur variabel di [Memulai](../getting-started.md), misalnya pada Node komputasi, kita dapat menggunakan variabel untuk merujuk data konteks Trigger untuk melakukan komputasi:

![Node komputasi menggunakan fungsi dan variabel](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Pada Node Perbarui, kita menggunakan data konteks Trigger sebagai variabel kondisi filter, dan merujuk hasil Node komputasi sebagai variabel nilai field data yang diperbarui:

![Variabel Node Perbarui Data](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Struktur Data

Bagian dalam variabel adalah struktur JSON, biasanya dapat digunakan bagian tertentu dari data berdasarkan path JSON. Karena banyak variabel berbasis pada struktur tabel data NocoBase, data relasi akan menjadi properti dari objek dan secara hierarkis membentuk struktur seperti pohon, misalnya kita dapat memilih nilai field tertentu dari data relasi yang dikuerikan. Selain itu, ketika data relasi merupakan struktur to-many, variabel mungkin berupa array.

Pemilihan variabel dalam banyak kasus perlu memilih sampai ke properti nilai paling akhir, biasanya berupa tipe data sederhana seperti angka, string, dll. Namun ketika ada array di dalam hierarki variabel, properti tingkat akhir juga akan dipetakan menjadi sebuah array, hanya jika Node terkait mendukung array, baru dapat memproses data array dengan benar. Misalnya pada Node komputasi, beberapa engine komputasi memiliki fungsi khusus untuk menangani array, atau pada Node loop, objek loop juga dapat langsung memilih array.

Sebagai contoh, ketika sebuah Node Kueri mengkuerikan beberapa data, hasil Node akan berupa array yang berisi beberapa baris data berstruktur sama:

```json
[
  {
    "id": 1,
    "title": "Judul1"
  },
  {
    "id": 2,
    "title": "Judul2"
  }
]
```

Namun ketika digunakan sebagai variabel pada Node selanjutnya, jika variabel yang dipilih dalam bentuk `Data Node/Node Kueri/Judul`, maka akan didapat sebuah array yang sudah dipetakan menjadi array nilai field yang sesuai:

```json
["Judul1", "Judul2"]
```

Jika berupa array multi-dimensi (seperti field relasi many-to-many), akan didapat array satu dimensi yang sudah diratakan dari field yang sesuai.

## Variabel Bawaan Sistem

### Waktu Sistem

Berdasarkan Node yang sedang dieksekusi, mendapatkan waktu sistem saat eksekusi, zona waktu dari waktu ini adalah zona waktu yang diatur pada server.

### Parameter Rentang Tanggal

Pada Node Kueri, Perbarui, dan Hapus, dapat digunakan saat mengonfigurasi kondisi filter field tanggal. Hanya mendukung perbandingan "sama dengan", titik mulai dan akhir rentang tanggal sama-sama berbasis pada zona waktu yang diatur pada server.

![Parameter rentang tanggal](https://static-docs.nocobase.com/20240817175354.png)
