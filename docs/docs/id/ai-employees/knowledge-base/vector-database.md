---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Vector Database"
description: "Vector database menyimpan index vektorisasi dokumen Basis Pengetahuan, mendukung PGVector. Konfigurasi Host, Port, Database, Table name, untuk retrieval semantik RAG."
keywords: "Vector Database,PGVector,Embedding,RAG,NocoBase"
---

# Vector Database

## Pengantar

Pada Basis Pengetahuan, vector database menyimpan dokumen Basis Pengetahuan yang sudah divektorisasi. Dokumen yang sudah divektorisasi setara dengan index dokumen.

Saat retrieval RAG diaktifkan dalam dialog Karyawan AI, akan memvektorisasi pesan Pengguna, di vector database melakukan retrieval fragmen dokumen Basis Pengetahuan, mencocokkan paragraf dokumen yang relevan dan teks asli dokumen.

Saat ini Plugin Basis Pengetahuan AI hanya secara bawaan mendukung PGVector, ini adalah Plugin database PostgrepSQL.

## Manajemen Vector Database

Masuk ke halaman konfigurasi Plugin Karyawan AI, klik tab `Vector store`, pilih `Vector database` masuk ke halaman manajemen vector database.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klik tombol `Add new` di pojok kanan atas untuk menambah koneksi vector database `PGVector` baru:

- Pada kotak input `Name` masukkan nama koneksi;
- Pada kotak input `Host` masukkan alamat IP vector database;
- Pada kotak input `Port` masukkan nomor port vector database;
- Pada kotak input `Username` masukkan akun vector database;
- Pada kotak input `Password` masukkan password vector database;
- Pada kotak input `Database` masukkan nama vector database;
- Pada kotak input `Table name` masukkan nama tabel data, digunakan saat membuat tabel baru untuk menyimpan data vektor;

Setelah memasukkan semua informasi yang diperlukan, klik tombol `Test` untuk menguji apakah layanan vector database tersedia, klik tombol `Submit` untuk menyimpan informasi koneksi.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)
