---
title: "Ikhtisar Pemodelan Data"
description: "Pemodelan data: merancang model data, menghubungkan berbagai sumber data, memvisualisasikan diagram ER, membuat tabel data, serta mendukung database utama dan database eksternal."
keywords: "Pemodelan data,Collection,model data,diagram ER,database utama,database eksternal,NocoBase"
---

# Ikhtisar

Pemodelan data merupakan langkah penting dalam merancang database. Proses ini mencakup analisis dan abstraksi mendalam terhadap berbagai jenis data di dunia nyata beserta hubungan di antara data tersebut. Dalam proses ini, kita berupaya mengungkap hubungan internal antardata, lalu mendeskripsikannya secara formal sebagai model data untuk menjadi dasar struktur database sistem informasi. NocoBase adalah platform berbasis model data dengan karakteristik berikut:

## Mendukung koneksi ke berbagai sumber data

Sumber data NocoBase dapat berupa berbagai database umum, platform API (SDK), dan file.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase menyediakan [plugin manajemen sumber data](/data-sources/data-source-manager) untuk mengelola berbagai sumber data dan tabel datanya. Plugin manajemen sumber data hanya menyediakan antarmuka untuk mengelola semua sumber data dan tidak menyediakan kemampuan untuk menghubungkan sumber data. Plugin ini perlu digunakan bersama berbagai plugin sumber data. Saat ini, sumber data yang didukung meliputi:

- [Database Utama](/data-sources/data-source-main)：Database utama NocoBase yang mendukung database relasional seperti MySQL, PostgreSQL, dan MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase)：Menggunakan database KingbaseES sebagai sumber data, yang dapat digunakan sebagai database utama maupun database eksternal.
- [MySQL Eksternal](/data-sources/data-source-external-mysql)：Menggunakan database MySQL eksternal sebagai sumber data.
- [MariaDB Eksternal](/data-sources/data-source-external-mariadb)：Menggunakan database MariaDB eksternal sebagai sumber data.
- [PostgreSQL Eksternal](/data-sources/data-source-external-postgres)：Menggunakan database PostgreSQL eksternal sebagai sumber data.
- [MSSQL Eksternal](/data-sources/data-source-external-mssql)：Menggunakan database MSSQL (SQL Server) eksternal sebagai sumber data.
- [Oracle Eksternal](/data-sources/data-source-external-oracle)：Menggunakan database Oracle eksternal sebagai sumber data.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Menyediakan berbagai alat pemodelan data

**Antarmuka manajemen tabel data sederhana**：Digunakan untuk membuat berbagai model (tabel data) atau menghubungkan model (tabel data) yang sudah ada.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Antarmuka visualisasi mirip diagram ER**：Digunakan untuk mengekstrak entitas dan hubungan di antaranya dari kebutuhan pengguna dan bisnis. Antarmuka ini menyediakan cara yang intuitif dan mudah dipahami untuk mendeskripsikan model data. Dengan diagram ER, entitas data utama dalam sistem dan hubungan di antaranya dapat dipahami dengan lebih jelas.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Mendukung pembuatan berbagai tabel data

| Tabel data | Deskripsi |
| - | - |
| [Tabel data biasa](/data-sources/data-source-main/general-collection) | Menyediakan field sistem yang umum digunakan |
| [Tabel data kalender](/data-sources/calendar/calendar-collection) | Digunakan untuk membuat tabel acara terkait kalender |
| Tabel komentar | Digunakan untuk menyimpan komentar atau umpan balik terhadap data |
| [Tabel struktur pohon](/data-sources/collection-tree) | Tabel struktur pohon, saat ini hanya mendukung desain tabel adjacency |
| [Tabel data file](/data-sources/file-manager/file-collection) | Digunakan untuk mengelola penyimpanan file |
| [Tabel data SQL](/data-sources/collection-sql) | Bukan tabel database sebenarnya, melainkan digunakan untuk menampilkan kueri SQL secara terstruktur dengan cepat |
| [Hubungkan tampilan database](/data-sources/collection-view) | Menghubungkan tampilan database yang sudah ada |
| Tabel ekspresi | Digunakan untuk skenario ekspresi dinamis dalam alur kerja |
| [Hubungkan data eksternal](/data-sources/collection-fdw) | Menghubungkan tabel data jarak jauh berdasarkan teknologi FDW database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Untuk informasi lebih lanjut, lihat bab 「[Tabel data / Ikhtisar](/data-sources/data-modeling/collection)」

## Menyediakan berbagai jenis field

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Untuk informasi lebih lanjut, lihat bab 「[Field tabel data / Ikhtisar](/data-sources/data-modeling/collection-fields)」