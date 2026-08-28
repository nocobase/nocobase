---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Sumber Data Eksternal - MariaDB"
description: "Pelajari cara menghubungkan MariaDB sebagai basis data eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, konfigurasi koneksi, cakupan tabel, izin, dan pemetaan field."
keywords: "sumber data eksternal,MariaDB,basis data eksternal,pemetaan field,NocoBase"
---

# MariaDB

## Pengenalan

MariaDB dapat dihubungkan ke NocoBase sebagai basis data eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari MariaDB, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [basis data utama](../data-source-main/index.md), struktur tabel sebenarnya pada MariaDB eksternal tetap dikelola oleh sistem bisnis asli, klien basis data, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, alur kerja, dan API.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | MariaDB >= 10.3. |
| Versi komersial | Didukung oleh edisi Standard, Professional, dan Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-mariadb`. |
| Protokol yang kompatibel | Menggunakan protokol MySQL untuk koneksi; pemetaan field secara keseluruhan mengikuti logika kompatibilitas MySQL. |

Skenario yang sesuai untuk menggunakan MariaDB eksternal:

- Menghubungkan basis data MariaDB dari sistem bisnis seperti ERP, MES, WMS, CRM, dan sebagainya
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan alur, koreksi data, atau tampilan laporan pada tabel yang sudah ada
- Struktur basis data tetap dikelola oleh DBA, skrip migrasi, atau sistem asli

:::warning Perhatian

MariaDB eksternal bukan basis data sistem NocoBase. NocoBase tidak akan mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui cara aktivasinya secara detail, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih MariaDB, lalu isi informasi koneksi.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Berikut adalah konfigurasi koneksi yang umum:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan sebagai referensi dalam blok halaman, izin, alur kerja, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami oleh pengguna bisnis, seperti 「ERP MariaDB」 atau 「Basis data pesanan」. |
| Host / Port | Alamat host dan port MariaDB. Port default biasanya adalah `3306`. |
| Database | Nama basis data MariaDB yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk terhubung ke MariaDB. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya akan membaca tabel data dan view yang cocok dengan awalan ini, lalu membuat nama tabel data tanpa awalan tersebut di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat 「Add all collections」 diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dipilih di 「Collections」 yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap tersimpan, tetapi blok halaman, izin, alur kerja, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Jika terdapat banyak objek di MariaDB, persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, dan 「Collections」. Hubungkan hanya tabel dan view yang akan digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi selanjutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, Anda dapat mengeklik 「Load Collections」 untuk membaca tabel data dan view yang tersedia di MariaDB. Hasil pembacaan dipengaruhi oleh akun koneksi, `Database`, `Table prefix`, dan konfigurasi 「Collections」.

Secara default, 「Add all collections」 akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu pilih tabel data atau view yang diperlukan dalam daftar.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika terdapat banyak objek di MariaDB, sebaiknya persempit cakupan terlebih dahulu melalui `Database`, `Table prefix`, atau 「Collections」.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel MariaDB eksternal dikelola di sisi basis data. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di MariaDB eksternal.

Saat struktur tabel di MariaDB berubah, Anda dapat menjalankan 「Sync from database」 di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, primary key, unique key, dan pemetaan tipe field yang tersimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di MariaDB.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key sebenarnya ke tabel MariaDB.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field MariaDB ke Field type dan Field interface yang sesuai. Pemetaan field umum MariaDB pada dasarnya sama dengan MySQL. Anda dapat menyesuaikan cara tampilannya di antarmuka melalui konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field MariaDB | NocoBase Field type | Field interface yang tersedia |
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

Tipe field MariaDB yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut perlu diadaptasi oleh pengembang terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan identitas unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identitas unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak tersedia identitas unik yang dapat digunakan, blok halaman mungkin tidak dapat menampilkan, mengedit, atau menghapus record dengan benar.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Link terkait

- [Basis data eksternal](./index.md) — Lihat konfigurasi umum dan penjelasan pengelolaan basis data eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat akses dan metode pengelolaan sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field