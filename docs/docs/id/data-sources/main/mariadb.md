---
pkg: "@nocobase/plugin-data-source-manager"
title: "Sumber Data Utama - MariaDB"
description: "Pelajari versi yang didukung, cara memasang plugin, petunjuk penggunaan, dan pemetaan field saat MariaDB digunakan sebagai database utama NocoBase."
keywords: "sumber data utama,MariaDB,database utama,pemetaan field,NocoBase"
---

# MariaDB

## Pendahuluan

MariaDB dapat digunakan sebagai database utama NocoBase untuk menyimpan data tabel sistem NocoBase dan data bisnis dalam sumber data utama. Database utama dikonfigurasi saat NocoBase diterapkan dan tidak dapat dihapus setelah aplikasi berjalan.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | >= 10.9. |
| Versi komersial | Edisi Community, Standard, Professional, dan Enterprise semuanya didukung. |
| Jenis database | MariaDB. |

MariaDB mirip dengan MySQL dan cocok digunakan sebagai database utama untuk sistem bisnis umum.

## Instalasi plugin

MariaDB merupakan kemampuan bawaan, sehingga tidak perlu memasang plugin secara terpisah.

## Petunjuk penggunaan

1. Saat menerapkan NocoBase, pilih atau isi parameter koneksi yang sesuai dengan MariaDB dalam konfigurasi koneksi database.
2. Setelah NocoBase dijalankan, buka sumber data «Main» di «Manajemen sumber data» untuk mengelola tabel dan field dalam database utama.
3. Jika ingin menghubungkan tabel yang sudah ada dalam database, gunakan «Sinkronkan dari database» pada halaman manajemen database utama.
4. Saat mengonfigurasi field tabel, Anda dapat merujuk ke direktori [tabel](../data-modeling/collection.md) dan [field](../data-modeling/collection-fields/index.md) untuk memilih jenis field dan komponen field.

## Pemetaan jenis field

Saat membuat field melalui halaman NocoBase dalam database utama, NocoBase akan membuat field MariaDB yang sesuai berdasarkan konfigurasi field. Saat menghubungkan tabel yang sudah ada melalui «Sinkronkan dari database», NocoBase akan secara otomatis memetakan jenis field MariaDB ke Field type dan Field interface yang sesuai. Pemetaan field umum MariaDB pada dasarnya sama dengan MySQL. Anda dapat menyesuaikan cara tampilnya pada konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Jenis field MariaDB | NocoBase Field type | Field interface yang tersedia |
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

Jenis field MariaDB yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut perlu diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

Untuk konfigurasi umum lainnya, lihat [Pendahuluan sumber data utama](./index.md).
