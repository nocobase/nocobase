---
title: "Database Utama"
description: "Database utama NocoBase: menyimpan data tabel sistem dan data bisnis, mendukung MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, menyinkronkan tabel dari database, serta membuat tabel biasa/tabel hierarki/tabel SQL, dan lainnya"
keywords: "database utama,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,sinkronisasi tabel data"
---
# Database Utama

## Pendahuluan

Database yang dikonfigurasi melalui [Deploy NocoBase](/ai/install-nocobase-app) digunakan untuk menyimpan data tabel sistem NocoBase, serta mendukung penyimpanan tabel data bisnis pengguna.

Versi database dan edisi komersial yang didukung oleh database utama adalah sebagai berikut:

| Database | Versi yang didukung | Edisi Komunitas | Edisi Standar | Edisi Profesional | Edisi Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Catatan

KingbaseES hanya mendukung mode kompatibilitas PostgreSQL, sedangkan OceanBase hanya mendukung mode kompatibilitas MySQL.

:::

## Pemasangan plugin

| Database | Plugin terkait | Metode pemasangan |
| --- | --- | --- |
| MySQL | Tidak ada | Plugin bawaan, tidak perlu dipasang secara terpisah. |
| PostgreSQL | Tidak ada | Plugin bawaan, tidak perlu dipasang secara terpisah. |
| MariaDB | Tidak ada | Plugin bawaan, tidak perlu dipasang secara terpisah. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Memerlukan lisensi komersial; plugin diaktifkan secara default setelah pemasangan. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Memerlukan lisensi komersial; plugin diaktifkan secara default setelah pemasangan. |

## Mengakses sumber data utama

1. Klik menu sumber data pada fungsi sistem untuk mengakses halaman beranda sumber data.
2. Pilih sumber data **Main** dari daftar sumber data, lalu klik operasi **Konfigurasi** untuk mengakses database utama dan mengelolanya.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Pengelolaan sumber data utama

Database utama menyediakan fungsi pengelolaan tabel data. Anda dapat mencari, membuat, mengubah, dan menghapus tabel data, serta menyinkronkan kolom tabel data yang sudah ada di database; fungsi ini juga menyediakan pembuatan, perubahan, dan penghapusan kolom tabel data.
- **Filter**: mencari tabel data yang dikelola oleh database utama NocoBase
- **Buat tabel data**: menambahkan tabel data bisnis baru
- **Edit**: mengubah tabel data bisnis
- **Hapus**: menghapus tabel data bisnis
- **Sinkronkan dari database**: menyinkronkan struktur tabel data yang sudah ada di database
- **Konfigurasi kolom**: membuat, mengubah, dan menghapus kolom tabel data
-  **+** : **+** pada tab digunakan untuk mengelola kategori tabel data, termasuk membuat, mengubah, dan menghapus kategori
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Menyinkronkan tabel yang sudah ada dari database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Salah satu fitur penting sumber data utama adalah kemampuannya untuk menyinkronkan tabel yang sudah ada di database ke NocoBase agar dapat dikelola. Artinya:

- **Melindungi investasi yang ada**: jika database Anda sudah memiliki banyak tabel bisnis, Anda tidak perlu membuatnya ulang dan dapat langsung menyinkronkannya
- **Integrasi fleksibel**: tabel yang dibuat melalui alat lain, seperti skrip SQL atau alat pengelolaan database, dapat dikelola di NocoBase
- **Migrasi bertahap**: mendukung migrasi sistem yang ada ke NocoBase secara bertahap, bukan melakukan rekonstruksi sekaligus

Melalui fitur "Muat dari database", Anda dapat:
1. menelusuri semua tabel di database
2. memilih tabel yang perlu disinkronkan
3. mengenali struktur tabel dan tipe kolom secara otomatis
4. mengimpor tabel ke NocoBase untuk dikelola hanya dengan satu klik

### Mendukung berbagai jenis struktur tabel

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase mendukung pembuatan dan pengelolaan berbagai jenis tabel data:
- **Tabel biasa**: memiliki kolom sistem umum bawaan;
- **Tabel turunan**: Anda dapat membuat tabel induk, lalu membuat tabel anak yang diturunkan dari tabel tersebut. Tabel anak akan mewarisi struktur tabel induk dan juga dapat memiliki kolomnya sendiri.
- **Tabel hierarki**: tabel dengan struktur hierarki, saat ini hanya mendukung desain tabel adjacency;
- **Tabel kalender**: digunakan untuk membuat tabel acara terkait kalender;
- **Tabel file**: digunakan untuk mengelola penyimpanan file;
- **Tabel SQL**: bukan tabel database sebenarnya, melainkan menampilkan hasil kueri SQL secara terstruktur dengan cepat;
- **Tabel view**: menghubungkan view database yang sudah ada;

### Pengelolaan kategori tabel data

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Menyediakan berbagai jenis kolom

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Konversi tipe kolom yang fleksibel

NocoBase mendukung konversi tipe kolom secara fleksibel dalam jenis database yang sama.

**Contoh: Opsi konversi kolom tipe String**

Jika kolom dalam database bertipe String, kolom tersebut dapat dikonversi di NocoBase menjadi salah satu bentuk berikut:

- **Tipe dasar**: teks satu baris, teks multi-baris, nomor ponsel, email, URL, kata sandi, warna, ikon
- **Tipe pilihan**: menu tarik-turun (pilihan tunggal), tombol radio
- **Tipe media kaya**: Markdown, Markdown (Vditor), teks kaya, lampiran (URL)
- **Tipe tanggal dan waktu**: tanggal dan waktu (dengan zona waktu), tanggal dan waktu (tanpa zona waktu)
- **Tipe lanjutan**: penomoran otomatis, pemilih tabel data, enkripsi

Mekanisme konversi yang fleksibel ini berarti:
- **Tidak perlu mengubah struktur database**: tipe penyimpanan dasar kolom tetap tidak berubah; hanya bentuk tampilannya di NocoBase yang berubah
- **Menyesuaikan dengan perubahan bisnis**: seiring perubahan kebutuhan bisnis, cara menampilkan dan berinteraksi dengan kolom dapat disesuaikan dengan cepat
- **Keamanan data**: proses konversi tidak memengaruhi integritas data yang sudah ada

### Sinkronisasi fleksibel tingkat kolom

NocoBase tidak hanya dapat menyinkronkan seluruh tabel, tetapi juga mendukung pengelolaan sinkronisasi secara terperinci pada tingkat kolom:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Karakteristik sinkronisasi kolom:

1. **Sinkronisasi real-time**: ketika struktur tabel database berubah, Anda dapat menyinkronkan kolom baru kapan saja
2. **Sinkronisasi selektif**: Anda dapat memilih kolom yang perlu disinkronkan, bukan seluruh kolom
3. **Pengenalan tipe otomatis**: mengenali tipe kolom database secara otomatis dan memetakannya ke tipe kolom NocoBase
4. **Menjaga integritas data**: proses sinkronisasi tidak memengaruhi data yang sudah ada

#### Skenario penggunaan:

- **Evolusi struktur database**: ketika kebutuhan bisnis berubah dan kolom baru perlu ditambahkan ke database, kolom tersebut dapat disinkronkan dengan cepat ke NocoBase
- **Kolaborasi tim**: ketika anggota tim lain atau DBA menambahkan kolom ke database, kolom tersebut dapat segera disinkronkan
- **Model pengelolaan hibrida**: sebagian kolom dikelola melalui NocoBase dan sebagian lainnya melalui cara tradisional, sehingga dapat dikombinasikan secara fleksibel

Mekanisme sinkronisasi yang fleksibel ini memungkinkan NocoBase terintegrasi dengan baik ke dalam arsitektur teknologi yang ada tanpa perlu mengubah cara pengelolaan database sebelumnya, sekaligus menikmati kemudahan pengembangan low-code yang ditawarkan NocoBase.

Untuk informasi selengkapnya, lihat bab "[Kolom tabel data / Ikhtisar](../data-modeling/collection-fields/index.md)".
