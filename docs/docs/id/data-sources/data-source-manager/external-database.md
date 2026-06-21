---
title: "Database Eksternal"
description: "Menambahkan MySQL/MariaDB/PostgreSQL/MSSQL/Oracle eksternal sebagai data source, sinkronisasi Collection, konfigurasi field, pembuatan field relasi, koneksi read-only ke database yang sudah ada."
keywords: "database eksternal,MySQL,PostgreSQL,MSSQL,Oracle,sinkronisasi Collection,field relasi,NocoBase"
---

# Database Eksternal

## Pengantar

Menggunakan database eksternal yang sudah ada sebagai data source. Database eksternal yang saat ini didukung meliputi MySQL, MariaDB, PostgreSQL, MSSQL, Oracle.

## Petunjuk Penggunaan

### Menambahkan Database Eksternal

Setelah plugin diaktifkan, Anda dapat memilih dan menambahkannya melalui dropdown Add new pada manajemen data source.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Isi informasi database yang akan diintegrasikan

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sinkronisasi Collection

Setelah database eksternal terhubung, semua Collection di data source akan langsung dibaca. Database eksternal tidak mendukung penambahan Collection langsung atau modifikasi struktur tabel. Jika perlu modifikasi, dapat dioperasikan melalui database client, lalu klik tombol "Refresh" di antarmuka untuk sinkronisasi.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Konfigurasi Field

Database eksternal akan otomatis membaca field dari Collection yang sudah ada, dan menampilkannya. Anda dapat dengan cepat melihat dan mengonfigurasi judul field, tipe data (Field type), dan tipe UI (Field interface). Anda juga dapat mengklik tombol "Edit" untuk mengubah konfigurasi lebih lanjut.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Karena database eksternal tidak mendukung modifikasi struktur tabel, saat menambahkan field, hanya tipe field relasi yang dapat dipilih. Field relasi bukanlah field aktual, melainkan digunakan untuk membangun koneksi antar Collection.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Untuk lebih lanjut, lihat bagian [Field Collection / Ikhtisar](/data-sources/data-modeling/collection-fields).

### Pemetaan Tipe Field

NocoBase akan otomatis memetakan tipe data (Field type) dan tipe UI (Field Interface) yang sesuai untuk tipe field database eksternal.

- Tipe Data (Field type): Digunakan untuk mendefinisikan jenis, format, dan struktur data yang dapat disimpan field;
- Tipe UI (Field interface): Mengacu pada tipe kontrol yang digunakan untuk menampilkan dan menginput nilai field di antarmuka pengguna.

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
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipe Field yang Tidak Didukung

Tipe field yang tidak didukung akan ditampilkan secara terpisah. Field-field ini perlu dikembangkan adaptasinya sebelum dapat digunakan.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filter Target Key

Collection yang digunakan sebagai tampilan block harus mengonfigurasi Filter target key. Filter target key mengacu pada filter data berdasarkan field tertentu, dan nilai field harus memiliki keunikan. Filter target key secara default adalah field Primary Key Collection. Jika Collection adalah view atau Collection tanpa Primary Key, atau Collection dengan Primary Key gabungan, perlu mengkustomisasi filter target key.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Hanya Collection yang sudah diatur filter target key-nya yang dapat ditambahkan ke halaman

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)
