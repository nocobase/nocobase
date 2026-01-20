:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Perbandingan Database Utama dan Database Eksternal

Perbedaan antara database utama dan database eksternal di NocoBase terutama terlihat pada empat aspek berikut: dukungan jenis database, dukungan jenis koleksi, dukungan jenis bidang, serta kemampuan pencadangan dan migrasi.

## 1. Dukungan Jenis Database

Untuk detail lebih lanjut, lihat: [Manajer Sumber Data](https://docs.nocobase.com/data-sources/data-source-manager)

### Jenis Database

| Jenis Database | Dukungan Database Utama | Dukungan Database Eksternal |
|----------------|-------------------------|-----------------------------|
| PostgreSQL     | ✅                      | ✅                          |
| MySQL          | ✅                      | ✅                          |
| MariaDB        | ✅                      | ✅                          |
| KingbaseES     | ✅                      | ✅                          |
| MSSQL          | ❌                      | ✅                          |
| Oracle         | ❌                      | ✅                          |

### Manajemen Koleksi

| Manajemen Koleksi | Dukungan Database Utama | Dukungan Database Eksternal |
|-------------------|-------------------------|-----------------------------|
| Manajemen Dasar   | ✅                      | ✅                          |
| Manajemen Visual  | ✅                      | ❌                          |

## 2. Dukungan Jenis Koleksi

Untuk detail lebih lanjut, lihat: [Koleksi](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Jenis Koleksi             | Database Utama | Database Eksternal | Deskripsi                                             |
|---------------------------|----------------|--------------------|-------------------------------------------------------|
| Koleksi Umum              | ✅             | ✅                 | Koleksi dasar                                         |
| Koleksi Tampilan          | ✅             | ✅                 | Tampilan sumber data                                  |
| Koleksi Warisan           | ✅             | ❌                 | Mendukung pewarisan model data, hanya didukung oleh sumber data utama |
| Koleksi Berkas            | ✅             | ❌                 | Mendukung unggahan berkas, hanya didukung oleh sumber data utama |
| Koleksi Komentar          | ✅             | ❌                 | Sistem komentar bawaan, hanya didukung oleh sumber data utama |
| Koleksi Kalender          | ✅             | ❌                 | Koleksi untuk tampilan kalender                       |
| Koleksi Ekspresi          | ✅             | ❌                 | Mendukung perhitungan formula                         |
| Koleksi Pohon             | ✅             | ❌                 | Untuk pemodelan data struktur pohon                   |
| Koleksi SQL               | ✅             | ❌                 | Koleksi yang didefinisikan melalui SQL                |
| Koneksi Koleksi Eksternal | ✅             | ❌                 | Koleksi koneksi untuk sumber data eksternal, fungsionalitas terbatas |

## 3. Dukungan Jenis Bidang

Untuk detail lebih lanjut, lihat: [Bidang Koleksi](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Jenis Dasar

| Jenis Bidang        | Database Utama | Database Eksternal |
|---------------------|----------------|--------------------|
| Teks Satu Baris     | ✅             | ✅                 |
| Teks Panjang        | ✅             | ✅                 |
| Nomor Telepon       | ✅             | ✅                 |
| Email               | ✅             | ✅                 |
| URL                 | ✅             | ✅                 |
| Bilangan Bulat      | ✅             | ✅                 |
| Angka               | ✅             | ✅                 |
| Persentase          | ✅             | ✅                 |
| Kata Sandi          | ✅             | ✅                 |
| Warna               | ✅             | ✅                 |
| Ikon                | ✅             | ✅                 |

### Jenis Pilihan

| Jenis Bidang              | Database Utama | Database Eksternal |
|---------------------------|----------------|--------------------|
| Kotak Centang             | ✅             | ✅                 |
| Pilihan Tunggal (Dropdown)| ✅             | ✅                 |
| Pilihan Ganda (Dropdown)  | ✅             | ✅                 |
| Grup Radio                | ✅             | ✅                 |
| Grup Kotak Centang        | ✅             | ✅                 |
| Wilayah Tiongkok          | ✅             | ❌                 |

### Jenis Media

| Jenis Bidang          | Database Utama | Database Eksternal |
|-----------------------|----------------|--------------------|
| Media                 | ✅             | ✅                 |
| Markdown              | ✅             | ✅                 |
| Markdown (Vditor)     | ✅             | ✅                 |
| Teks Kaya             | ✅             | ✅                 |
| Lampiran (Asosiasi)   | ✅             | ❌                 |
| Lampiran (URL)        | ✅             | ✅                 |

### Jenis Tanggal & Waktu

| Jenis Bidang                      | Database Utama | Database Eksternal |
|-----------------------------------|----------------|--------------------|
| Tanggal & Waktu (dengan zona waktu)| ✅             | ✅                 |
| Tanggal & Waktu (tanpa zona waktu)| ✅             | ✅                 |
| Timestamp Unix                    | ✅             | ✅                 |
| Tanggal (tanpa waktu)             | ✅             | ✅                 |
| Waktu                             | ✅             | ✅                 |

### Jenis Geometris

| Jenis Bidang | Database Utama | Database Eksternal |
|--------------|----------------|--------------------|
| Titik        | ✅             | ✅                 |
| Garis        | ✅             | ✅                 |
| Lingkaran    | ✅             | ✅                 |
| Poligon      | ✅             | ✅                 |

### Jenis Lanjutan

| Jenis Bidang        | Database Utama | Database Eksternal |
|---------------------|----------------|--------------------|
| UUID                | ✅             | ✅                 |
| Nano ID             | ✅             | ✅                 |
| Urutan              | ✅             | ✅                 |
| Formula             | ✅             | ✅                 |
| Urutan Otomatis     | ✅             | ✅                 |
| JSON                | ✅             | ✅                 |
| Pemilih Koleksi     | ✅             | ❌                 |
| Enkripsi            | ✅             | ✅                 |

### Bidang Informasi Sistem

| Jenis Bidang                | Database Utama | Database Eksternal |
|-----------------------------|----------------|--------------------|
| Tanggal Dibuat              | ✅             | ✅                 |
| Tanggal Terakhir Diperbarui | ✅             | ✅                 |
| Dibuat Oleh                 | ✅             | ❌                 |
| Terakhir Diperbarui Oleh    | ✅             | ❌                 |
| OID Tabel                   | ✅             | ❌                 |

### Jenis Asosiasi

| Jenis Bidang          | Database Utama | Database Eksternal |
|-----------------------|----------------|--------------------|
| Satu-ke-satu          | ✅             | ✅                 |
| Satu-ke-banyak        | ✅             | ✅                 |
| Banyak-ke-satu        | ✅             | ✅                 |
| Banyak-ke-banyak      | ✅             | ✅                 |
| Banyak-ke-banyak (array)| ✅             | ✅                 |

:::info
Bidang lampiran bergantung pada koleksi berkas, yang hanya didukung oleh database utama. Oleh karena itu, database eksternal saat ini tidak mendukung bidang lampiran.
:::

## 4. Perbandingan Dukungan Pencadangan dan Migrasi

| Fitur                 | Database Utama | Database Eksternal |
|-----------------------|----------------|--------------------|
| Pencadangan & Pemulihan | ✅             | ❌ (Perlu ditangani sendiri) |
| Manajemen Migrasi     | ✅             | ❌ (Perlu ditangani sendiri) |

:::info
NocoBase menyediakan kemampuan pencadangan, pemulihan, dan migrasi struktur untuk database utama. Untuk database eksternal, operasi ini perlu diselesaikan secara mandiri oleh pengguna sesuai dengan lingkungan database mereka sendiri. NocoBase tidak menyediakan dukungan bawaan.
:::

## Ringkasan Perbandingan

| Item Perbandingan         | Database Utama                               | Database Eksternal                                   |
|---------------------------|----------------------------------------------|------------------------------------------------------|
| Jenis Database            | PostgreSQL, MySQL, MariaDB, KingbaseES       | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Dukungan Jenis Koleksi    | Semua jenis koleksi                          | Hanya koleksi umum dan tampilan                      |
| Dukungan Jenis Bidang     | Semua jenis bidang                           | Semua jenis bidang kecuali bidang lampiran           |
| Pencadangan & Migrasi     | Dukungan bawaan                              | Perlu ditangani sendiri                              |

## Rekomendasi

- **Jika Anda menggunakan NocoBase untuk membangun sistem bisnis baru**, silakan gunakan **database utama**. Ini akan memungkinkan Anda memanfaatkan fungsionalitas NocoBase secara penuh.
- **Jika Anda menggunakan NocoBase untuk terhubung ke database sistem lain guna melakukan operasi CRUD dasar**, maka gunakan **database eksternal**.