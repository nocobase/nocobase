---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Sumber data eksternal - Doris"
description: "Pelajari cara menghubungkan Doris sebagai database eksternal ke NocoBase, termasuk port yang kompatibel dengan MySQL, FE query_port, cakupan tabel, skenario analisis hanya-baca, dan pemetaan field."
keywords: "sumber data eksternal,Doris,database eksternal,port yang kompatibel dengan MySQL,FE query_port,laporan,pemetaan field,NocoBase"
---

# Doris

## Pengenalan

Doris dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view di Doris, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Doris lebih cocok untuk kueri analitik, detail tabel lebar, statistik metrik, dan tampilan laporan. Berbeda dari database transaksional, Doris tidak cocok digunakan sebagai sumber data untuk menambah, mengedit, dan menghapus catatan bisnis secara sering di NocoBase.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | Doris >= 2.1.0. |
| Versi komersial | Didukung dalam edisi Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-doris`. |
| Metode koneksi | Menggunakan port Doris yang kompatibel dengan MySQL, yaitu FE query_port. |
| Rekomendasi penggunaan | Terutama untuk melihat, memfilter, membuat statistik, dan menampilkan laporan. |

Skenario yang cocok untuk menggunakan Doris eksternal:

- Menghubungkan tabel detail, tabel agregat, tabel lebar, atau tabel metrik dari data warehouse
- Membangun dasbor operasional, laporan statistik, atau halaman kueri di NocoBase
- Menyediakan akses kueri hanya-baca bagi pengguna bisnis dan mengurangi kebutuhan untuk mengakses klien database secara langsung
- Menerapkan kontrol akses dan tampilan visual untuk data Doris yang sudah ada

:::warning Perhatian

Doris disarankan digunakan sebagai sumber data analitik hanya-baca di NocoBase. Jangan menggunakannya sebagai sumber data penulisan untuk tabel bisnis biasa, dan juga tidak disarankan mengonfigurasi operasi penambahan, pengeditan, atau penghapusan di halaman.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui cara aktivasinya secara terperinci, lihat [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih Doris, lalu isi informasi koneksi.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Konfigurasi koneksi yang umum adalah sebagai berikut:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identifikasi sumber data yang digunakan sebagai referensi dalam blok halaman, izin, alur kerja, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami pengguna bisnis, seperti 「Doris data warehouse」 atau 「Pustaka metrik」. |
| Host / Port | Alamat Doris FE dan port yang kompatibel dengan MySQL, yaitu `query_port`. Jangan isi port HTTP. |
| Database | Nama database Doris yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan ke Doris. NocoBase hanya dapat membaca objek yang dapat diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Table prefix | Prefiks nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data yang sesuai dengan prefiks tersebut dan membuat nama tabel tanpa prefiks di NocoBase. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, alur kerja, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Plugin Doris terhubung melalui protokol yang kompatibel dengan MySQL. Sebelum melakukan konfigurasi, pastikan `query_port` Doris FE dapat diakses dari NocoBase dan akun tersebut memiliki izin untuk membaca metadata database, tabel, dan kolom target.

:::

## Cakupan koneksi

Halaman Doris tidak menyediakan tabel pilihan 「Collections」. Cakupan koneksi terutama dikendalikan oleh `Database`, izin akun koneksi, dan `Table prefix`.

Jika terdapat banyak tabel di Doris, sebaiknya siapkan database, akun, atau prefiks nama tabel khusus untuk NocoBase agar hanya tabel yang perlu dilihat dan dianalisis oleh aplikasi saat ini yang terekspos.

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view sekaligus. Jika terdapat banyak objek di Doris, sebaiknya persempit cakupan terlebih dahulu melalui database, izin akun, atau `Table prefix`.

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel Doris dikelola di sisi database. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field sebenarnya di Doris eksternal.

Saat struktur tabel di sisi Doris berubah, Anda dapat menjalankan 「Sync from database」 di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui informasi tabel data, field, kunci utama, kunci unik, dan pemetaan tipe field yang tersimpan di NocoBase, tetapi tidak akan menghapus tabel atau data sebenarnya di Doris.

Setelah field disinkronkan, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan otomatis menambahkan field foreign key sebenarnya ke tabel Doris.

## Pemetaan tipe field

NocoBase memetakan tipe field Doris berdasarkan logika yang kompatibel dengan MySQL dan tipe khusus Doris ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field Doris | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` adalah tipe dinamis yang tersedia sejak Apache Doris 2.1.0. Saat menggunakan Doris versi di bawah 2.1.0, field jenis ini tidak dapat dihubungkan.

:::warning Perhatian

Tipe status agregasi, tipe semi-terstruktur, dan tipe kompleks di Doris lebih cocok untuk ditampilkan atau digunakan untuk debugging, dan belum tentu cocok sebagai field input formulir. Jika menemukan tipe kompleks, sebaiknya siapkan view atau tabel detail yang lebih sesuai untuk dilihat oleh pengguna bisnis di sisi Doris, lalu hubungkan ke NocoBase.

:::

## Kunci utama dan pengenal unik catatan

Model data dan model kunci Doris tidak selalu sama dengan pengenal unik bisnis. Untuk tabel data yang digunakan dalam tampilan blok halaman, tetap disarankan menyiapkan field yang dapat mengidentifikasi catatan secara unik.

Jika yang dihubungkan adalah tabel atau view tanpa field unik, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak ada pengenal unik yang tersedia, blok halaman mungkin tidak dapat menampilkan detail catatan dengan benar dan juga tidak cocok untuk dikonfigurasi dengan operasi pengeditan atau penghapusan.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Tautan terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat akses dan metode pengelolaan sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat petunjuk tentang tipe field dan pemetaan field