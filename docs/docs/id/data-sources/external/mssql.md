---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Sumber Data Eksternal - MSSQL"
description: "Pelajari cara menghubungkan MSSQL/SQL Server sebagai database eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, konfigurasi koneksi, koneksi terenkripsi, izin, dan pemetaan field."
keywords: "sumber data eksternal,MSSQL,SQL Server,database eksternal,pemetaan field,NocoBase"
---

# MSSQL

## Pendahuluan

MSSQL (SQL Server) dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari SQL Server, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [database utama](../main/index.md), struktur tabel sebenarnya pada MSSQL eksternal tetap dikelola oleh sistem bisnis asal, klien database, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | SQL Server 2014-2019. |
| Edisi komersial | Didukung oleh edisi Standard, Professional, dan Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-mssql`. |
| Fitur koneksi | Mendukung konfigurasi 「Encrypt connection」 dan 「Trust server certificate」. |

Skenario yang sesuai untuk menggunakan MSSQL eksternal:

- Menghubungkan database SQL Server dari sistem bisnis seperti ERP, MES, WMS, CRM, dan lainnya
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan workflow, perbaikan data, atau menampilkan laporan untuk tabel yang sudah ada
- Struktur database tetap dikelola oleh DBA, skrip migrasi, atau sistem asal

:::warning Perhatian

MSSQL eksternal bukanlah database sistem NocoBase. NocoBase tidak akan mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui metode aktivasinya secara lebih rinci, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih MSSQL, lalu isi informasi koneksi.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Konfigurasi koneksi yang umum adalah sebagai berikut:

| Konfigurasi | Keterangan |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan sebagai referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami oleh pengguna bisnis, seperti 「ERP SQL Server」 atau 「Database keuangan」. |
| Host / Port | Alamat host dan port SQL Server. Port default biasanya adalah `1433`. |
| Database | Nama database SQL Server yang akan dihubungkan. |
| Username / Password | Akun dan kata sandi untuk menghubungkan ke SQL Server. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek privat milik akun lain. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya akan membaca tabel data dan view yang cocok dengan awalan tersebut, lalu membuat nama tabel tanpa awalan di NocoBase. |
| Encrypt connection | Menentukan apakah koneksi terenkripsi diaktifkan. Aktifkan jika database mewajibkan enkripsi atau jalur jaringan perlu dienkripsi. |
| Trust server certificate | Menentukan apakah sertifikat server dipercaya. Mungkin perlu diaktifkan di lingkungan pengujian atau lingkungan dengan sertifikat yang ditandatangani sendiri; untuk lingkungan produksi, sebaiknya gunakan sertifikat tepercaya. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat 「Add all collections」 diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dicentang di 「Collections」 yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Jika dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Jika terdapat banyak objek di SQL Server, persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, dan 「Collections」. Hubungkan hanya tabel dan view yang digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi berikutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, Anda dapat mengeklik 「Load Collections」 untuk membaca tabel data dan view yang tersedia di SQL Server. Hasil pembacaan dipengaruhi oleh akun koneksi, `Database`, `Table prefix`, dan konfigurasi 「Collections」.

Secara default, 「Add all collections」 akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu centang tabel data atau view yang diperlukan dalam daftar.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu kali proses. Jika terdapat banyak objek di SQL Server, sebaiknya persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, atau 「Collections」.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel MSSQL eksternal dikelola di sisi database. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di SQL Server eksternal.

Jika struktur tabel di sisi SQL Server berubah, Anda dapat menjalankan 「Sync from database」 pada sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, primary key, unique key, dan pemetaan tipe field yang tersimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di SQL Server.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key sebenarnya ke tabel SQL Server.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field SQL Server ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilannya di antarmuka melalui konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field SQL Server | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox、Switch. |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group. |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group. |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number、Percent、Currency. |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number、Percent. |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT`、`NTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date、Time、Created at、Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date、Time、Created at、Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID、Input. |
| `JSON` | `json`、`array` | JSON. |

:::warning Perhatian

Tipe field SQL Server yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field semacam ini harus diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan identifikasi unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identifikasi unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan primary key gabungan, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak tersedia identifikasi unik, blok halaman mungkin tidak dapat melihat, mengedit, atau menghapus record dengan benar.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Tautan terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat pintu masuk sumber data dan cara mengelolanya
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field