---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Sumber data eksternal - PostgreSQL"
description: "Pelajari cara menghubungkan PostgreSQL sebagai database eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, konfigurasi koneksi, Schema, SSL, izin, dan pemetaan field."
keywords: "sumber data eksternal,PostgreSQL,database eksternal,Schema,SSL,pemetaan field,NocoBase"
---

# PostgreSQL

## Pendahuluan

PostgreSQL dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari PostgreSQL, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [database utama](../data-source-main/index.md), struktur tabel aktual PostgreSQL eksternal tetap dikelola oleh sistem bisnis asal, klien database, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | PostgreSQL >= 9.5. |
| Versi komersial | Didukung oleh Edisi Standar, Profesional, dan Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-postgres`. |

Skenario yang sesuai untuk menggunakan PostgreSQL eksternal:

- Menghubungkan database PostgreSQL milik sistem bisnis seperti ERP, MES, WMS, CRM, dan lainnya
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan workflow, perbaikan data, atau tampilan laporan pada tabel yang sudah ada
- Mempertahankan pengelolaan struktur database oleh DBA, skrip migrasi, atau sistem asal

:::warning Perhatian

PostgreSQL eksternal bukan database sistem NocoBase. NocoBase tidak mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini adalah plugin komersial. Untuk mengetahui cara aktivasinya secara terperinci, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih PostgreSQL, lalu isi informasi koneksi.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Konfigurasi koneksi umum adalah sebagai berikut:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identifikasi sumber data, digunakan untuk referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami oleh pengguna bisnis, seperti 「ERP PostgreSQL」 atau 「Database laporan」. |
| Host / Port | Alamat host dan port PostgreSQL. Port default biasanya adalah `5432`. |
| Database | Nama database PostgreSQL yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan PostgreSQL. NocoBase hanya dapat membaca objek yang boleh diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek privat milik akun lain. |
| Schema | Schema PostgreSQL yang akan dibaca, misalnya `public`. Jika database memiliki beberapa schema, sebaiknya hanya isi schema yang diperlukan oleh bisnis saat ini. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang cocok dengan awalan tersebut, lalu membuat nama tabel tanpa awalan di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat 「Add all collections」 diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dipilih di 「Collections」 yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Jika dinonaktifkan, konfigurasi sumber data tetap disimpan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |
| SSL options | Konfigurasi koneksi SSL PostgreSQL. Anda dapat mengatur mode SSL, apakah akan menolak sertifikat yang tidak sah, serta path sertifikat CA, sertifikat klien, dan kunci klien. |

:::tip Tips

Jika PostgreSQL memiliki banyak objek, persempit cakupan terlebih dahulu melalui `Schema`, `Table prefix`, dan 「Collections」. Hubungkan hanya tabel dan view yang digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi selanjutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, Anda dapat mengeklik 「Load Collections」 untuk membaca tabel data dan view yang tersedia di PostgreSQL. Hasil pembacaan dipengaruhi oleh akun koneksi, `Schema`, `Table prefix`, dan konfigurasi 「Collections」.

「Add all collections」 akan diaktifkan secara default, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu pilih tabel data atau view yang diperlukan dari daftar.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika PostgreSQL memiliki banyak objek, sebaiknya persempit cakupan terlebih dahulu melalui `Schema`, `Table prefix`, atau 「Collections」.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel PostgreSQL eksternal dikelola di sisi database. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field aktual di PostgreSQL eksternal.

Saat struktur tabel di PostgreSQL berubah, Anda dapat menjalankan 「Sync from database」 pada sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, primary key, unique key, dan pemetaan tipe field yang disimpan di NocoBase, tetapi tidak akan menghapus tabel atau data aktual di PostgreSQL.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key aktual ke tabel PostgreSQL.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field PostgreSQL ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilannya dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field PostgreSQL | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Perhatian

Tipe field PostgreSQL yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut perlu diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan identifikasi unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identifikasi unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak ada identifikasi unik yang tersedia, blok halaman mungkin tidak dapat melihat, mengedit, atau menghapus record dengan benar.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Tautan terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat pintu masuk sumber data dan cara mengelola sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat petunjuk mengenai tipe field dan pemetaan field