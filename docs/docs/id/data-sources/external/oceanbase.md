---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Sumber data eksternal - OceanBase"
description: "Pelajari cara menghubungkan OceanBase sebagai database eksternal ke NocoBase, termasuk versi yang didukung, mode kompatibilitas MySQL, konfigurasi koneksi, cakupan tabel, izin, dan pemetaan field."
keywords: "sumber data eksternal,OceanBase,database eksternal,mode kompatibilitas MySQL,pemetaan field,NocoBase"
---

# OceanBase

## Pengenalan

OceanBase dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari OceanBase, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [database utama](../main/index.md), struktur tabel sebenarnya pada OceanBase eksternal tetap dikelola oleh sistem bisnis asli, klien database, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | OceanBase >= 4.3. |
| Versi komersial | Edisi Enterprise didukung. |
| Plugin terkait | `@nocobase/plugin-data-source-oceanbase`. |
| Mode database | Hanya mode kompatibilitas MySQL yang didukung. |

Skenario yang sesuai untuk menggunakan OceanBase eksternal:

- Menghubungkan database bisnis pada tenant OceanBase MySQL yang sudah ada
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan workflow, perbaikan data, atau tampilan laporan pada tabel yang sudah ada
- Struktur database tetap dikelola oleh DBA, skrip migrasi, atau sistem asli

:::warning Perhatian

OceanBase sebagai database eksternal hanya mendukung mode kompatibilitas MySQL. Jika menggunakan mode kompatibilitas Oracle, NocoBase tidak dapat membaca struktur tabel dan tipe field menggunakan plugin saat ini.

:::

## Penginstalan plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui cara aktivasinya secara mendetail, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di「Manajemen sumber data」, klik「Add new」, pilih OceanBase, lalu isi informasi koneksi.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Konfigurasi koneksi yang umum adalah sebagai berikut:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan untuk referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami staf bisnis, misalnya「Database bisnis OceanBase」「Database laporan」. |
| Host / Port | Alamat dan port koneksi OceanBase yang kompatibel dengan MySQL. Port bergantung pada konfigurasi tenant atau proxy yang sebenarnya. |
| Database | Nama database OceanBase yang akan dihubungkan. |
| Username / Password | Akun dan kata sandi yang digunakan untuk terhubung ke OceanBase. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang cocok dengan awalan tersebut, lalu membuat nama tabel tanpa awalan di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat「Add all collections」diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dipilih di「Collections」yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Jika terdapat banyak objek di OceanBase, persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, dan「Collections」. Hubungkan hanya tabel dan view yang akan digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi berikutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, klik「Load Collections」untuk membaca tabel data dan view yang tersedia di OceanBase. Hasil pembacaan dipengaruhi oleh akun koneksi, `Database`, `Table prefix`, dan konfigurasi「Collections」.

Secara default,「Add all collections」akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan「Add all collections」, lalu pilih tabel data atau view yang diperlukan dari daftar.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika terdapat banyak objek di OceanBase, sebaiknya persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, atau「Collections」.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel OceanBase eksternal dikelola di sisi database. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di OceanBase eksternal.

Jika struktur tabel di OceanBase berubah, jalankan「Sync from database」di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui tabel data, field, primary key, unique key, dan informasi pemetaan tipe field yang disimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di OceanBase.

Setelah field disinkronkan, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan otomatis menambahkan field foreign key sebenarnya ke tabel OceanBase.

## Pemetaan tipe field

NocoBase mengenali tipe field OceanBase berdasarkan logika kompatibilitas MySQL, lalu memetakannya secara otomatis ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilnya di konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field OceanBase | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Perhatian

Tipe field OceanBase yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut memerlukan pengembangan adaptor sebelum dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan pengenal unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, disarankan memiliki primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai pengenal unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur「Record unique key」secara manual dalam konfigurasi tabel data. Jika tidak ada pengenal unik yang tersedia, blok halaman mungkin tidak dapat melihat, mengedit, atau menghapus record dengan benar.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Tautan terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan penjelasan manajemen database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat akses dan metode pengelolaan sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field