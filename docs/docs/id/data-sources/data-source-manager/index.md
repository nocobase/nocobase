---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Manajemen Sumber Data

## Pendahuluan

NocoBase menyediakan plugin manajemen sumber data untuk mengelola sumber data dan koleksinya. Plugin manajemen sumber data hanya menyediakan antarmuka manajemen untuk semua sumber data dan tidak menyediakan kemampuan untuk mengakses sumber data. Plugin ini perlu digunakan bersama dengan berbagai plugin sumber data lainnya. Sumber data yang saat ini didukung untuk diakses meliputi:

- [Basis Data Utama](/data-sources/data-source-main): Basis data utama NocoBase, mendukung basis data relasional seperti MySQL, PostgreSQL, dan MariaDB.
- [MySQL Eksternal](/data-sources/data-source-external-mysql): Menggunakan basis data MySQL eksternal sebagai sumber data.
- [MariaDB Eksternal](/data-sources/data-source-external-mariadb): Menggunakan basis data MariaDB eksternal sebagai sumber data.
- [PostgreSQL Eksternal](/data-sources/data-source-external-postgres): Menggunakan basis data PostgreSQL eksternal sebagai sumber data.
- [MSSQL Eksternal](/data-sources/data-source-external-mssql): Menggunakan basis data MSSQL (SQL Server) eksternal sebagai sumber data.
- [Oracle Eksternal](/data-sources/data-source-external-oracle): Menggunakan basis data Oracle eksternal sebagai sumber data.

Selain itu, lebih banyak jenis dapat diperluas melalui plugin, yang bisa berupa jenis basis data umum atau platform yang menyediakan API (SDK).

## Instalasi

Plugin bawaan, tidak perlu instalasi terpisah.

## Petunjuk Penggunaan

Saat aplikasi diinisialisasi dan diinstal, sebuah sumber data akan disediakan secara default untuk menyimpan data NocoBase, yang dikenal sebagai basis data utama. Untuk informasi lebih lanjut, lihat dokumentasi [Basis Data Utama](/data-sources/data-source-main/).

### Sumber Data Eksternal

Basis data eksternal didukung sebagai sumber data. Untuk informasi lebih lanjut, lihat dokumentasi [Basis Data Eksternal / Pendahuluan](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Mendukung Sinkronisasi Tabel Basis Data Buatan Sendiri

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Anda juga dapat mengakses data dari sumber API HTTP. Untuk informasi lebih lanjut, lihat dokumentasi [Sumber Data REST API](/data-sources/data-source-rest-api/).