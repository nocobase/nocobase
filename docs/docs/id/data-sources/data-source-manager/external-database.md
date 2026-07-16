---
title: "Database Eksternal"
description: "Database eksternal NocoBase: menghubungkan database MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris yang sudah ada, membaca struktur tabel data, mengonfigurasi pemetaan field dan field relasi."
keywords: "database eksternal,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,sinkronisasi tabel data,pemetaan field,NocoBase"
---

# Database Eksternal

## Pengenalan

Database eksternal digunakan untuk menghubungkan database bisnis yang sudah ada ke NocoBase, membaca tabel data, field, dan view dari database eksternal, sehingga tabel-tabel tersebut dapat digunakan di blok halaman, izin, workflow, dan API.

Berbeda dengan [database utama](../data-source-main/index.md), struktur tabel database eksternal dikelola oleh sistem asal atau klien database. NocoBase bertanggung jawab membaca struktur tabel dan view, dan tidak akan mengubah struktur tabel sebenarnya pada database eksternal.

Versi database dan edisi komersial yang didukung oleh database eksternal adalah sebagai berikut:

| Database | Versi yang didukung | Edisi Komunitas | Edisi Standar | Edisi Profesional | Edisi Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | >= 20.2 | ❌ | ❌ | ❌ | ✅ |
| Doris | >= 2.1.0 | ❌ | ❌ | ❌ | ✅ |

:::tip Catatan

KingbaseES hanya mendukung mode kompatibilitas PostgreSQL, sedangkan OceanBase, ClickHouse, dan Doris hanya mendukung mode kompatibilitas MySQL.

:::

Skenario penggunaan database eksternal:

- Menghubungkan database sistem bisnis yang sudah ada (seperti ERP lama, MES, atau WMS), lalu memanfaatkan kemampuan NocoBase untuk membangun antarmuka manajemen, kontrol izin, workflow, dan laporan dengan cepat tanpa mengubah struktur tabel database asal.
- Menambahkan kemampuan aplikasi ringan ke sistem yang sudah ada, seperti persetujuan, koreksi data, penanganan pengecualian, dan dasbor operasional, tanpa perlu mengganti sistem asal.
- Melakukan kueri hanya-baca, analisis statistik, atau menampilkan BI dari database yang sudah ada untuk mengurangi ketergantungan pada halaman sistem bisnis asal.
- Memigrasikan sistem lama secara bertahap: menghubungkan database lama ke NocoBase terlebih dahulu agar tetap dapat digunakan, lalu secara bertahap menyimpan data bisnis baru di database utama.
- Struktur database tetap dikelola oleh DBA, skrip migrasi, atau sistem bisnis asal, sementara NocoBase hanya bertanggung jawab membaca struktur, mengonfigurasi antarmuka, dan menggunakan data.

:::warning Perhatian

Database eksternal bukan database sistem NocoBase. NocoBase tidak mengambil alih pencadangan, pemulihan, migrasi, atau struktur tabel database eksternal. Semua hal tersebut tetap harus dikelola di database eksternal.

:::

## Instalasi plugin

Database eksternal disediakan oleh plugin sumber data yang sesuai. Setelah plugin diinstal dan diaktifkan, jenis database yang sesuai dapat dipilih dari menu 「Add new」 di 「Manajemen sumber data」.

| Database | Plugin terkait | Metode instalasi |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Memerlukan lisensi komersial. Gunakan setelah plugin diinstal dan diaktifkan. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Jika jenis database yang dituju tidak ada di menu 「Add new」, biasanya perlu memastikan hal-hal berikut terlebih dahulu:

- Apakah plugin terkait sudah diinstal
- Apakah plugin sudah diaktifkan
- Apakah lisensi komersial saat ini mencakup plugin tersebut
- Apakah pengguna saat ini memiliki izin untuk mengelola sumber data


## Panduan penggunaan

### Menambahkan database eksternal

Setelah plugin diaktifkan, database dapat dipilih dan ditambahkan dari menu tarik-turun Add new di manajemen sumber data.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Isi informasi database yang ingin dihubungkan

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sinkronisasi tabel data

Setelah koneksi ke database eksternal dibuat, semua tabel data di sumber data akan langsung dibaca. Database eksternal tidak mendukung penambahan tabel data atau perubahan struktur tabel secara langsung. Jika perlu melakukan perubahan, gunakan klien database, lalu klik tombol 「Refresh」 di antarmuka untuk menyinkronkannya.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Konfigurasi field

Database eksternal akan secara otomatis membaca field dari tabel data yang sudah ada dan menampilkannya. Anda dapat dengan cepat melihat dan mengonfigurasi judul field, tipe data (Field type), dan tipe UI (Field interface), atau mengeklik tombol 「Edit」 untuk mengubah konfigurasi lainnya.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Karena database eksternal tidak mendukung perubahan struktur tabel, saat menambahkan field, hanya tipe yang tersedia adalah field relasi. Field relasi bukanlah field sebenarnya, melainkan digunakan untuk membuat hubungan antara tabel.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Lihat bab [Field tabel data / Ikhtisar](../data-modeling/collection-fields/index.md) untuk informasi selengkapnya.

### Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field database eksternal ke tipe data (Field type) dan tipe UI (Field Interface) yang sesuai.

- Tipe data (Field type): digunakan untuk menentukan jenis, format, dan struktur data yang dapat disimpan oleh field;
- Tipe UI (Field interface): mengacu pada tipe kontrol yang digunakan untuk menampilkan dan memasukkan nilai field di antarmuka pengguna.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipe field yang tidak didukung

Tipe field yang tidak didukung akan ditampilkan secara terpisah. Field tersebut baru dapat digunakan setelah dilakukan penyesuaian oleh pengembang.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Identifikasi unik record

Tabel data yang digunakan untuk ditampilkan sebagai blok harus memiliki 「identifikasi unik record」(Record unique key). Identifikasi unik record digunakan untuk menemukan satu record di blok halaman, biasanya berupa primary key atau field unik.

Untuk view, tabel tanpa primary key, atau tabel dengan primary key gabungan, 「Record unique key」 harus diatur secara manual dalam konfigurasi tabel data. Jika tidak ada identifikasi unik yang tersedia, blok halaman mungkin tidak dapat dibuat dengan benar, atau record tidak dapat dilihat maupun diedit. Penjelasan selengkapnya dapat dilihat di [Database utama / Mengedit tabel data](../main/index.md).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)