---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Sumber data utama - OceanBase"
description: "Pelajari versi yang didukung, cara memasang plugin, petunjuk penggunaan, dan pemetaan field saat OceanBase digunakan sebagai database utama NocoBase."
keywords: "Sumber data utama,OceanBase,database utama,pemetaan field,NocoBase"
---

# OceanBase

## Pendahuluan

OceanBase dapat digunakan sebagai database utama NocoBase untuk menyimpan data tabel sistem NocoBase dan data bisnis dalam sumber data utama. Database utama dikonfigurasi saat NocoBase diterapkan dan tidak dapat dihapus setelah aplikasi berjalan.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | >= 4.3. |
| Versi komersial | Didukung oleh Edisi Enterprise. |
| Jenis database | Mode kompatibilitas MySQL. |

:::warning Perhatian

OceanBase sebagai database utama hanya mendukung mode kompatibilitas MySQL.

:::

## Pemasangan plugin

OceanBase disediakan oleh `@nocobase/plugin-data-source-oceanbase` dan memerlukan lisensi komersial.

## Panduan penggunaan

1. Saat menerapkan NocoBase, pilih atau isi parameter koneksi yang sesuai untuk OceanBase dalam konfigurasi koneksi database.
2. Setelah NocoBase dimulai, masuk ke sumber data 「Main」 di 「Manajemen sumber data」 untuk mengelola tabel dan field data dalam database utama.
3. Jika perlu menghubungkan tabel yang sudah ada dalam database, gunakan 「Sinkronkan dari database」 pada halaman manajemen database utama.
4. Saat mengonfigurasi field tabel data, Anda dapat merujuk ke direktori [tabel data](../data-modeling/collection.md) dan [field](../data-modeling/collection-fields/index.md) untuk memilih jenis field dan komponen field.

## Pemetaan jenis field

Dalam database utama, saat membuat field melalui halaman NocoBase, NocoBase akan membuat field OceanBase yang sesuai berdasarkan konfigurasi field. Saat menghubungkan tabel yang sudah ada melalui 「Sinkronkan dari database」, NocoBase akan mengenali jenis field OceanBase berdasarkan logika kompatibilitas MySQL dan secara otomatis memetakannya ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Jenis field OceanBase | NocoBase Field type | Field interface yang tersedia |
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

Jenis field OceanBase yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut hanya dapat digunakan sebagai field biasa di NocoBase setelah dilakukan pengembangan adaptasi.

:::

Lihat [pendahuluan sumber data utama](./index.md) untuk konfigurasi umum lainnya.
