:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ikhtisar

Pemodelan data adalah langkah kunci dalam merancang basis data, melibatkan proses analisis mendalam dan abstraksi berbagai jenis data di dunia nyata beserta hubungan timbal baliknya. Dalam proses ini, kita berupaya mengungkap koneksi intrinsik antar data dan memformalkannya menjadi model data, meletakkan dasar bagi struktur basis data sistem informasi. NocoBase adalah platform berbasis model data, dengan fitur-fitur berikut:

## Mendukung Akses Data dari Berbagai Sumber

NocoBase mendukung sumber data dari berbagai asal, termasuk berbagai jenis basis data umum, platform API (SDK), dan berkas.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase menyediakan [plugin pengelola sumber data](/data-sources/data-source-manager) untuk mengelola berbagai sumber data dan koleksinya. Plugin pengelola sumber data ini hanya menyediakan antarmuka manajemen untuk semua sumber data dan tidak menyediakan kemampuan untuk mengakses sumber data secara langsung. Plugin ini perlu digunakan bersama dengan berbagai plugin sumber data lainnya. Sumber data yang saat ini didukung meliputi:

- [Basis Data Utama](/data-sources/data-source-main): Basis data utama NocoBase, mendukung basis data relasional seperti MySQL, PostgreSQL, dan MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Menggunakan basis data KingbaseES sebagai sumber data, yang dapat digunakan sebagai basis data utama maupun basis data eksternal.
- [MySQL Eksternal](/data-sources/data-source-external-mysql): Menggunakan basis data MySQL eksternal sebagai sumber data.
- [MariaDB Eksternal](/data-sources/data-source-external-mariadb): Menggunakan basis data MariaDB eksternal sebagai sumber data.
- [PostgreSQL Eksternal](/data-sources/data-source-external-postgres): Menggunakan basis data PostgreSQL eksternal sebagai sumber data.
- [MSSQL Eksternal](/data-sources/data-source-external-mssql): Menggunakan basis data MSSQL (SQL Server) eksternal sebagai sumber data.
- [Oracle Eksternal](/data-sources/data-source-external-oracle): Menggunakan basis data Oracle eksternal sebagai sumber data.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Menyediakan Berbagai Alat Pemodelan Data

**Antarmuka manajemen koleksi yang sederhana**: Digunakan untuk membuat berbagai model (koleksi) atau menghubungkan ke model yang sudah ada.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Antarmuka visual bergaya ER**: Digunakan untuk mengekstrak entitas dan hubungannya dari kebutuhan pengguna dan bisnis. Antarmuka ini menyediakan cara yang intuitif dan mudah dipahami untuk menjelaskan model data. Melalui diagram ER, Anda dapat lebih jelas memahami entitas data utama dalam sistem dan hubungannya.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Mendukung Berbagai Jenis Koleksi

| Koleksi | Deskripsi |
| - | - |
| [Koleksi Umum](/data-sources/data-source-main/general-collection) | Dilengkapi dengan bidang sistem umum yang sering digunakan |
| [Koleksi Kalender](/data-sources/calendar/calendar-collection) | Digunakan untuk membuat tabel kejadian terkait kalender |
| Koleksi Komentar | Digunakan untuk menyimpan komentar atau umpan balik terhadap data |
| [Koleksi Struktur Pohon](/data-sources/collection-tree) | Koleksi berstruktur pohon, saat ini hanya mendukung desain daftar adjacensi |
| [Koleksi Berkas](/data-sources/file-manager/file-collection) | Digunakan untuk manajemen penyimpanan berkas |
| [Koleksi SQL](/data-sources/collection-sql) | Bukan tabel basis data aktual, melainkan menampilkan kueri SQL secara terstruktur dengan cepat |
| [Hubungkan ke Tampilan Basis Data](/data-sources/collection-view) | Menghubungkan ke tampilan basis data yang sudah ada |
| Koleksi Ekspresi | Digunakan untuk skenario ekspresi dinamis dalam alur kerja |
| [Hubungkan ke Data Eksternal](/data-sources/collection-fdw) | Menghubungkan tabel data jarak jauh yang diimplementasikan dengan teknologi FDW basis data |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Untuk informasi lebih lanjut, lihat bagian "[Koleksi / Ikhtisar](/data-sources/data-modeling/collection)".

## Menyediakan Berbagai Jenis Bidang yang Kaya

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Untuk informasi lebih lanjut, lihat bagian "[Bidang Koleksi / Ikhtisar](/data-sources/data-modeling/collection-fields)".