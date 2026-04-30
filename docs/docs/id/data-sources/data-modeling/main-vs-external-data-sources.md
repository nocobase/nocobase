---
title: "Perbandingan Database Utama dan Eksternal"
description: "Perbedaan antara database utama dan database eksternal: dukungan tipe database, tipe Collection, tipe field, perbandingan kemampuan backup restore migration."
keywords: "database utama,database eksternal,perbandingan data source,koneksi read-only,sinkronisasi Collection,NocoBase"
---

# Perbandingan Database Utama dan Eksternal

Perbedaan antara database utama dan database eksternal di NocoBase terutama terletak pada empat aspek berikut: dukungan tipe database, dukungan tipe Collection, dukungan tipe field, dan backup restore migration.

## I. Dukungan Tipe Database

Untuk detail lebih lanjut, lihat: [Manajemen Data Source](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipe Database

| Tipe Database | Dukungan Database Utama | Dukungan Database Eksternal |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Manajemen Collection

| Manajemen Collection | Dukungan Database Utama | Dukungan Database Eksternal |
|-----------|-------------|--------------|
| Manajemen Dasar | ✅ | ✅ |
| Manajemen Visual | ✅ | ❌ |

## II. Dukungan Tipe Collection

Untuk detail lebih lanjut, lihat: [Collection](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipe Collection | Database Utama | Database Eksternal | Deskripsi |
|-----------|---------|-----------|------|
| Collection Umum | ✅ | ✅ | Collection dasar |
| Collection View | ✅ | ✅ | Database view |
| Collection Inheritance | ✅ | ❌ | Mendukung pewarisan model data, hanya didukung oleh data source utama |
| Collection File | ✅ | ❌ | Mendukung upload file, hanya didukung oleh data source utama |
| Collection Comment | ✅ | ❌ | Sistem komentar bawaan, hanya didukung oleh data source utama |
| Collection Calendar | ✅ | ❌ | Collection untuk tampilan kalender |
| Collection Expression | ✅ | ❌ | Mendukung komputasi formula |
| Collection Tree | ✅ | ❌ | Untuk pemodelan data struktur tree |
| Collection SQL | ✅ | ❌ | Collection yang dapat didefinisikan via SQL |
| Collection Eksternal | ✅ | ❌ | Tabel koneksi data source eksternal, fungsi terbatas |

## III. Dukungan Tipe Field

Untuk detail lebih lanjut, lihat: [Field Collection](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipe Dasar

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Teks Satu Baris | ✅ | ✅ |
| Teks Multi Baris | ✅ | ✅ |
| Nomor Telepon | ✅ | ✅ |
| Email | ✅ | ✅ |
| URL | ✅ | ✅ |
| Integer | ✅ | ✅ |
| Number | ✅ | ✅ |
| Persen | ✅ | ✅ |
| Password | ✅ | ✅ |
| Warna | ✅ | ✅ |
| Ikon | ✅ | ✅ |

### Tipe Pilihan

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Centang | ✅ | ✅ |
| Dropdown (Pilihan Tunggal) | ✅ | ✅ |
| Dropdown (Multi Pilihan) | ✅ | ✅ |
| Radio Button | ✅ | ✅ |
| Checkbox Group | ✅ | ✅ |
| Wilayah Administratif Tiongkok | ✅ | ❌ |

### Tipe Multimedia

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Rich Text | ✅ | ✅ |
| Lampiran (Relasi) | ✅ | ❌ |
| Lampiran (URL) | ✅ | ✅ |

### Tipe Datetime

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Datetime (dengan Timezone) | ✅ | ✅ |
| Datetime (tanpa Timezone) | ✅ | ✅ |
| Unix Timestamp | ✅ | ✅ |
| Tanggal (tanpa Waktu) | ✅ | ✅ |
| Waktu | ✅ | ✅ |

### Tipe Bentuk Geometri

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Titik | ✅ | ✅ |
| Garis | ✅ | ✅ |
| Lingkaran | ✅ | ✅ |
| Polygon | ✅ | ✅ |

### Tipe Lanjutan

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sort | ✅ | ✅ |
| Formula | ✅ | ✅ |
| Auto Sequence | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Collection Selector | ✅ | ❌ |
| Enkripsi | ✅ | ✅ |

### Field Informasi Sistem

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| Tanggal Pembuatan | ✅ | ✅ |
| Tanggal Modifikasi Terakhir | ✅ | ✅ |
| Pembuat | ✅ | ❌ |
| Modifikator Terakhir | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Tipe Relasi

| Tipe Field | Database Utama | Database Eksternal |
|---------|---------|-----------|
| One to One | ✅ | ✅ |
| One to Many | ✅ | ✅ |
| Many to One | ✅ | ✅ |
| Many to Many | ✅ | ✅ |
| Many to Many (Array) | ✅ | ✅ |

:::info
Field lampiran bergantung pada Collection file, dan Collection file hanya didukung oleh database utama, sehingga database eksternal sementara tidak mendukung field lampiran.
:::

## IV. Perbandingan Dukungan Backup dan Migration

| Fitur | Database Utama | Database Eksternal |
|-----|---------|-----------|
| Backup Restore | ✅ | ❌ (perlu ditangani sendiri) |
| Manajemen Migration | ✅ | ❌ (perlu ditangani sendiri) |

:::info
NocoBase menyediakan kemampuan backup, restore, dan migrasi struktur untuk database utama. Untuk database eksternal, operasi ini perlu dilakukan oleh pengguna secara mandiri sesuai dengan environment database masing-masing. NocoBase tidak menyediakan dukungan bawaan.
:::

## Ringkasan Perbandingan

| Item Perbandingan | Database Utama | Database Eksternal |
|-------|---------|-----------|
| Tipe Database | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Dukungan Tipe Tabel | Semua tipe tabel | Hanya mendukung Collection umum dan Collection view |
| Dukungan Tipe Field | Semua tipe field | Tipe field selain field lampiran |
| Backup dan Migration | Dukungan bawaan | Perlu ditangani sendiri |

## Saran

- **Jika menggunakan NocoBase untuk membangun sistem bisnis baru sepenuhnya**, gunakan **Database Utama**, sehingga Anda dapat menggunakan fitur lengkap NocoBase.
- **Jika menggunakan NocoBase untuk mengintegrasikan database sistem lain dan melakukan operasi CRUD dasar**, gunakan **Database Eksternal**.
