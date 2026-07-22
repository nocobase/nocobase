---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Sumber data eksternal - Oracle"
description: "Pelajari cara menghubungkan Oracle sebagai database eksternal ke NocoBase, termasuk versi yang didukung, instalasi plugin, mode koneksi Thin/Thick, Client directory, izin, dan pemetaan field."
keywords: "Sumber data eksternal,Oracle,database eksternal,Thin,Thick,Client directory,pemetaan field,NocoBase"
---

# Oracle

## Pengenalan

Oracle dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, field, dan view dari Oracle, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

Berbeda dengan [database utama](../data-source-main/index.md), struktur tabel aktual Oracle eksternal tetap dikelola oleh sistem bisnis asal, klien database, atau skrip migrasi. NocoBase bertanggung jawab membaca struktur, menyimpan metadata field, serta mengonfigurasi blok halaman, izin, workflow, dan API.

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | Oracle >= 11g. |
| Versi komersial | Didukung oleh Edisi Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-oracle`. |
| Mode koneksi | Oracle Database 12.1 dan versi lebih baru biasanya menggunakan mode Thin; versi sebelum 12.1 menggunakan mode Thick. |

Skenario yang cocok untuk menggunakan Oracle eksternal:

- Menghubungkan database Oracle dari sistem bisnis seperti ERP, MES, WMS, CRM, dan lainnya
- Membangun antarmuka manajemen dengan NocoBase tanpa memigrasikan data historis
- Menerapkan kontrol izin, pemrosesan workflow, koreksi data, atau tampilan laporan pada tabel yang sudah ada
- Struktur database tetap dikelola oleh DBA, skrip migrasi, atau sistem asal

:::warning Perhatian

Oracle eksternal bukan database sistem NocoBase. NocoBase tidak akan mengambil alih pencadangan, pemulihan, migrasi, atau perubahan struktur tabelnya.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk mengetahui cara mengaktifkannya secara lengkap, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

Jika mode koneksi yang dipilih adalah Thick, Oracle Client libraries harus diinstal di lingkungan runtime NocoBase, dan «Client directory» harus diisi dalam konfigurasi sumber data.

## Instalasi klien Oracle

Oracle Database 12.1 dan versi lebih baru biasanya menggunakan mode Thin, sehingga tidak memerlukan instalasi Oracle Client tambahan. Oracle Client libraries hanya perlu diinstal di lingkungan runtime NocoBase jika Anda terhubung ke Oracle Database sebelum versi 12.1 atau harus menggunakan mode Thick.

Setelah memilih mode «Thick» dalam konfigurasi sumber data, pastikan mesin tempat layanan NocoBase berjalan dapat memuat Oracle Client.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Untuk lingkungan Linux, Anda dapat mengikuti cara berikut untuk menginstal Oracle Instant Client:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Jika Oracle Client tidak diinstal di lokasi yang dapat dimuat secara default oleh sistem, isi direktori library klien di «Client directory». Misalnya, dengan metode instalasi di atas, direktori yang sesuai adalah `/opt/instantclient_19_25`.

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Tips

`Client directory` hanya perlu dikonfigurasi dalam mode Thick. Mode Thin tidak menggunakan konfigurasi ini. Untuk aturan inisialisasi selengkapnya, lihat [dokumentasi inisialisasi node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Menambahkan sumber data

Di «Manajemen sumber data», klik «Add new», pilih Oracle, lalu isi informasi koneksi.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Konfigurasi koneksi umum adalah sebagai berikut:

| Konfigurasi | Deskripsi |
| --- | --- |
| Data source name | Nama identitas sumber data, yang digunakan sebagai referensi dalam blok halaman, izin, workflow, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Sebaiknya gunakan nama yang mudah dipahami oleh pengguna bisnis, seperti «ERP Oracle» atau «Database keuangan». |
| Host / Port | Alamat host dan port Oracle. Port default biasanya adalah `1521`. |
| ServerName | Nama layanan Oracle. Isi dengan service name yang dikonfigurasi dalam listener database. |
| Username / Password | Nama pengguna dan kata sandi untuk terhubung ke Oracle. NocoBase membaca tabel data dan view di bawah Owner akun ini, dan tidak memberikan akses atau membaca objek di bawah Owner lain. |
| Connection mode | Mode koneksi Oracle. Oracle Database 12.1 dan versi lebih baru biasanya menggunakan mode Thin; versi sebelum 12.1 menggunakan mode Thick. |
| Client directory | Direktori Oracle Client libraries untuk mode Oracle Thick. Hanya perlu dikonfigurasi jika memilih mode Thick. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data dan view yang cocok dengan awalan ini, lalu membuat nama tabel tanpa awalan tersebut di NocoBase. |
| Collections / Add all collections | Mengontrol cakupan koneksi. Saat «Add all collections» diaktifkan, NocoBase akan menghubungkan semua tabel dan view dalam cakupan Owner dan awalan saat ini; jika dinonaktifkan, hanya objek yang dicentang di «Collections» yang akan dihubungkan. |
| Enabled the data source | Menentukan apakah sumber data ini diaktifkan. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, workflow, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Cakupan objek Oracle terutama ditentukan oleh Owner akun koneksi, `Table prefix`, dan «Collections». Jika terdapat banyak objek dalam satu instance, sebaiknya gunakan akun khusus untuk terhubung ke schema yang diperlukan bisnis, sehingga objek yang tidak relevan tidak masuk ke NocoBase.

:::

## Memilih tabel data

Setelah mengisi informasi koneksi, Anda dapat mengeklik «Load Collections» untuk membaca tabel data dan view yang tersedia di Oracle. Hasil pembacaan dipengaruhi oleh Owner akun koneksi, `Table prefix`, dan konfigurasi «Collections».

Secara default, «Add all collections» akan diaktifkan, yang berarti semua tabel dan view dalam cakupan saat ini akan dihubungkan. Jika hanya ingin menghubungkan sebagian objek, nonaktifkan «Add all collections», lalu centang tabel data atau view yang diperlukan dalam daftar.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau view dalam satu waktu. Jika terdapat banyak objek di Oracle, sebaiknya persempit cakupan terlebih dahulu melalui Owner akun koneksi, `Table prefix`, atau «Collections».

:::

## Sinkronisasi dan konfigurasi field

Struktur tabel Oracle eksternal dikelola di sisi database. NocoBase tidak akan membuat field, mengubah tipe field, atau menghapus field aktual di Oracle eksternal.

Saat struktur tabel di sisi Oracle berubah, Anda dapat menjalankan «Sync from database» di sumber data untuk membaca ulang metadata tabel dan field. Sinkronisasi akan memperbarui tabel data, field, primary key, unique key, dan informasi pemetaan tipe field yang disimpan di NocoBase, tetapi tidak akan menghapus tabel atau data aktual di Oracle.

Setelah field disinkronkan, Anda dapat mengonfigurasi judul field, tipe field (Field type), dan komponen field (Field interface) di NocoBase. Jika perlu membuat field relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan field foreign key aktual ke tabel Oracle.

## Pemetaan tipe field

NocoBase akan secara otomatis memetakan tipe field Oracle ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilannya dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Tipe field Oracle | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Perhatian

Tipe objek biner seperti `BLOB` dan `BFILE` tidak akan otomatis digunakan sebagai field file biasa. Jika perlu mengelola lampiran di halaman, umumnya disarankan menggunakan tabel file atau field lampiran di NocoBase untuk menyimpan metadata file.

:::

## Primary key dan identitas unik record

Untuk tabel data yang digunakan untuk menampilkan dan mengedit blok halaman, sebaiknya tersedia primary key atau field unik. NocoBase akan memprioritaskan primary key sebagai identitas unik record.

Jika yang dihubungkan adalah view, tabel tanpa primary key, atau tabel dengan composite primary key, Anda perlu mengatur «Record unique key» secara manual dalam konfigurasi tabel data. Jika tidak ada identitas unik yang tersedia, blok halaman mungkin tidak dapat melihat, mengedit, atau menghapus record dengan benar.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Link terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat cara mengakses dan mengelola sumber data
- [Field tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe field dan pemetaan field
- [Dokumentasi inisialisasi node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Lihat cara memuat Oracle Client libraries