---
title: "FDW Menghubungkan Tabel Data Eksternal"
description: "Hubungkan tabel jarak jauh berdasarkan Foreign Data Wrapper: MySQL federated, PostgreSQL postgres_fdw/mysql_fdw, buat layanan database, pilih tabel jarak jauh, sinkronisasi field."
keywords: "FDW,tabel data eksternal,Foreign Data Wrapper,postgres_fdw,mysql_fdw,federated,tabel jarak jauh,NocoBase"
---

# Menghubungkan Tabel Data Eksternal (FDW)

## Pengenalan

Fitur menghubungkan tabel data jarak jauh yang diimplementasikan berdasarkan Foreign Data Wrapper database. Saat ini mendukung database MySQL dan PostgreSQL.

:::info{title="Menghubungkan Sumber Data vs Menghubungkan Tabel Data Eksternal"}
- **Menghubungkan Sumber Data** mengacu pada membangun koneksi dengan database tertentu atau layanan API, dapat menggunakan fitur database atau layanan API secara penuh;
- **Menghubungkan Tabel Data Eksternal** mengacu pada mengambil data dari eksternal dan memetakannya ke penggunaan lokal, di database disebut FDW (Foreign Data Wrapper), adalah teknologi database yang berfokus pada penggunaan tabel jarak jauh sebagai tabel lokal, hanya dapat menghubungkan tabel satu per satu. Karena akses jarak jauh, akan ada berbagai batasan dan keterbatasan saat digunakan.

Keduanya juga dapat digunakan bersamaan; yang pertama untuk membangun koneksi dengan sumber data, yang kedua untuk akses lintas sumber data. Misalnya, terhubung ke sumber data PostgreSQL tertentu, dan dalam sumber data ini ada tabel yang merupakan tabel data eksternal yang dibuat berdasarkan FDW.
:::

### MySQL

MySQL melalui engine `federated` yang perlu diaktifkan, mendukung koneksi MySQL jarak jauh dan database yang kompatibel dengan protokolnya, seperti MariaDB. Untuk dokumentasi rinci, lihat [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Pada PostgreSQL, ekstensi `fdw` dengan tipe yang berbeda dapat digunakan untuk mendukung tipe data jarak jauh yang berbeda. Saat ini ekstensi yang didukung adalah:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): hubungkan ke database PostgreSQL jarak jauh dari PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): hubungkan ke database MySQL jarak jauh dari PostgreSQL.
- Untuk tipe ekstensi fdw lainnya, lihat [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers); integrasi ke NocoBase memerlukan implementasi antarmuka adapter yang sesuai dalam kode.

## Prasyarat

- Jika database utama NocoBase adalah MySQL, perlu mengaktifkan `federated`, lihat [Cara Mengaktifkan Engine federated MySQL](./enable-federated)

Kemudian instal dan aktifkan Plugin melalui plugin manager

![Instal dan Aktifkan Plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual Penggunaan

Pada dropdown "Manajemen Tabel Data > Buat Tabel Data", pilih "Hubungkan Data Eksternal"

![Hubungkan Data Eksternal](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Pada dropdown "Layanan Database", pilih layanan database yang sudah ada, atau "Buat Layanan Database"

![Layanan Database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Buat layanan database

![Buat Layanan Database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Setelah memilih layanan database, pada dropdown "Tabel Jarak Jauh", pilih tabel data yang ingin dihubungkan.

![Pilih Tabel Data yang Ingin Dihubungkan](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurasikan informasi field

![Konfigurasi Informasi Field](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jika tabel jarak jauh memiliki perubahan struktur, Anda juga dapat "Sinkronisasi dari Tabel Jarak Jauh"

![Sinkronisasi dari Tabel Jarak Jauh](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sinkronisasi tabel jarak jauh

![Sinkronisasi Tabel Jarak Jauh](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Akhirnya, tampilan pada antarmuka

![Tampilan pada Antarmuka](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)
