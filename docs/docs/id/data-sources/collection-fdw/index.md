---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Menghubungkan Koleksi Data Eksternal (FDW)

## Pendahuluan

Ini adalah plugin yang memungkinkan Anda menghubungkan koleksi data jarak jauh berdasarkan implementasi *foreign data wrapper* (FDW) pada basis data. Saat ini, plugin ini mendukung basis data MySQL dan PostgreSQL.

:::info{title="Menghubungkan Sumber Data vs Menghubungkan Koleksi Data Eksternal"}
- **Menghubungkan sumber data** berarti membangun koneksi dengan basis data atau layanan API tertentu, memungkinkan Anda menggunakan fitur basis data atau layanan API secara penuh;
- **Menghubungkan koleksi data eksternal** berarti mendapatkan data dari luar dan memetakannya untuk penggunaan lokal. Dalam basis data, ini disebut FDW (*Foreign Data Wrapper*), sebuah teknologi basis data yang berfokus pada penggunaan tabel jarak jauh seolah-olah tabel lokal, dan hanya dapat dihubungkan satu per satu. Karena aksesnya jarak jauh, akan ada berbagai batasan dan keterbatasan saat menggunakannya.

Keduanya juga dapat digunakan secara bersamaan. Yang pertama digunakan untuk membangun koneksi dengan sumber data, dan yang kedua digunakan untuk akses lintas sumber data. Contohnya, Anda dapat menghubungkan sumber data PostgreSQL tertentu, di mana salah satu tabel dalam sumber data tersebut adalah koleksi data eksternal yang dibuat berdasarkan FDW.
:::

### MySQL

MySQL menggunakan mesin `federated` yang perlu diaktifkan. Mesin ini mendukung koneksi ke MySQL jarak jauh dan basis data yang kompatibel dengan protokolnya, seperti MariaDB. Untuk detail lebih lanjut, lihat dokumentasi [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Di PostgreSQL, berbagai jenis ekstensi `fdw` dapat digunakan untuk mendukung tipe data jarak jauh yang berbeda. Ekstensi yang saat ini didukung meliputi:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Untuk menghubungkan ke basis data PostgreSQL jarak jauh dari PostgreSQL.
- [mysql_fdw (dalam pengembangan)](https://github.com/EnterpriseDB/mysql_fdw): Untuk menghubungkan ke basis data MySQL jarak jauh dari PostgreSQL.
- Untuk jenis ekstensi fdw lainnya, Anda dapat merujuk ke [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Untuk mengintegrasikannya dengan NocoBase, Anda perlu mengimplementasikan antarmuka adaptasi yang sesuai dalam kode.

## Instalasi

Prasyarat

- Jika basis data utama NocoBase Anda adalah MySQL, Anda perlu mengaktifkan `federated`. Lihat [Cara mengaktifkan mesin federated di MySQL](./enable-federated.md)

Kemudian, instal dan aktifkan plugin melalui manajer plugin.

![Instal dan aktifkan plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Panduan Penggunaan

Pada menu *dropdown* "Manajemen koleksi > Buat koleksi", pilih "Hubungkan data eksternal".

![Hubungkan Data Eksternal](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Pada opsi *dropdown* "Layanan Basis Data", pilih layanan basis data yang sudah ada, atau "Buat Layanan Basis Data".

![Layanan Basis Data](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Buat layanan basis data

![Buat Layanan Basis Data](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Setelah memilih layanan basis data, pada opsi *dropdown* "Tabel Jarak Jauh", pilih koleksi data yang ingin Anda hubungkan.

![Pilih koleksi data yang ingin dihubungkan](https://static-docs.nocobase.com/e91fd61552b52b4fc01b3808053cc8dc4.png)

Konfigurasi informasi bidang

![Konfigurasi informasi bidang](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jika koleksi jarak jauh memiliki perubahan struktur, Anda juga dapat "Sinkronkan dari koleksi jarak jauh".

![Sinkronkan dari Koleksi Jarak Jauh](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sinkronisasi koleksi jarak jauh

![Sinkronisasi Koleksi Jarak Jauh](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Terakhir, tampilkan di antarmuka.

![Tampilkan di antarmuka](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)