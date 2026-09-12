---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Sumber data eksternal - MySQL"
description: "Pelajari cara menghubungkan MySQL sebagai basis data eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, konfigurasi koneksi, cakupan tabel, izin, dan pemetaan field."
keywords: "sumber data eksternal,MySQL,basis data eksternal,pemetaan field,NocoBase"
---

# MySQL

## Pengenalan

MySQL dapat dihubungkan ke NocoBase sebagai basis data eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari MySQL, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [basis data utama](../data-source-main/index.md), struktur tabel sebenarnya pada MySQL eksternal tetap dikelola oleh sistem bisnis asal, klien basis data, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, alur kerja, dan API.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | MySQL >= 5.7. |
| Edisi komersial | Didukung oleh edisi Standard, Professional, dan Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-mysql`. |
| Protokol yang kompatibel | Terhubung menggunakan protokol MySQL. |

Skenario yang cocok untuk menggunakan MySQL eksternal:

- Menghubungkan basis data MySQL milik sistem bisnis seperti ERP, MES, WMS, dan CRM yang sudah ada
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan alur, koreksi data, atau tampilan laporan pada tabel yang sudah ada
- Struktur basis data tetap dikelola oleh DBA, skrip migrasi, atau sistem asal

:::warning Perhatian

MySQL eksternal bukan basis data sistem NocoBase. NocoBase tidak mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui cara aktivasinya secara detail, lihat [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih MySQL, lalu isi informasi koneksi.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Berikut adalah konfigurasi koneksi yang umum:

| Konfigurasi | Keterangan |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan sebagai referensi dalam blok halaman, izin, alur kerja, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Disarankan menggunakan nama yang mudah dipahami staf bisnis, misalnya 「ERP MySQL」 atau 「Basis data pesanan」. |
| Host / Port | Alamat host dan port MySQL. Port default biasanya adalah `3306`. |
| Database | Nama basis data MySQL yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan MySQL. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang cocok dengan awalan ini, lalu membuat nama tabel tanpa awalan di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Jika 「Add all collections」 diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini. Jika dinonaktifkan, hanya objek yang dipilih di 「Collections」 yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Jika dinonaktifkan, konfigurasi sumber data tetap tersimpan, tetapi blok halaman, izin, alur kerja, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Jika terdapat banyak objek di MySQL, persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, dan 「Collections」. Hubungkan hanya tabel dan view yang digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi berikutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, klik 「Load Collections」 untuk membaca tabel data dan view yang tersedia di MySQL. Hasil pembacaan dipengaruhi oleh akun koneksi, `Database`, `Table prefix`, dan konfigurasi 「Collections」.

Secara default, 「Add all collections」 akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu pilih tabel data atau view yang diperlukan dalam daftar.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika terdapat banyak objek di MySQL, sebaiknya persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, atau 「Collections」.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel MySQL eksternal dikelola di sisi basis data. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di MySQL eksternal.

Jika struktur tabel di sisi MySQL berubah, jalankan 「Sync from database」 di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, kunci utama, kunci unik, dan pemetaan tipe field yang tersimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di MySQL.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan otomatis menambahkan field foreign key sebenarnya ke tabel MySQL.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field MySQL ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilannya di antarmuka melalui konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field MySQL | NocoBase Field type | Field interface yang tersedia |
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

Tipe field MySQL yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut memerlukan pengembangan adaptor sebelum dapat digunakan sebagai field biasa di NocoBase.

:::

## Kunci utama dan pengenal unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia kunci utama atau field unik. NocoBase akan memprioritaskan kunci utama sebagai pengenal unik record.

Jika yang dihubungkan adalah view, tabel tanpa kunci utama, atau tabel dengan kunci utama gabungan, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak tersedia pengenal unik yang dapat digunakan, blok halaman mungkin tidak dapat menampilkan, mengedit, atau menghapus record dengan benar.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Basis data eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan basis data eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat pintu masuk sumber data dan cara mengelola sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field