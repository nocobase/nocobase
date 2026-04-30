---
pkg: "@nocobase/plugin-data-source-main"
title: "Database Utama"
description: "Database utama NocoBase: menyimpan data bisnis dan metadata, mendukung MySQL/PostgreSQL/MariaDB, sinkronisasi tabel yang sudah ada dari database, membuat Collection Umum/Tree/SQL, dan lainnya."
keywords: "database utama,MySQL,PostgreSQL,MariaDB,sinkronisasi Collection,penyimpanan metadata,NocoBase"
---
# Database Utama

## Pengantar

Database utama NocoBase dapat digunakan untuk menyimpan data bisnis sekaligus menyimpan metadata aplikasi, termasuk data tabel sistem, data tabel custom, dan lainnya. Database utama mendukung database relasional seperti MySQL, PostgreSQL, dan lainnya. Saat menginstal aplikasi NocoBase, database utama harus diinstal secara bersamaan dan tidak dapat dihapus.

## Instalasi

Plugin bawaan, tidak perlu diinstal secara terpisah.

## Manajemen Collection

Data source utama menyediakan fungsi manajemen Collection yang lengkap. Anda dapat membuat tabel baru melalui NocoBase, dan juga menyinkronkan struktur tabel yang sudah ada di database.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Sinkronisasi Tabel yang Sudah Ada dari Database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Salah satu fitur penting dari data source utama adalah dapat menyinkronkan tabel yang sudah ada di database ke NocoBase untuk dikelola. Ini berarti:

- **Melindungi Investasi yang Ada**: Jika database Anda sudah memiliki banyak tabel bisnis, tidak perlu membuat ulang, dapat langsung disinkronkan dan digunakan
- **Integrasi Fleksibel**: Dapat menyertakan tabel yang dibuat melalui alat lain (seperti script SQL, alat manajemen database, dan lainnya) ke dalam manajemen NocoBase
- **Migrasi Bertahap**: Mendukung migrasi sistem yang sudah ada ke NocoBase secara bertahap, bukan refactor sekaligus

Melalui fungsi "Load dari Database", Anda dapat:
1. Browse semua tabel di database
2. Pilih tabel yang ingin disinkronkan
3. Otomatis mengenali struktur tabel dan tipe field
4. Impor sekali klik ke NocoBase untuk dikelola

### Mendukung Berbagai Tipe Struktur Tabel

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase mendukung pembuatan dan pengelolaan berbagai jenis Collection:
- **Collection Umum**: Memiliki field sistem umum yang sudah terpasang;
- **Collection Inheritance**: Anda dapat membuat Collection parent, lalu menurunkan Collection child dari parent tersebut. Collection child akan mewarisi struktur Collection parent, dan juga dapat mendefinisikan kolomnya sendiri.
- **Collection Tree**: Tabel struktur tree, saat ini hanya mendukung desain adjacency list;
- **Collection Calendar**: Digunakan untuk membuat tabel event terkait kalender;
- **Collection File**: Digunakan untuk manajemen penyimpanan file;
- **Collection Expression**: Digunakan untuk skenario expression dinamis pada workflow;
- **Collection SQL**: Bukan tabel database aktual, melainkan menampilkan kueri SQL secara cepat dan terstruktur;
- **Collection View**: Menghubungkan ke database view yang sudah ada;
- **Collection Eksternal**: Memungkinkan sistem database mengakses dan mengkueri data secara langsung dari data source eksternal, berbasis teknologi FDW;

### Mendukung Manajemen Kategori Collection

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Menyediakan Beragam Tipe Field

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Konversi Tipe Field yang Fleksibel

NocoBase mendukung konversi tipe field yang fleksibel pada tipe database yang sama.

**Contoh: Opsi Konversi Field Tipe String**

Ketika field di database adalah tipe String, dapat dikonversi di NocoBase ke salah satu bentuk berikut:

- **Tipe Dasar**: Teks Satu Baris, Teks Multi Baris, Nomor Telepon, Email, URL, Password, Warna, Ikon
- **Tipe Pilihan**: Dropdown (Pilihan Tunggal), Radio Button
- **Tipe Rich Media**: Markdown, Markdown (Vditor), Rich Text, Lampiran (URL)
- **Tipe Datetime**: Datetime (dengan Timezone), Datetime (tanpa Timezone)
- **Tipe Lanjutan**: Auto Sequence, Collection Selector, Enkripsi

Mekanisme konversi yang fleksibel ini berarti:
- **Tidak Perlu Mengubah Struktur Database**: Tipe penyimpanan field di lapisan bawah tetap tidak berubah, hanya bentuk representasi di NocoBase yang berubah
- **Beradaptasi dengan Perubahan Bisnis**: Seiring perubahan kebutuhan bisnis, dapat dengan cepat menyesuaikan cara tampilan dan interaksi field
- **Keamanan Data**: Proses konversi tidak akan memengaruhi integritas data yang sudah ada

### Sinkronisasi Field yang Fleksibel

NocoBase tidak hanya dapat menyinkronkan seluruh tabel, tetapi juga mendukung manajemen sinkronisasi field yang lebih halus:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Karakteristik Sinkronisasi Field:

1. **Sinkronisasi Real-time**: Ketika struktur tabel database berubah, field baru dapat disinkronkan kapan saja
2. **Sinkronisasi Selektif**: Dapat memilih field yang dibutuhkan untuk disinkronkan, bukan semua field
3. **Pengenalan Tipe Otomatis**: Otomatis mengenali tipe field database dan memetakannya ke tipe field NocoBase
4. **Mempertahankan Integritas Data**: Proses sinkronisasi tidak akan memengaruhi data yang sudah ada

#### Skenario Penggunaan:

- **Evolusi Struktur Database**: Ketika kebutuhan bisnis berubah dan perlu menambahkan field baru di database, dapat dengan cepat disinkronkan ke NocoBase
- **Kolaborasi Tim**: Ketika anggota tim lain atau DBA menambahkan field di database, dapat disinkronkan tepat waktu
- **Mode Manajemen Hybrid**: Sebagian field dikelola melalui NocoBase, sebagian field dikelola dengan cara tradisional, kombinasi yang fleksibel

Mekanisme sinkronisasi yang fleksibel ini memungkinkan NocoBase berintegrasi dengan baik ke dalam arsitektur teknologi yang ada, tidak perlu mengubah cara manajemen database yang lama, dan tetap dapat menikmati kemudahan pengembangan low-code yang dibawa NocoBase.

Untuk lebih lanjut, lihat bagian "[Field Collection / Ikhtisar](/data-sources/data-modeling/collection-fields)"
