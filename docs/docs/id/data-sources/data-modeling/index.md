:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ikhtisar

Pemodelan data adalah langkah kunci dalam merancang basis data, melibatkan proses analisis mendalam dan abstraksi berbagai jenis data di dunia nyata beserta hubungan timbal baliknya. Dalam proses ini, kami berusaha mengungkap koneksi intrinsik antar data dan memformalkannya menjadi model data, meletakkan dasar bagi struktur basis data sistem informasi. NocoBase adalah platform yang digerakkan oleh model data, dengan fitur-fitur berikut:

## Mendukung Akses ke Data dari Berbagai Sumber

Sumber data NocoBase dapat berasal dari berbagai jenis, termasuk basis data umum, platform API (SDK), dan berkas.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase menyediakan [plugin manajemen sumber data](/data-sources/data-source-manager) untuk mengelola berbagai sumber data dan koleksinya. Plugin manajemen sumber data ini hanya menyediakan antarmuka pengelolaan untuk semua sumber data dan tidak menyediakan kemampuan untuk mengakses sumber data secara langsung. Plugin ini perlu digunakan bersama dengan berbagai plugin sumber data lainnya. Sumber data yang saat ini didukung meliputi:

- [Basis Data Utama](/data-sources/data-source-main): Basis data utama NocoBase, mendukung basis data relasional seperti MySQL, PostgreSQL, dan MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Menggunakan basis data KingbaseES sebagai sumber data, dapat digunakan sebagai basis data utama maupun basis data eksternal.
- [MySQL Eksternal](/data-sources/data-source-external-mysql): Menggunakan basis data MySQL eksternal sebagai sumber data.
- [MariaDB Eksternal](/data-sources/data-source-external-mariadb): Menggunakan basis data MariaDB eksternal sebagai sumber data.
- [PostgreSQL Eksternal](/data-sources/data-source-external-postgres): Menggunakan basis data PostgreSQL eksternal sebagai sumber data.
- [MSSQL Eksternal](/data-sources/data-source-external-mssql): Menggunakan basis data MSSQL (SQL Server) eksternal sebagai sumber data.
- [Oracle Eksternal](/data-sources/data-source-external-oracle): Menggunakan basis data Oracle eksternal sebagai sumber data.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Menyediakan Berbagai Alat Pemodelan Data

**Antarmuka pengelolaan koleksi yang sederhana**: Digunakan untuk membuat berbagai model (koleksi) atau menghubungkan ke model (koleksi) yang sudah ada.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Antarmuka visual bergaya ERD**: Digunakan untuk mengekstrak entitas dan hubungannya dari kebutuhan pengguna dan bisnis. Ini menyediakan cara yang intuitif dan mudah dipahami untuk menjelaskan model data, sehingga melalui diagram ERD, Anda dapat memahami entitas data utama dalam sistem dan hubungannya dengan lebih jelas.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Mendukung Berbagai Jenis Koleksi

| Koleksi | Deskripsi |
| - | - |
| [Koleksi Umum](/data-sources/data-source-main/general-collection) | Bidang sistem umum bawaan |
| [Koleksi Kalender](/data-sources/calendar/calendar-collection) | Digunakan untuk membuat koleksi acara terkait kalender |
| Koleksi Komentar | Digunakan untuk menyimpan komentar atau umpan balik pada data |
| [Koleksi Pohon](/data-sources/collection-tree) | Koleksi berstruktur pohon, saat ini hanya mendukung model daftar kedekatan (adjacency list) |
| [Koleksi Berkas](/data-sources/file-manager/file-collection) | Digunakan untuk pengelolaan penyimpanan berkas |
| [Koleksi SQL](/data-sources/collection-sql) | Bukan koleksi basis data aktual, melainkan memvisualisasikan kueri SQL secara terstruktur |
| [Hubungkan ke Tampilan Basis Data](/data-sources/collection-view) | Menghubungkan ke tampilan basis data yang sudah ada |
| Koleksi Ekspresi | Digunakan untuk skenario ekspresi dinamis dalam alur kerja |
| [Hubungkan ke Data Asing](/data-sources/collection-fdw) | Memungkinkan sistem basis data untuk mengakses dan mengueri data secara langsung di sumber data eksternal berdasarkan teknologi FDW |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Untuk informasi lebih lanjut, lihat bagian "[Koleksi / Ikhtisar](/data-sources/data-modeling/collection)".

## Menyediakan Berbagai Jenis Bidang

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Untuk informasi lebih lanjut, lihat bagian "[Bidang Koleksi / Ikhtisar](/data-sources/data-modeling/collection-fields)".