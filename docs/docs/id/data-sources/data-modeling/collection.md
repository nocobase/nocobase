---
title: "Ikhtisar Collection"
description: "Konsep Collection: mendefinisikan model data, field, indeks, relasi, membuat atau menyinkronkan tabel yang sudah ada melalui manajemen data source."
keywords: "collection,Collection,model data,definisi field,relasi,NocoBase"
---

# Ikhtisar Collection

NocoBase menyediakan DSL khusus untuk mendeskripsikan struktur data, yang disebut Collection, menyatukan struktur data dari berbagai sumber, sehingga menyediakan dasar yang andal untuk manajemen, analisis, dan aplikasi data selanjutnya.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Untuk memudahkan penggunaan berbagai model data, mendukung pembuatan berbagai jenis Collection:

- [Collection Umum](/data-sources/data-source-main/general-collection): Memiliki field sistem umum yang sudah terpasang;
- [Collection Inheritance](/data-sources/data-source-main/inheritance-collection): Anda dapat membuat Collection parent, lalu menurunkan Collection child dari parent tersebut. Collection child akan mewarisi struktur Collection parent, dan juga dapat mendefinisikan kolomnya sendiri.
- [Collection Tree](/data-sources/collection-tree): Tabel struktur tree, saat ini hanya mendukung desain adjacency list;
- [Collection Calendar](/data-sources/calendar/calendar-collection): Digunakan untuk membuat tabel event terkait kalender;
- [Collection File](/data-sources/file-manager/file-collection): Digunakan untuk manajemen penyimpanan file;
- : Digunakan untuk skenario expression dinamis pada workflow;
- [Collection SQL](/data-sources/collection-sql): Bukan tabel database aktual, melainkan menampilkan kueri SQL secara cepat dan terstruktur;
- [Collection View](/data-sources/collection-view): Menghubungkan ke database view yang sudah ada;
- [Collection Eksternal](/data-sources/collection-fdw): Memungkinkan sistem database mengakses dan mengkueri data secara langsung dari data source eksternal, berbasis teknologi FDW;
