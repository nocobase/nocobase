---
title: "Ikhtisar Sumber Data"
description: "Sumber data dan pemodelan data NocoBase: database utama, database eksternal, REST API, NocoBase eksternal, manajemen sumber data, tabel biasa, tabel pohon, tabel SQL, tabel file."
keywords: "sumber data,pemodelan data,database utama,database eksternal,REST API,NocoBase eksternal,Collection,tabel pohon,tabel SQL,NocoBase"
---

# Ikhtisar

Pemodelan data merupakan langkah penting dalam merancang database. Proses ini mencakup analisis dan abstraksi mendalam terhadap berbagai jenis data di dunia nyata beserta hubungan antardata tersebut. Dalam proses ini, kita berupaya mengungkap hubungan internal antar data dan mendeskripsikannya secara formal sebagai model data, sehingga menjadi dasar bagi struktur database sistem informasi. NocoBase adalah platform yang digerakkan oleh model data, dengan fitur-fitur berikut:

## Mendukung integrasi dengan berbagai sumber data

Sumber data NocoBase dapat berupa berbagai database umum, platform API (SDK), dan file.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase menyediakan [plugin manajemen sumber data](./data-source-manager/index.md) untuk mengelola berbagai sumber data beserta tabel datanya. Plugin manajemen sumber data hanya menyediakan antarmuka manajemen untuk semua sumber data, bukan kemampuan untuk menghubungkan sumber data. Plugin ini perlu digunakan bersama berbagai plugin sumber data. Saat ini, sumber data yang didukung meliputi:

- [Sumber data utama](./data-source-main/index.md)：Database utama NocoBase, mendukung PostgreSQL, MySQL, MariaDB, KingbaseES, dan OceanBase.
- [PostgreSQL eksternal](./data-source-external-postgres/index.md)：Menghubungkan database PostgreSQL yang sudah ada.
- [MySQL eksternal](./data-source-external-mysql/index.md)：Menghubungkan database MySQL yang sudah ada.
- [MariaDB eksternal](./data-source-external-mariadb/index.md)：Menghubungkan database MariaDB yang sudah ada.
- [MSSQL eksternal](./data-source-external-mssql/index.md)：Menghubungkan database SQL Server yang sudah ada.
- [KingbaseES eksternal](./data-source-kingbase/index.md)：Menghubungkan database KingbaseES yang sudah ada.
- [OceanBase eksternal](./external/oceanbase.md)：Menghubungkan database OceanBase yang sudah ada.
- [Oracle eksternal](./data-source-external-oracle/index.md)：Menghubungkan database Oracle yang sudah ada.
- [ClickHouse eksternal](./external/clickhouse.md)：Menghubungkan database ClickHouse yang sudah ada.
- [Doris eksternal](./external/doris.md)：Menghubungkan database Doris yang sudah ada.
- [Sumber data REST API](./data-source-rest-api/index.md)：Memetakan REST API sistem pihak ketiga sebagai sumber data.
- [Sumber data NocoBase eksternal](./data-source-external-nocobase/index.md)：Menghubungkan tabel data dari aplikasi NocoBase lain.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Menyediakan berbagai alat pemodelan data

**Antarmuka manajemen tabel data yang sederhana**：Digunakan untuk membuat berbagai model (tabel data) atau menghubungkan model (tabel data) yang sudah ada.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Antarmuka visual seperti diagram ER**：Digunakan untuk mengekstrak entitas dan hubungan antarnya berdasarkan kebutuhan pengguna dan bisnis. Antarmuka ini menyediakan cara yang intuitif dan mudah dipahami untuk mendeskripsikan model data. Dengan diagram ER, entitas data utama dalam sistem beserta hubungan antarnya dapat dipahami dengan lebih jelas.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Mendukung pembuatan berbagai jenis tabel data

| Tabel data | Deskripsi |
| - | - |
| [Tabel data biasa](/data-sources/data-source-main/general-collection) | Menyediakan kolom sistem yang umum digunakan |
| [Tabel data kalender](/data-sources/calendar/calendar-collection) | Digunakan untuk membuat tabel acara terkait kalender |
| [Tabel komentar](/data-sources/collection-comment/) | Digunakan untuk menyimpan komentar atau umpan balik tentang data |
| [Tabel struktur pohon](/data-sources/collection-tree/) | Tabel struktur pohon, saat ini hanya mendukung desain tabel adjacency |
| [Tabel data file](/data-sources/file-manager/file-collection) | Digunakan untuk mengelola penyimpanan file |
| [Menghubungkan tampilan database](/data-sources/collection-view/) | Menghubungkan tampilan database yang sudah ada |
| [Tabel data SQL](/data-sources/collection-sql/) | Bukan tabel database yang sebenarnya, melainkan menampilkan kueri SQL secara terstruktur dengan cepat |
| [Menghubungkan data eksternal](/data-sources/collection-fdw) | Menghubungkan tabel data jarak jauh berdasarkan teknologi FDW database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Untuk informasi lebih lanjut, lihat bab 「[Tabel data / Ikhtisar](/data-sources/data-modeling/collection)」

## Menyediakan berbagai jenis kolom

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Untuk informasi lebih lanjut, lihat bab 「[Kolom tabel data / Ikhtisar](/data-sources/data-modeling/collection-fields/)」
