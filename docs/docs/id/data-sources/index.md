---
title: "Ikhtisar Data Source"
description: "Data Source dan pemodelan data NocoBase: database utama, MySQL/PostgreSQL/Oracle/MSSQL eksternal, manajemen data source, diagram ER, collection umum, collection tree, collection SQL, FDW, collection file, REST API."
keywords: "data source,pemodelan data,database utama,database eksternal,diagram ER,Collection,collection tree,collection SQL,FDW,NocoBase"
---

# Ikhtisar

Pemodelan data adalah langkah kunci dalam mendesain database, melibatkan analisis dan abstraksi mendalam terhadap berbagai jenis data dunia nyata serta hubungannya satu sama lain. Dalam proses ini, kami berusaha mengungkap hubungan internal antar data, lalu mendeskripsikannya secara formal sebagai model data, sehingga menjadi dasar struktur database untuk sistem informasi. NocoBase adalah platform yang digerakkan oleh model data, dengan karakteristik berikut:

## Mendukung berbagai sumber data

Data Source NocoBase dapat berupa berbagai jenis database umum, platform API (SDK), dan file.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase menyediakan [Plugin Manajemen Data Source](/data-sources/data-source-manager) untuk mengelola berbagai data source dan tabel datanya. Plugin manajemen data source hanya menyediakan antarmuka manajemen untuk semua data source, dan tidak menyediakan kemampuan untuk mengakses data source. Plugin ini perlu digunakan bersama dengan berbagai plugin data source. Data source yang saat ini didukung meliputi:

- [Main Database](/data-sources/data-source-main): Database utama NocoBase, mendukung database relasional seperti MySQL, PostgreSQL, MariaDB, dan lainnya.
- [KingbaseES](/data-sources/data-source-kingbase): Menggunakan database KingbaseES sebagai data source, dapat digunakan baik sebagai database utama maupun sebagai database eksternal.
- [External MySQL](/data-sources/data-source-external-mysql): Menggunakan database MySQL eksternal sebagai data source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Menggunakan database MariaDB eksternal sebagai data source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Menggunakan database PostgreSQL eksternal sebagai data source.
- [External MSSQL](/data-sources/data-source-external-mssql): Menggunakan database MSSQL (SQL Server) eksternal sebagai data source.
- [External Oracle](/data-sources/data-source-external-oracle): Menggunakan database Oracle eksternal sebagai data source.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Menyediakan beragam alat pemodelan data

**Antarmuka manajemen Collection yang sederhana**: Digunakan untuk membuat berbagai model (Collection) atau menghubungkan model (Collection) yang sudah ada.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Antarmuka visual mirip diagram ER**: Digunakan untuk mengekstrak entitas dan hubungan di antara mereka dari kebutuhan pengguna dan bisnis. Antarmuka ini menyediakan cara yang intuitif dan mudah dipahami untuk mendeskripsikan model data. Melalui diagram ER, Anda dapat lebih jelas memahami entitas data utama dalam sistem dan hubungan di antara mereka.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Mendukung pembuatan berbagai Collection

| Collection | Deskripsi |
| - | - |
| [Collection Umum](/data-sources/data-source-main/general-collection) | Memiliki field sistem umum yang sudah terpasang |
| [Collection Calendar](/data-sources/calendar/calendar-collection) | Digunakan untuk membuat tabel event terkait kalender |
| Collection Comment | Digunakan untuk menyimpan komentar atau umpan balik terhadap data |
| [Collection Tree](/data-sources/collection-tree) | Tabel struktur tree, saat ini hanya mendukung desain adjacency list |
| [Collection File](/data-sources/file-manager/file-collection) | Digunakan untuk manajemen penyimpanan file |
| [Collection SQL](/data-sources/collection-sql) | Bukan tabel database aktual, melainkan menampilkan kueri SQL secara cepat dan terstruktur |
| [Database View Connection](/data-sources/collection-view) | Menghubungkan ke database view yang sudah ada |
| Collection Expression | Digunakan untuk skenario expression dinamis pada workflow |
| [Connect External Data](/data-sources/collection-fdw) | Menghubungkan ke tabel data remote berbasis teknologi FDW database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Untuk lebih lanjut, lihat bagian "[Collection / Ikhtisar](/data-sources/data-modeling/collection)"

## Menyediakan beragam tipe Field

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Untuk lebih lanjut, lihat bagian "[Field Collection / Ikhtisar](/data-sources/data-modeling/collection-fields)"
