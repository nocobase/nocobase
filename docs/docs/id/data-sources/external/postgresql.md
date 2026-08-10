---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Sumber data eksternal - PostgreSQL"
description: "Pelajari cara menghubungkan PostgreSQL sebagai basis data eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, konfigurasi koneksi, Schema, SSL, izin, dan pemetaan field."
keywords: "Sumber data eksternal,PostgreSQL,Basis data eksternal,Schema,SSL,Pemetaan field,NocoBase"
---

# PostgreSQL

## Pengenalan

PostgreSQL dapat dihubungkan ke NocoBase sebagai basis data eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari PostgreSQL, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [basis data utama](../main/index.md), struktur tabel sebenarnya pada PostgreSQL eksternal tetap dikelola oleh sistem bisnis asli, klien basis data, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | PostgreSQL >= 9.5. |
| Versi komersial | Didukung oleh Edisi Standar, Profesional, dan Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-postgres`. |

Skenario yang cocok untuk menggunakan PostgreSQL eksternal:

- Menghubungkan basis data PostgreSQL dari sistem bisnis seperti ERP, MES, WMS, CRM, dan lainnya
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan workflow, perbaikan data, atau tampilan laporan pada tabel yang sudah ada
- Mempertahankan pengelolaan struktur basis data oleh DBA, skrip migrasi, atau sistem asli

:::warning Catatan

PostgreSQL eksternal bukan basis data sistem NocoBase. NocoBase tidak mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk metode aktivasi secara mendetail, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih PostgreSQL, lalu isi informasi koneksi.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Konfigurasi koneksi umum adalah sebagai berikut:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identitas sumber data, yang digunakan untuk referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Disarankan menggunakan nama yang mudah dipahami oleh pengguna bisnis, misalnya 「ERP PostgreSQL」 atau 「Basis data laporan」. |
| Host / Port | Alamat host dan port PostgreSQL. Port default biasanya adalah `5432`. |
| Database | Nama basis data PostgreSQL yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan PostgreSQL. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Schema | Schema PostgreSQL yang akan dibaca, misalnya `public`. Jika basis data memiliki beberapa schema, disarankan hanya mengisi schema yang diperlukan oleh bisnis saat ini. |
| Table prefix | Prefiks nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang sesuai dengan prefiks tersebut, lalu membuat nama tabel tanpa prefiks di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat 「Add all collections」 diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan saat ini; jika dinonaktifkan, hanya objek yang dicentang di 「Collections」 yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |
| SSL options | Konfigurasi koneksi SSL PostgreSQL. Anda dapat mengatur mode SSL, apakah sertifikat yang tidak diotorisasi ditolak, serta jalur sertifikat CA, sertifikat klien, dan kunci klien. |

:::tip Tips

Jika terdapat banyak objek di PostgreSQL, persempit cakupan terlebih dahulu melalui `Schema`, `Table prefix`, dan 「Collections」. Hubungkan hanya tabel dan view yang digunakan oleh aplikasi saat ini agar konfigurasi izin, pembuatan halaman, dan pemeliharaan sinkronisasi selanjutnya menjadi lebih ringan.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, Anda dapat mengeklik 「Load Collections」 untuk membaca tabel data dan view yang tersedia di PostgreSQL. Hasil pembacaan dipengaruhi oleh akun koneksi, `Schema`, `Table prefix`, dan konfigurasi 「Collections」.

Secara default, 「Add all collections」 akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan 「Add all collections」, lalu centang tabel data atau view yang diperlukan dalam daftar.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Catatan

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika terdapat banyak objek di PostgreSQL, disarankan untuk mempersempit cakupan terlebih dahulu melalui `Schema`, `Table prefix`, atau 「Collections」.

:::

## Sinkronisasi dan mengonfigurasi field

Struktur tabel PostgreSQL eksternal dikelola di sisi basis data. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di PostgreSQL eksternal.

Saat struktur tabel di sisi PostgreSQL berubah, Anda dapat menjalankan 「Sync from database」 di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, primary key, unique key, dan pemetaan tipe field yang disimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di PostgreSQL.

Setelah sinkronisasi field, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key sebenarnya ke tabel PostgreSQL.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field PostgreSQL ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field PostgreSQL | NocoBase Field type | Field interface yang tersedia |
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

:::warning Catatan

Tipe field PostgreSQL yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut harus diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

## Primary key dan identitas unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, disarankan memiliki primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identitas unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak ada identitas unik yang tersedia, blok halaman mungkin tidak dapat menampilkan, mengedit, atau menghapus record dengan benar.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Tautan terkait

- [Basis data eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan basis data eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat akses dan metode pengelolaan sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat petunjuk tentang tipe field dan pemetaan field