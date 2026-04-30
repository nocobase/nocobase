---
pkg: "@nocobase/plugin-data-source-manager"
title: "Manajemen Data Source"
description: "Plugin manajemen data source: mengelola database utama dan MySQL/MariaDB/PostgreSQL/MSSQL/Oracle eksternal, sinkronisasi tabel buatan sendiri, mengintegrasikan data source REST API, menyediakan antarmuka manajemen terpadu."
keywords: "manajemen data source,database utama,database eksternal,sinkronisasi Collection,data source REST API,NocoBase"
---
# Manajemen Data Source

## Pengantar

NocoBase menyediakan Plugin Manajemen Data Source untuk mengelola data source dan tabel datanya. Plugin manajemen data source hanya menyediakan antarmuka manajemen untuk semua data source, dan tidak menyediakan kemampuan untuk mengakses data source. Plugin ini perlu digunakan bersama dengan berbagai plugin data source. Data source yang saat ini didukung untuk integrasi meliputi:

- [Main Database](/data-sources/data-source-main): Database utama NocoBase, mendukung database relasional seperti MySQL, PostgreSQL, MariaDB, dan lainnya.
- [External MySQL](/data-sources/data-source-external-mysql): Menggunakan database MySQL eksternal sebagai data source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Menggunakan database MariaDB eksternal sebagai data source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Menggunakan database PostgreSQL eksternal sebagai data source.
- [External MSSQL](/data-sources/data-source-external-mssql): Menggunakan database MSSQL (SQL Server) eksternal sebagai data source.
- [External Oracle](/data-sources/data-source-external-oracle): Menggunakan database Oracle eksternal sebagai data source.

Selain itu, lebih banyak tipe dapat diperluas melalui plugin, dapat berupa berbagai jenis database umum, atau platform yang menyediakan API (SDK).

## Instalasi

Plugin bawaan, tidak perlu diinstal secara terpisah.

## Petunjuk Penggunaan

Saat aplikasi diinstal pertama kali, secara default akan disediakan satu data source untuk menyimpan data NocoBase, yang disebut database utama. Untuk lebih lanjut, lihat dokumentasi [Database Utama](/data-sources/data-source-main/index.md).

### Data Source Eksternal

Mendukung database eksternal sebagai data source. Untuk lebih lanjut, lihat dokumentasi [Database Eksternal / Pengantar](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Mendukung Sinkronisasi Tabel Buatan Sendiri di Database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Anda juga dapat mengintegrasikan data dari sumber HTTP API. Untuk lebih lanjut, lihat dokumentasi [Data Source REST API](/data-sources/data-source-rest-api/index.md).
