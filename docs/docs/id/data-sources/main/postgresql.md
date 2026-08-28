---
pkg: "@nocobase/plugin-data-source-manager"
title: "Sumber Data Utama - PostgreSQL"
description: "Pelajari versi yang didukung, cara memasang plugin, petunjuk penggunaan, dan pemetaan field saat PostgreSQL digunakan sebagai database utama NocoBase."
keywords: "sumber data utama,PostgreSQL,database utama,pemetaan field,NocoBase"
---

# PostgreSQL

## Pengenalan

PostgreSQL dapat digunakan sebagai database utama NocoBase untuk menyimpan data tabel sistem NocoBase dan data bisnis dalam sumber data utama. Database utama dikonfigurasi saat NocoBase diterapkan dan tidak dapat dihapus setelah aplikasi berjalan.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | >= 10. |
| Versi komersial | Edisi komunitas, standar, profesional, dan enterprise semuanya didukung. |
| Jenis database | PostgreSQL. |

PostgreSQL mendukung kemampuan pewarisan tabel dan cocok untuk skenario yang memerlukan pewarisan model data.

## Pemasangan plugin

PostgreSQL merupakan kemampuan bawaan, sehingga tidak perlu memasang plugin secara terpisah.

## Petunjuk penggunaan

1. Saat menerapkan NocoBase, pilih atau isi parameter koneksi PostgreSQL yang sesuai dalam konfigurasi koneksi database.
2. Setelah menjalankan NocoBase, buka sumber data 「Main」 di 「Manajemen sumber data」 untuk mengelola tabel dan field dalam database utama.
3. Jika ingin menghubungkan tabel yang sudah ada dalam database, gunakan 「Sinkronkan dari database」 pada halaman pengelolaan database utama.
4. Saat mengonfigurasi field tabel data, Anda dapat merujuk ke direktori [tabel data](../data-modeling/collection.md) dan [field](../data-modeling/collection-fields/index.md) untuk memilih jenis field dan komponen field.

## Pemetaan jenis field

Saat membuat field melalui halaman NocoBase dalam database utama, NocoBase akan membuat field PostgreSQL yang sesuai berdasarkan konfigurasi field. Saat menghubungkan tabel yang sudah ada melalui 「Sinkronkan dari database」, NocoBase akan secara otomatis memetakan jenis field PostgreSQL ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Jenis field PostgreSQL | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group、Unix timestamp、Created at、Updated at。 |
| `REAL` | `float` | Number、Percent。 |
| `DOUBLE PRECISION` | `double` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text`、`json` | Textarea、Markdown、Vditor、Rich text、URL、JSON。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `TIMESTAMP` | `date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point、Line string、Polygon、Circle、JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group。 |

:::warning Perhatian

Jenis field PostgreSQL yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut harus diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

Lihat [pengenalan sumber data utama](./index.md) untuk konfigurasi umum lainnya.
