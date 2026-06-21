---
pkg: "@nocobase/plugin-action-export-pro"
title: "Action Ekspor Pro"
description: "Action Ekspor Pro: fitur ekspor lanjutan, mendukung template kustom, ekspor multi-table, format kompleks."
keywords: "Ekspor Pro, ExportPro, ekspor lanjutan, template kustom, interface builder, NocoBase"
---
# Ekspor Pro

## Pengantar

Plugin Ekspor Pro menyediakan fitur tambahan di atas fitur ekspor biasa.

## Instalasi

Plugin ini bergantung pada Plugin Manajemen Tugas Asynchronous, sebelum digunakan harus mengaktifkan Plugin Manajemen Tugas Asynchronous terlebih dahulu.

## Peningkatan Fitur

- Mendukung Action ekspor asynchronous, dieksekusi di thread independen, mendukung ekspor data dalam jumlah besar.
- Mendukung ekspor lampiran.

## Panduan Penggunaan

### Konfigurasi Mode Ekspor

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)


Pada tombol ekspor, Anda dapat mengkonfigurasi mode ekspor. Tiga mode ekspor yang tersedia:

- Otomatis: Menentukan mode ekspor berdasarkan jumlah data saat ekspor. Jika jumlah data kurang dari 1000 record (100 record untuk ekspor lampiran), gunakan ekspor sinkron. Jika jumlah data lebih dari 1000 record (100 record untuk ekspor lampiran), gunakan ekspor asynchronous.
- Sinkron: Menggunakan ekspor sinkron, akan dijalankan di thread utama saat ekspor, cocok untuk data skala kecil. Jika dieksekusi ekspor data skala besar dalam mode sinkron, mungkin akan menyebabkan sistem terblokir, lag, dan tidak dapat menangani request pengguna lain.
- Asynchronous: Menggunakan ekspor asynchronous, akan dieksekusi di thread background independen saat ekspor, tidak akan memblokir penggunaan sistem saat ini.

### Ekspor Asynchronous

Setelah ekspor dieksekusi, alur ekspor akan dieksekusi di thread background independen tanpa konfigurasi manual pengguna. Di antarmuka pengguna, setelah Action ekspor dieksekusi, di bagian kanan atas akan ditampilkan tugas ekspor yang sedang dieksekusi, dan progress tugas akan ditampilkan secara real-time.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Setelah ekspor selesai, Anda dapat mendownload file yang diekspor di tugas ekspor.

#### Ekspor Concurrent
Ketika ada banyak tugas ekspor concurrent, akan terpengaruh oleh konfigurasi server, sehingga menyebabkan respons sistem melambat. Oleh karena itu, disarankan kepada developer sistem untuk mengkonfigurasi jumlah maksimum konkurensi ekspor tugas (default 3). Ketika melebihi jumlah konkurensi yang dikonfigurasi, akan masuk ke status antrian.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Cara konfigurasi konkurensi: Variabel lingkungan ASYNC_TASK_MAX_CONCURRENCY=jumlah konkurensi

Dalam pengujian komprehensif konfigurasi yang berbeda dan kompleksitas data, jumlah konkurensi yang direkomendasikan:
- 2 core CPU, jumlah konkurensi 3.
- 4 core CPU, jumlah konkurensi 5.

#### Tentang Performa
Ketika Anda menemukan proses ekspor sangat lambat (referensi sebagai berikut), mungkin disebabkan oleh masalah performa karena struktur Collection.

| Karakteristik Data | Tipe Index | Jumlah Data | Durasi Ekspor |
|---------|---------|--------|---------|
| Tanpa Field relasi | Primary key/unique constraint | 1 juta | 3-6 menit |
| Tanpa Field relasi | Index biasa | 1 juta | 6-10 menit |
| Tanpa Field relasi | Index gabungan (non-unique) | 1 juta | 30 menit |
| Field relasi<br>(one-to-one, one-to-many,<br>many-to-one, many-to-many) | Primary key/unique constraint | 500 ribu | 15-30 menit | Field relasi menyebabkan penurunan performa |

Untuk memastikan ekspor yang efisien, Anda disarankan:
1. Collection harus memenuhi kondisi berikut:

| Tipe Kondisi | Kondisi Wajib | Penjelasan Lainnya |
|---------|------------------------|------|
| Struktur Table (minimal memenuhi salah satu) | Memiliki primary key<br>Memiliki unique constraint<br>Memiliki index (unique, biasa, gabungan) | Prioritas: primary key > unique constraint > index
| Karakteristik Field | Primary key/unique constraint/index (salah satu) harus memiliki karakteristik yang dapat di-sort, seperti: auto-increment ID, snowflake ID, UUID v1, timestamp, angka, dll.<br>(Perhatian: UUID v3/v4/v5, string biasa, dan Field yang tidak dapat di-sort lainnya akan mempengaruhi performa) | Tidak ada |

2. Kurangi Field yang tidak perlu diekspor, terutama Field relasi (masalah performa Field relasi masih dalam optimasi)
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Jika sudah memenuhi kondisi di atas tetapi masih ada fenomena ekspor lambat, dapat melakukan analisis log atau memberikan feedback ke tim resmi.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)


- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
