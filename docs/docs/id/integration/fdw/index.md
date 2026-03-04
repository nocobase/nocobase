:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/integration/fdw/index).
:::

# Menghubungkan Tabel Data Eksternal (FDW)

## Pengantar

Fitur ini menghubungkan ke tabel data jarak jauh (remote) berdasarkan Foreign Data Wrapper dari database. Saat ini, fitur ini mendukung database MySQL dan PostgreSQL.

:::info{title="Menghubungkan Sumber Data vs Menghubungkan Tabel Data Eksternal"}
- **Menghubungkan sumber data** mengacu pada pembuatan koneksi dengan database atau layanan API tertentu, di mana Anda dapat menggunakan fitur database atau layanan yang disediakan oleh API secara penuh;
- **Menghubungkan tabel data eksternal** mengacu pada pengambilan data dari luar dan memetakannya untuk penggunaan lokal. Dalam database, ini disebut FDW (Foreign Data Wrapper), sebuah teknologi database yang berfokus pada penggunaan tabel jarak jauh seolah-olah sebagai tabel lokal dan hanya dapat menghubungkan satu tabel dalam satu waktu. Karena merupakan akses jarak jauh, akan ada berbagai batasan dan kendala saat menggunakannya.

Keduanya juga dapat digunakan secara kombinasi. Yang pertama digunakan untuk membangun koneksi dengan sumber data, dan yang terakhir digunakan untuk akses lintas sumber data. Misalnya, jika sumber data PostgreSQL tertentu terhubung, dan tabel tertentu dalam sumber data ini adalah tabel data eksternal yang dibuat berdasarkan FDW.
:::

### MySQL

MySQL menggunakan mesin `federated`, yang perlu diaktifkan, dan mendukung koneksi ke MySQL jarak jauh serta database yang kompatibel dengan protokolnya, seperti MariaDB. Untuk detail lebih lanjut, silakan merujuk ke dokumentasi [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Di PostgreSQL, berbagai jenis ekstensi `fdw` dapat digunakan untuk mendukung jenis data jarak jauh yang berbeda. Ekstensi yang didukung saat ini meliputi:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Menghubungkan ke database PostgreSQL jarak jauh di PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Menghubungkan ke database MySQL jarak jauh di PostgreSQL.
- Untuk jenis ekstensi fdw lainnya, silakan merujuk ke [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Anda perlu mengimplementasikan antarmuka adaptasi yang sesuai dalam kode.

## Prasyarat

- Jika database utama NocoBase adalah MySQL, Anda perlu mengaktifkan `federated`. Lihat [Cara mengaktifkan mesin federated di MySQL](./enable-federated)

Kemudian instal dan aktifkan plugin melalui pengelola plugin.

![Instal dan aktifkan plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Panduan Pengguna

Di bawah "Pengelola koleksi > Buat koleksi", pilih "Hubungkan ke data eksternal"

![Hubungkan Data Eksternal](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Dalam dropdown "Server Database", pilih layanan database yang sudah ada, atau "Buat Server Database"

![Layanan Database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Buat server database

![Buat Layanan Database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Setelah memilih server database, pada dropdown "Tabel jarak jauh", pilih tabel data yang ingin Anda hubungkan.

![Pilih tabel data yang ingin Anda hubungkan](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurasi informasi bidang (field)

![Konfigurasi informasi bidang](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jika tabel jarak jauh mengalami perubahan struktur, Anda juga dapat melakukan "Sinkronisasi dari tabel jarak jauh"

![Sinkronisasi dari Tabel Jarak Jauh](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sinkronisasi tabel jarak jauh

![Sinkronisasi tabel jarak jauh](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Terakhir, tampilkan pada antarmuka

![Tampilkan pada antarmuka](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)