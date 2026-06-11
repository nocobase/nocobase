---
pkg: "@nocobase/plugin-collection-fdw"
title: "Menghubungkan Collection Eksternal (FDW)"
description: "Menghubungkan tabel data remote berbasis Foreign Data Wrapper, MySQL federated engine, PostgreSQL postgres_fdw, memetakan tabel remote sebagai tabel lokal untuk digunakan."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,tabel eksternal,tabel remote,NocoBase"
---
# Menghubungkan Collection Eksternal (FDW)

## Pengantar

Plugin fungsi yang menghubungkan tabel data remote berbasis foreign data wrapper database. Saat ini mendukung database MySQL dan PostgreSQL.

:::info{title="Hubungkan Data Source vs Hubungkan Collection Eksternal"}
- **Hubungkan Data Source** mengacu pada membangun koneksi dengan database atau layanan API tertentu, dapat menggunakan secara penuh fitur database atau layanan yang disediakan API;
- **Hubungkan Collection Eksternal** mengacu pada mengambil data dari eksternal dan memetakannya untuk penggunaan lokal. Dalam database disebut FDW (Foreign Data Wrapper), yaitu teknologi database yang berfokus pada penggunaan tabel remote sebagai tabel lokal, hanya dapat menghubungkan satu per satu tabel. Karena merupakan akses remote, akan ada berbagai batasan dan keterbatasan saat penggunaan.

Keduanya juga dapat digunakan bersama, yang pertama untuk membangun koneksi ke data source, yang kedua untuk akses lintas data source. Contohnya, terhubung ke suatu data source PostgreSQL, dan dalam data source ini ada suatu tabel yang merupakan Collection eksternal yang dibuat berbasis FDW.
:::

### MySQL

MySQL melalui engine `federated`, perlu diaktifkan, mendukung koneksi MySQL remote dan database yang kompatibel dengan protokolnya, seperti MariaDB. Untuk dokumentasi lebih lanjut, lihat [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Di PostgreSQL, dapat mendukung berbagai jenis data remote melalui ekstensi `fdw` yang berbeda. Saat ini ekstensi yang didukung meliputi:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Menghubungkan ke database PostgreSQL remote di dalam PostgreSQL.
- [mysql_fdw (dalam pengembangan)](https://github.com/EnterpriseDB/mysql_fdw): Menghubungkan ke database MySQL remote di dalam PostgreSQL.
- Untuk jenis ekstensi fdw lainnya, dapat mengacu pada [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Untuk mengintegrasikan dengan NocoBase, perlu mengimplementasikan interface adaptasi yang sesuai dalam kode.

## Instalasi

Prasyarat

- Jika database utama NocoBase adalah MySQL, maka perlu mengaktifkan `federated`, lihat [Cara Mengaktifkan Engine federated di MySQL](./enable-federated.md)

Lalu instal dan aktifkan plugin melalui Plugin Manager

![Instal dan aktifkan plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Panduan Penggunaan

Pada dropdown "Manajemen Collection > Buat Collection", pilih "Hubungkan Data Eksternal"

![Hubungkan data eksternal](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Pada opsi dropdown "Layanan Database", pilih layanan database yang sudah ada, atau "Buat Layanan Database"

![Layanan database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Buat layanan database

![Buat layanan database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Setelah memilih layanan database, pada opsi dropdown "Tabel Remote", pilih Collection yang akan dihubungkan.

![Pilih Collection yang akan dihubungkan](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurasi informasi field

![Konfigurasi informasi field](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jika struktur tabel remote berubah, Anda juga dapat "Sinkronisasi dari Tabel Remote"

![Sinkronisasi dari tabel remote](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sinkronisasi tabel remote

![Sinkronisasi tabel remote](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Terakhir, ditampilkan di antarmuka

![Ditampilkan di antarmuka](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)
