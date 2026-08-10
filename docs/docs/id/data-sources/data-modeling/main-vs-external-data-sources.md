---
title: "Perbandingan Database Utama dan Eksternal"
description: "Perbedaan antara database utama dan eksternal: perbandingan dukungan jenis database, jenis tabel data, jenis field, serta kemampuan pencadangan, pemulihan, dan migrasi."
keywords: "database utama,database eksternal,perbandingan sumber data,koneksi hanya-baca,sinkronisasi tabel data,NocoBase"
---

# Perbandingan Database Utama dan Eksternal

Perbedaan antara database utama dan eksternal di NocoBase terutama terlihat dalam empat aspek berikut: dukungan jenis database, dukungan jenis tabel data, dukungan jenis field, serta pencadangan, pemulihan, dan migrasi.

## I. Dukungan Jenis Database

Untuk detail selengkapnya, lihat [Manajemen sumber data](https://docs.nocobase.com/data-sources/data-source-manager)

### Jenis Database

| Jenis database | Didukung database utama | Didukung database eksternal |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Manajemen Tabel Data

| Manajemen tabel data | Didukung database utama | Didukung database eksternal |
|-----------|-------------|--------------|
| Manajemen dasar | ✅ | ✅ |
| Manajemen visual | ✅ | ❌ |

## II. Dukungan Jenis Tabel Data

Untuk detail selengkapnya, lihat [Tabel data](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Jenis tabel data | Database utama | Database eksternal | Keterangan |
|-----------|---------|-----------|------|
| Tabel biasa | ✅ | ✅ | Tabel data dasar |
| Tabel view | ✅ | ✅ | View sumber data |
| Tabel turunan | ✅ | ❌ | Mendukung pewarisan model data, hanya didukung sumber data utama |
| Tabel file | ✅ | ❌ | Mendukung pengunggahan file, hanya didukung sumber data utama |
| Tabel komentar | ✅ | ❌ | Sistem komentar bawaan, hanya didukung sumber data utama |
| Tabel kalender | ✅ | ❌ | Tabel data untuk tampilan kalender |
| Tabel ekspresi | ✅ | ❌ | Mendukung perhitungan formula |
| Tabel hierarki | ✅ | ❌ | Untuk pemodelan data berstruktur pohon |
| Tabel SQL | ✅ | ❌ | Tabel data yang dapat didefinisikan melalui SQL |
| Tabel data eksternal terhubung | ✅ | ❌ | Tabel koneksi ke sumber data eksternal, dengan fungsi terbatas |

## III. Dukungan Jenis Field

Untuk detail selengkapnya, lihat [Field tabel data](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Jenis Dasar

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Teks satu baris | ✅ | ✅ |
| Teks multi-baris | ✅ | ✅ |
| Nomor ponsel | ✅ | ✅ |
| Email | ✅ | ✅ |
| URL | ✅ | ✅ |
| Bilangan bulat | ✅ | ✅ |
| Angka | ✅ | ✅ |
| Persentase | ✅ | ✅ |
| Kata sandi | ✅ | ✅ |
| Warna | ✅ | ✅ |
| Ikon | ✅ | ✅ |

### Jenis Pilihan

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Kotak centang | ✅ | ✅ |
| Menu dropdown (pilihan tunggal) | ✅ | ✅ |
| Menu dropdown (pilihan ganda) | ✅ | ✅ |
| Tombol radio | ✅ | ✅ |
| Kotak centang ganda | ✅ | ✅ |
| Wilayah administratif Tiongkok | ✅ | ❌ |

### Jenis Multimedia

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Teks kaya | ✅ | ✅ |
| Lampiran (relasi) | ✅ | ❌ |
| Lampiran (URL) | ✅ | ✅ |

### Jenis Tanggal dan Waktu

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Tanggal dan waktu (dengan zona waktu) | ✅ | ✅ |
| Tanggal dan waktu (tanpa zona waktu) | ✅ | ✅ |
| Stempel waktu Unix | ✅ | ✅ |
| Tanggal (tanpa waktu) | ✅ | ✅ |
| Waktu | ✅ | ✅ |

### Jenis Geometri

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Titik | ✅ | ✅ |
| Garis | ✅ | ✅ |
| Lingkaran | ✅ | ✅ |
| Poligon | ✅ | ✅ |

### Jenis Lanjutan

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Pengurutan | ✅ | ✅ |
| Formula perhitungan | ✅ | ✅ |
| Pembuatan kode otomatis | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Pemilih tabel data | ✅ | ❌ |
| Enkripsi | ✅ | ✅ |

### Field Informasi Sistem

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Tanggal dibuat | ✅ | ✅ |
| Tanggal terakhir diubah | ✅ | ✅ |
| Pembuat | ✅ | ❌ |
| Pengubah terakhir | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Jenis Relasi

| Jenis field | Database utama | Database eksternal |
|---------|---------|-----------|
| Satu-ke-satu | ✅ | ✅ |
| Satu-ke-banyak | ✅ | ✅ |
| Banyak-ke-satu | ✅ | ✅ |
| Banyak-ke-banyak | ✅ | ✅ |
| Banyak-ke-banyak (array) | ✅ | ✅ |

:::info
Field lampiran bergantung pada tabel file, sedangkan tabel file hanya didukung oleh database utama. Oleh karena itu, database eksternal untuk sementara tidak mendukung field lampiran.
:::

## IV. Perbandingan Dukungan Pencadangan dan Migrasi

| Fitur | Database utama | Database eksternal |
|-----|---------|-----------|
| Pencadangan dan pemulihan | ✅ | ❌ (harus ditangani sendiri) |
| Manajemen migrasi | ✅ | ❌ (harus ditangani sendiri) |

:::info
NocoBase menyediakan kemampuan pencadangan, pemulihan, dan migrasi struktur untuk database utama. Untuk database eksternal, operasi ini harus diselesaikan sendiri oleh pengguna sesuai dengan lingkungan database masing-masing, karena NocoBase tidak menyediakan dukungan bawaan.
:::

## Rangkuman Perbandingan

| Aspek perbandingan | Database utama | Database eksternal |
|-------|---------|-----------|
| Jenis database | PostgreSQL、MySQL、MariaDB、KingbaseES | PostgreSQL、MySQL、MariaDB、MSSQL、Oracle、KingbaseES |
| Dukungan jenis tabel | Semua jenis tabel | Hanya mendukung tabel biasa dan tabel view |
| Dukungan jenis field | Semua jenis field | Semua jenis field selain field lampiran |
| Pencadangan dan migrasi | Dukungan bawaan | Harus ditangani sendiri |

## Saran

- **Jika Anda menggunakan NocoBase untuk membangun sistem bisnis baru**, gunakan **database utama** agar dapat menggunakan seluruh fitur NocoBase.
- **Jika Anda menggunakan NocoBase untuk menghubungkan database sistem lain guna menerapkan operasi dasar tambah, lihat, ubah, dan hapus data**, gunakan **database eksternal**.