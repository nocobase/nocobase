---
pkg: "@nocobase/plugin-collection-fdw"
title: "Menghubungkan tabel data eksternal (FDW)"
description: "Plugin untuk menghubungkan tabel data jarak jauh berbasis Foreign Data Wrapper, termasuk mesin MySQL federated dan PostgreSQL postgres_fdw, lalu memetakan tabel jarak jauh sebagai tabel lokal."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,tabel eksternal,tabel jarak jauh,NocoBase"
---
# Menghubungkan tabel data eksternal (FDW)

## Pendahuluan

Plugin untuk menghubungkan tabel data jarak jauh yang diimplementasikan berdasarkan foreign data wrapper database. Saat ini mendukung database MySQL dan PostgreSQL.

:::info{title="Menghubungkan sumber data vs menghubungkan tabel data eksternal"}
- **Menghubungkan sumber data** berarti membuat koneksi dengan database atau layanan API tertentu, sehingga fitur database atau layanan yang disediakan API dapat digunakan secara lengkap;
- **Menghubungkan tabel data eksternal** berarti memperoleh data dari sumber eksternal dan memetakannya untuk digunakan secara lokal. Di dalam database, hal ini disebut FDW（Foreign Data Wrapper）, yaitu teknologi database yang berfokus pada penggunaan tabel jarak jauh sebagai tabel lokal, dan hanya dapat menghubungkan tabel satu per satu. Karena mengakses data jarak jauh, terdapat berbagai batasan dan kendala saat digunakan.

Keduanya juga dapat digunakan secara bersamaan. Yang pertama digunakan untuk membuat koneksi ke sumber data, sedangkan yang kedua digunakan untuk mengakses data lintas sumber. Misalnya, setelah menghubungkan suatu sumber data PostgreSQL, salah satu tabel di dalam sumber data tersebut merupakan tabel data eksternal yang dibuat berdasarkan FDW.
:::

### MySQL

MySQL menggunakan mesin `federated` yang perlu diaktifkan dan mendukung koneksi ke MySQL jarak jauh serta database yang kompatibel dengan protokolnya, seperti MariaDB. Untuk detailnya, lihat dokumentasi [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Di PostgreSQL, berbagai jenis ekstensi `fdw` dapat digunakan untuk mendukung berbagai jenis data jarak jauh. Ekstensi yang saat ini didukung adalah:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：menghubungkan PostgreSQL ke database PostgreSQL jarak jauh.
- [mysql_fdw (sedang dikembangkan)](https://github.com/EnterpriseDB/mysql_fdw)：menghubungkan PostgreSQL ke database MySQL jarak jauh.
- Untuk ekstensi fdw jenis lainnya, lihat [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Agar dapat digunakan di NocoBase, antarmuka adaptasi yang sesuai perlu diimplementasikan dalam kode.

## Penginstalan

Prasyarat

- Jika database utama NocoBase adalah MySQL, `federated` perlu diaktifkan. Lihat [Cara mengaktifkan mesin federated di MySQL](./enable-federated.md)

Kemudian instal dan aktifkan plugin melalui pengelola plugin

![Instal dan aktifkan plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Panduan penggunaan

Pada menu tarik-turun 「Manajemen tabel data > Buat tabel data」, pilih 「Hubungkan data eksternal」

![Hubungkan data eksternal](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Pada opsi tarik-turun 「Layanan database」, pilih layanan database yang sudah ada atau 「Buat layanan database」

![Layanan database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Buat layanan database

![Buat layanan database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Setelah memilih layanan database, pada opsi tarik-turun 「Tabel jarak jauh」, pilih tabel data yang ingin dihubungkan.

![Pilih tabel data yang ingin dihubungkan](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurasikan informasi bidang

![Konfigurasikan informasi bidang](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jika struktur tabel jarak jauh berubah, Anda juga dapat memilih 「Sinkronkan dari tabel jarak jauh」

![Sinkronkan dari tabel jarak jauh](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sinkronisasi tabel jarak jauh

![Sinkronisasi tabel jarak jauh](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Terakhir, tampilkan di antarmuka

![Tampilkan di antarmuka](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)