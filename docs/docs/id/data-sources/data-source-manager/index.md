---
pkg: "@nocobase/plugin-data-source-manager"
title: "Manajemen sumber data"
description: "Plugin manajemen sumber data: mengelola database utama, database eksternal, sumber data REST API, dan sumber data NocoBase eksternal, serta menyediakan antarmuka manajemen sumber data terpadu."
keywords: "manajemen sumber data,database utama,database eksternal,sinkronisasi tabel data,sumber data REST API,NocoBase"
---
# Manajemen sumber data

## Pengenalan

NocoBase menyediakan plugin manajemen sumber data untuk mengelola sumber data beserta tabel datanya. Plugin manajemen sumber data hanya menyediakan antarmuka untuk mengelola semua sumber data dan tidak menyediakan kemampuan untuk menghubungkan sumber data. Plugin ini perlu digunakan bersama berbagai plugin sumber data. Saat ini, sumber data yang didukung meliputi:

- [Database Utama](/data-sources/data-source-main/)：Database utama NocoBase, mendukung MySQL, PostgreSQL, MariaDB, KingbaseES, dan OceanBase.
- [PostgreSQL Eksternal](/data-sources/data-source-external-postgres/)：Menggunakan database PostgreSQL eksternal sebagai sumber data.
- [MySQL Eksternal](/data-sources/data-source-external-mysql/)：Menggunakan database MySQL eksternal sebagai sumber data.
- [MariaDB Eksternal](/data-sources/data-source-external-mariadb/)：Menggunakan database MariaDB eksternal sebagai sumber data.
- [MSSQL Eksternal](/data-sources/data-source-external-mssql/)：Menggunakan database MSSQL (SQL Server) eksternal sebagai sumber data.
- [KingbaseES Eksternal](/data-sources/data-source-kingbase/)：Menggunakan database KingbaseES eksternal sebagai sumber data.
- [OceanBase Eksternal](/data-sources/external/oceanbase)：Menggunakan database OceanBase eksternal sebagai sumber data.
- [Oracle Eksternal](/data-sources/data-source-external-oracle/)：Menggunakan database Oracle eksternal sebagai sumber data.
- [ClickHouse Eksternal](/data-sources/external/clickhouse)：Menggunakan database ClickHouse eksternal sebagai sumber data, yang biasanya digunakan untuk kueri, statistik, dan penyajian laporan.
- [Doris Eksternal](/data-sources/external/doris)：Menggunakan database Doris eksternal sebagai sumber data, yang biasanya digunakan untuk kueri, statistik, dan penyajian laporan.
- [Sumber data REST API](/data-sources/data-source-rest-api/)：Menghubungkan data dari sumber REST API ke NocoBase.
- [NocoBase Eksternal](/data-sources/data-source-external-nocobase/)：Menggunakan aplikasi NocoBase lain sebagai sumber data eksternal melalui NocoBase API jarak jauh.

Selain itu, lebih banyak jenis sumber data dapat ditambahkan melalui plugin, baik berbagai jenis database umum maupun platform yang menyediakan API (SDK).

## Instalasi

Plugin bawaan, tidak perlu diinstal secara terpisah.

## Panduan penggunaan

Saat aplikasi pertama kali diinstal dan diinisialisasi, secara default akan tersedia sumber data untuk menyimpan data NocoBase, yang disebut database utama. Untuk informasi selengkapnya, lihat dokumentasi [Database utama](/data-sources/data-source-main/index.md).

### Sumber data eksternal

Database eksternal dapat digunakan sebagai sumber data. Untuk informasi selengkapnya, lihat dokumentasi [Database eksternal / Pengenalan](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Mendukung sinkronisasi tabel yang dibuat sendiri di database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Data dari sumber HTTP API juga dapat dihubungkan. Untuk informasi selengkapnya, lihat dokumentasi [Sumber data REST API](/data-sources/data-source-rest-api/index.md).

### Sumber data NocoBase eksternal

Aplikasi NocoBase lain dapat dihubungkan sebagai sumber data eksternal melalui NocoBase API jarak jauh. Untuk informasi selengkapnya, lihat dokumentasi [NocoBase Eksternal](/data-sources/data-source-external-nocobase/index.md).