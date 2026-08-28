---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Sumber data eksternal - ClickHouse"
description: "Pelajari cara menghubungkan ClickHouse sebagai database eksternal ke NocoBase, termasuk port yang kompatibel dengan MySQL, SSL, cakupan tabel, skenario analisis hanya-baca, dan pemetaan bidang."
keywords: "sumber data eksternal,ClickHouse,database eksternal,port yang kompatibel dengan MySQL,laporan,pemetaan bidang,NocoBase"
---

# ClickHouse

## Pengenalan

ClickHouse dapat dihubungkan ke NocoBase sebagai database eksternal. Setelah terhubung, NocoBase akan membaca tabel data, bidang, dan tampilan dari ClickHouse, lalu menggunakannya sebagai tabel data dalam sumber data eksternal.

ClickHouse lebih cocok untuk kueri analitis, analisis log, statistik metrik, dan penyajian laporan. Berbeda dari database transaksional, ClickHouse tidak cocok digunakan sebagai sumber data untuk sering menambah, mengedit, dan menghapus catatan bisnis di NocoBase.

| Item konfigurasi | Keterangan |
| --- | --- |
| Versi yang didukung | ClickHouse >= 20.2. |
| Versi komersial | Didukung oleh Edisi Enterprise. |
| Plugin terkait | `@nocobase/plugin-data-source-external-clickhouse`. |
| Metode koneksi | Menggunakan port yang kompatibel dengan MySQL milik ClickHouse. |
| Rekomendasi penggunaan | Terutama untuk melihat, memfilter, membuat statistik, dan menyajikan laporan. |

Skenario yang sesuai untuk menggunakan ClickHouse eksternal:

- Menghubungkan data analitis seperti log, pelacakan peristiwa, metrik, dan pengendalian risiko
- Membangun dasbor operasional, laporan statistik, atau halaman kueri di NocoBase
- Menyediakan akses kueri hanya-baca bagi pengguna bisnis untuk mengurangi akses langsung ke klien database
- Menerapkan kontrol izin dan visualisasi pada data ClickHouse yang sudah ada

:::warning Perhatian

ClickHouse disarankan digunakan sebagai sumber data analisis hanya-baca di NocoBase. Jangan menggunakannya sebagai sumber data untuk menulis tabel bisnis biasa, dan tidak disarankan mengonfigurasi operasi penambahan, pengeditan, atau penghapusan pada halaman.

:::

## Instalasi plugin

Plugin ini merupakan plugin komersial. Untuk metode aktivasi selengkapnya, lihat: [Panduan aktivasi plugin komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan sumber data

Di 「Manajemen sumber data」, klik 「Add new」, pilih ClickHouse, lalu isi informasi koneksi.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

Konfigurasi koneksi umum adalah sebagai berikut:

| Konfigurasi | Keterangan |
| --- | --- |
| Data source name | Nama identifikasi sumber data, yang digunakan untuk referensi dalam blok halaman, izin, alur kerja, dan API. Tidak dapat diubah setelah dibuat. |
| Data source display name | Nama sumber data yang ditampilkan di antarmuka. Disarankan menggunakan nama yang mudah dipahami oleh pengguna bisnis, misalnya 「Database log ClickHouse」 atau 「Database metrik」. |
| Host / Port | Alamat host ClickHouse dan port yang kompatibel dengan MySQL. Jangan isi port HTTP atau port TCP native. |
| Database | Nama database ClickHouse yang akan dihubungkan. |
| Username / Password | Nama pengguna dan kata sandi untuk menghubungkan ke ClickHouse. NocoBase hanya dapat membaca objek yang boleh diakses oleh akun ini, dan tidak akan memberikan izin atau membaca objek pribadi akun lain. |
| Table prefix | Awalan nama tabel. Setelah dikonfigurasi, NocoBase hanya membaca tabel data yang cocok dengan awalan ini dan membuat nama tabel tanpa awalan tersebut di NocoBase. |
| Use SSL | Apakah akan mengaktifkan SSL. Biasanya perlu diaktifkan saat menghubungkan ke ClickHouse Cloud atau lingkungan koneksi aman. |
| Enabled the data source | Apakah akan mengaktifkan sumber data ini. Setelah dinonaktifkan, konfigurasi sumber data tetap dipertahankan, tetapi blok halaman, izin, alur kerja, dan API tidak dapat lagi membaca datanya. |

:::tip Tips

Plugin ClickHouse terhubung melalui protokol yang kompatibel dengan MySQL. Sebelum melakukan konfigurasi, pastikan layanan ClickHouse telah mengaktifkan port yang kompatibel dengan MySQL, dan jaringan, firewall, serta izin akun mengizinkan NocoBase mengaksesnya.

:::

## Cakupan koneksi

Halaman ClickHouse tidak menyediakan tabel pilihan 「Collections」. Cakupan koneksi terutama dikendalikan oleh `Database`, izin akun koneksi, dan `Table prefix`.

Jika terdapat banyak tabel di ClickHouse, disarankan menyiapkan database, akun, atau awalan nama tabel khusus untuk NocoBase, dan hanya mengekspos tabel yang perlu dilihat dan dianalisis oleh aplikasi saat ini.

:::warning Perhatian

Satu sumber data eksternal dapat menghubungkan maksimal 500 tabel data atau tampilan sekaligus. Jika terdapat banyak objek di ClickHouse, disarankan mempersempit cakupan terlebih dahulu melalui database, izin akun, atau `Table prefix`.

:::

## Sinkronisasi dan konfigurasi bidang

Struktur tabel ClickHouse eksternal dikelola dari sisi database. NocoBase tidak akan membuat bidang, mengubah tipe bidang, atau menghapus bidang nyata di ClickHouse eksternal.

Saat struktur tabel di ClickHouse berubah, Anda dapat menjalankan 「Sync from database」 di sumber data untuk membaca ulang metadata tabel dan bidang. Sinkronisasi akan memperbarui informasi tabel data, bidang, kunci utama, kunci unik, dan pemetaan tipe bidang yang tersimpan di NocoBase, tetapi tidak akan menghapus tabel atau data nyata di ClickHouse.

Setelah bidang disinkronkan, Anda dapat mengonfigurasi judul bidang, tipe bidang (Field type), dan komponen bidang (Field interface) di NocoBase. Jika perlu membuat bidang relasi NocoBase, metadata relasi juga disimpan di NocoBase dan tidak akan secara otomatis menambahkan bidang foreign key nyata ke tabel ClickHouse.

## Pemetaan tipe bidang

NocoBase mengonversi tipe bidang ClickHouse ke gaya yang kompatibel dengan MySQL, lalu memetakannya ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampilan antarmuka dalam konfigurasi bidang.

Pemetaan umum adalah sebagai berikut:

| Tipe bidang ClickHouse | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Dipetakan berdasarkan tipe bidang internal | Bergantung pada tipe bidang internal. |
| `LowCardinality(...)` | Dipetakan berdasarkan tipe bidang internal | Bergantung pada tipe bidang internal. |

:::warning Perhatian

Sebagian tipe analitis atau tipe bertingkat di ClickHouse mungkin tidak dapat langsung dipetakan menjadi bidang bisnis biasa. Jika menemukan tipe bidang yang tidak didukung, Anda dapat terlebih dahulu membuat tampilan atau tabel kueri yang sesuai untuk ditampilkan di ClickHouse, lalu menghubungkannya ke NocoBase.

:::

## Kunci utama dan pengenal unik catatan

Kunci pengurutan dan kunci partisi ClickHouse tidak selalu sama dengan pengenal unik bisnis. Untuk tabel data yang digunakan dalam tampilan blok halaman, tetap disarankan menyiapkan bidang yang dapat mengidentifikasi catatan secara unik.

Jika yang dihubungkan adalah tabel atau tampilan tanpa bidang unik, Anda perlu mengatur 「Record unique key」 secara manual dalam konfigurasi tabel data. Jika tidak tersedia pengenal unik yang dapat digunakan, blok halaman mungkin tidak dapat menampilkan detail catatan dengan benar dan tidak cocok untuk mengonfigurasi operasi pengeditan atau penghapusan.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Tautan terkait

- [Database eksternal](./index.md) — Lihat konfigurasi umum dan petunjuk pengelolaan database eksternal
- [Manajemen sumber data](../data-source-manager/index.md) — Lihat pintu masuk sumber data dan metode pengelolaan sumber data
- [Bidang tabel data](../data-modeling/collection-fields/index.md) — Lihat penjelasan tentang tipe bidang dan pemetaan bidang