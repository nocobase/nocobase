---
pkg: "@nocobase/plugin-data-source-manager"
title: "Sumber Data Utama - MySQL"
description: "Pelajari versi yang didukung, cara memasang plugin, petunjuk penggunaan, dan pemetaan field saat MySQL digunakan sebagai database utama NocoBase."
keywords: "Sumber Data Utama,MySQL,Database Utama,Pemetaan Field,NocoBase"
---

# MySQL

## Pendahuluan

MySQL dapat digunakan sebagai database utama NocoBase untuk menyimpan data tabel sistem NocoBase dan data bisnis dalam sumber data utama. Database utama dikonfigurasi saat NocoBase diterapkan dan tidak dapat dihapus setelah aplikasi berjalan.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | >= 8.0.17. |
| Edisi komersial | Didukung oleh Edisi Komunitas, Edisi Standar, Edisi Profesional, dan Edisi Enterprise. |
| Jenis database | MySQL. |

MySQL cocok digunakan sebagai database utama untuk sistem bisnis umum.

## Pemasangan plugin

MySQL merupakan kemampuan bawaan dan tidak memerlukan pemasangan plugin secara terpisah.

## Petunjuk penggunaan

1. Saat menerapkan NocoBase, pilih atau isi parameter koneksi MySQL yang sesuai dalam konfigurasi koneksi database.
2. Setelah memulai NocoBase, buka sumber data 「Main」 di 「Manajemen sumber data」 untuk mengelola tabel dan field dalam database utama.
3. Jika ingin menghubungkan tabel yang sudah ada dalam database, gunakan 「Sinkronkan dari database」 pada halaman pengelolaan database utama.
4. Saat mengonfigurasi field tabel data, Anda dapat merujuk ke direktori [Tabel data](../data-modeling/collection.md) dan [Field](../data-modeling/collection-fields/index.md) untuk memilih jenis field dan komponen field.

## Pemetaan jenis field

Dalam database utama, saat membuat field melalui halaman NocoBase, NocoBase akan membuat field MySQL yang sesuai berdasarkan konfigurasi field. Saat menghubungkan tabel yang sudah ada melalui 「Sinkronkan dari database」, NocoBase akan secara otomatis memetakan jenis field MySQL ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Jenis field MySQL | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Perhatian

Jenis field MySQL yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut harus diadaptasikan melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

Untuk konfigurasi umum lainnya, lihat [Pendahuluan sumber data utama](./index.md).
