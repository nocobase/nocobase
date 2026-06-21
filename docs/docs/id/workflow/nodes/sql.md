---
pkg: '@nocobase/plugin-workflow-sql'
title: "Node Workflow - Operasi SQL"
description: "Node Operasi SQL: mengeksekusi statement SQL kompleks, mendukung variable konteks alur sebagai parameter."
keywords: "Workflow,Operasi SQL,database,statement SQL,parameter variable,NocoBase"
---

# Operasi SQL

## Pengantar

Pada beberapa skenario khusus, Node operasi tabel data sederhana di atas mungkin tidak dapat melakukan operasi kompleks. Maka Anda dapat langsung menggunakan Node SQL, agar database langsung mengeksekusi statement SQL kompleks untuk operasi data.

Berbeda dengan langsung connect ke database dari luar aplikasi untuk operasi SQL, di dalam workflow Anda dapat menggunakan variable konteks alur sebagai sebagian parameter pada statement SQL.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Operasi SQL":

![Operasi SQL_Tambah](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Konfigurasi Node

![Node SQL_Konfigurasi Node](https://static-docs.nocobase.com/20260414235136.png)

### Sumber Data

Pilih sumber data untuk eksekusi SQL.

Sumber data harus tipe database, contoh data source utama, sumber data tipe PostgreSQL atau sumber data lain yang kompatibel dengan Sequelize.

### Isi SQL

Edit statement SQL. Saat ini hanya mendukung satu statement SQL.

:::info
Sejak `v2.0.30`, dengan alasan keamanan, statement SQL tidak lagi mendukung penggunaan variable secara langsung untuk text replacement, harus menggunakan parameterized query.
:::

Pada statement SQL Anda dapat menggunakan variable konteks alur, tetapi harus menggunakan format `:variableName` sebagai placeholder, contoh:

```sql
SELECT * FROM users WHERE id = :userId;
```

### Daftar Parameter

Pada statement SQL di atas, `:userId` adalah placeholder. Penggantian placeholder perlu dikonfigurasi pada "Daftar Parameter". Nama variable menggunakan nama dari placeholder, contoh `userId`. Value variable dapat menggunakan tool pemilih variable untuk memilih variable konteks alur.

## Hasil Eksekusi Node

Sejak `v1.3.15-beta`, hasil eksekusi Node SQL adalah array yang terdiri dari data murni. Sebelum itu adalah struktur native Sequelize yang berisi metainformasi query (untuk detail lihat: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Misalnya query berikut:

```sql
select count(id) from posts;
```

Hasil sebelum `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Hasil setelah `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Pertanyaan Umum

### Bagaimana cara menggunakan hasil Node SQL?

Jika menggunakan statement `SELECT`, hasil query akan disimpan dalam Node dalam format JSON Sequelize, dapat diparse dan digunakan melalui plugin [JSON-query](./json-query.md).

### Apakah operasi SQL akan memicu event tabel data?

**Tidak akan**. Operasi SQL langsung mengirim statement SQL ke database untuk diproses. Operasi `CREATE` / `UPDATE` / `DELETE` terkait terjadi di database, sedangkan event tabel data terjadi di lapisan aplikasi Node.js (pemrosesan ORM), sehingga tidak akan memicu event tabel data.
