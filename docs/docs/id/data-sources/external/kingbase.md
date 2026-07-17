---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Sumber data eksternal - KingbaseES"
description: "Pelajari cara menghubungkan KingbaseES ke NocoBase sebagai basis data eksternal, termasuk versi yang didukung, mode kompatibilitas PostgreSQL, konfigurasi koneksi, Schema, izin, dan pemetaan field."
keywords: "Sumber data eksternal,KingbaseES,Renda Jincang,basis data eksternal,mode kompatibilitas PostgreSQL,pemetaan field,NocoBase"
---

# KingbaseES

## Pendahuluan

KingbaseES dapat dihubungkan ke NocoBase sebagai basis data eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari KingbaseES, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [basis data utama](../main/index.md), struktur tabel aktual KingbaseES eksternal tetap dikelola oleh sistem bisnis asli, klien basis data, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | KingbaseES >= V9. |
| Versi komersial | Didukung oleh Edisi Profesional dan Edisi Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-kingbase`. |
| Mode basis data | Hanya mendukung mode kompatibilitas PostgreSQL. |

Skenario yang cocok untuk menggunakan KingbaseES eksternal:

- Menghubungkan basis data bisnis KingbaseES yang sudah ada di lingkungan pemerintahan dan perusahaan, intranet, atau lingkungan yang menggunakan produk lokal
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Memberlakukan kontrol izin, pemrosesan workflow, perbaikan data, atau menampilkan laporan untuk tabel yang sudah ada
- Struktur basis data tetap dikelola oleh DBA, skrip migrasi, atau sistem asli

:::warning Perhatian

Saat KingbaseES digunakan sebagai basis data eksternal, hanya mode kompatibilitas PostgreSQL yang didukung. Jika basis data tidak menggunakan mode kompatibilitas PostgreSQL, NocoBase tidak dapat membaca struktur tabel dan tipe field menggunakan plugin saat ini.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk informasi mendetail tentang cara mengaktifkannya, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih KingbaseES, lalu isi informasi koneksi.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Berikut konfigurasi koneksi yang umum:

| Konfigurasi | Keterangan |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan untuk referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami oleh pengguna bisnis, misalnya 「KingbaseES pemerintahan」atau「Basis data laporan」. |
| Host / Port | Alamat host dan port KingbaseES. Port mengikuti konfigurasi aktual basis data. |
| Database | Nama basis data KingbaseES yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan KingbaseES. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek privat akun lain. |
| Schema | schema yang akan dibaca. Jika basis data memiliki beberapa schema, sebaiknya hanya isi schema yang diperlukan oleh bisnis saat ini. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang cocok dengan awalan tersebut, lalu membuat nama tabel data tanpa awalan di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat 「Add all collections」diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dipilih di 「Collections」yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Jika terdapat banyak objek di KingbaseES, prioritaskan penggunaan `Schema`, `Table prefix`, dan 「Collections」untuk mempersempit cakupan. Hubungkan hanya tabel dan view yang digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi selanjutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, klik 「Load Collections」untuk membaca tabel data dan view yang tersedia di KingbaseES. Hasil pembacaan dipengaruhi oleh akun koneksi, `Schema`, `Table prefix`, dan konfigurasi 「Collections」.

Secara default, 「Add all collections」akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu pilih tabel data atau view yang diperlukan dalam daftar.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu kali proses. Jika terdapat banyak objek di KingbaseES, sebaiknya gunakan `Schema`, `Table prefix`, atau 「Collections」untuk mempersempit cakupan terlebih dahulu.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel KingbaseES eksternal dikelola di sisi basis data. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field aktual di KingbaseES eksternal.

Saat struktur tabel di sisi KingbaseES berubah, Anda dapat menjalankan 「Sync from database」di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, primary key, unique key, dan pemetaan tipe field yang disimpan di NocoBase, tetapi tidak akan menghapus tabel atau data aktual di KingbaseES.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key aktual ke tabel KingbaseES.

## Pemetaan tipe field

NocoBase mengenali tipe field KingbaseES berdasarkan logika kompatibilitas PostgreSQL, lalu secara otomatis memetakannya ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilnya di antarmuka melalui konfigurasi field.

Berikut pemetaan yang umum:

| Tipe field KingbaseES | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Perhatian

Tipe field KingbaseES yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut perlu diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan identifikasi unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identifikasi unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur 「Record unique key」secara manual dalam konfigurasi tabel data. Jika tidak tersedia identifikasi unik yang dapat digunakan, blok halaman mungkin tidak dapat melihat, mengedit, atau menghapus record dengan benar.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Link terkait

- [Basis data eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan basis data eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat akses sumber data dan cara mengelola sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field