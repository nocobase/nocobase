---
title: "Field Relasi"
description: "Field relasi digunakan untuk membangun hubungan antar tabel data, dengan dukungan untuk tipe relasi satu-ke-satu, satu-ke-banyak, banyak-ke-satu, banyak-ke-banyak, dan array banyak-ke-banyak."
keywords: "Field Relasi,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Field Asosiasi,NocoBase"
---

# Field Relasi

Di NocoBase, **field relasi** digunakan untuk membangun hubungan antar tabel data. Field ini memungkinkan satu record merujuk ke record di tabel lain, atau merujuk ke beberapa record, misalnya pesanan terkait dengan pelanggan, tugas terkait dengan penanggung jawab, dan siswa terkait dengan mata pelajaran.

Field relasi tidak sepenuhnya sama dengan field biasa. Field biasa biasanya sesuai dengan kolom nyata di database dan digunakan untuk menyimpan nilai teks, angka, tanggal, dan sebagainya; field relasi menyimpan konfigurasi hubungan antar tabel serta kunci yang digunakan untuk menemukan record terkait. Untuk database utama, field relasi dapat membuat konfigurasi relasi yang diperlukan saat field dibuat; untuk database eksternal, relasi biasanya dibuat berdasarkan primary key, foreign key, atau field unik yang sudah ada, dan tidak akan secara otomatis mengubah struktur tabel database eksternal.

## Memilih tipe relasi

Tipe relasi yang umum adalah sebagai berikut:

| Tipe relasi | Skenario penggunaan |
| --- | --- |
| [Satu-ke-satu](./o2o/index.md) | Satu record hanya terkait dengan satu record di tabel lain. Misalnya, seorang karyawan terkait dengan satu berkas kepegawaian. |
| [Satu-ke-banyak](./o2m/index.md) | Satu record terkait dengan beberapa record di tabel lain. Misalnya, seorang pelanggan terkait dengan beberapa pesanan. |
| [Banyak-ke-satu](./m2o/index.md) | Beberapa record terkait dengan satu record target yang sama. Misalnya, beberapa pesanan terkait dengan pelanggan yang sama. |
| [Banyak-ke-banyak](./m2m/index.md) | Dua tabel dapat saling mengaitkan beberapa record. Misalnya, siswa dan mata pelajaran saling terkait. |
| [Array banyak-ke-banyak](../../../field-m2m-array/index.md) | Menggunakan field array untuk menyimpan pengenal beberapa record target, cocok untuk skenario ketika struktur tabel yang sudah ada menyimpan nilai relasi dalam bentuk array. |

Secara default, tentukan terlebih dahulu berdasarkan makna bisnis: jika record saat ini hanya dimiliki oleh satu record target, biasanya gunakan banyak-ke-satu; jika record saat ini perlu menampilkan beberapa record dari tabel target, biasanya gunakan satu-ke-banyak; jika kedua sisi dapat terkait dengan beberapa record, biasanya gunakan banyak-ke-banyak.

## Hal-hal penting dalam konfigurasi

Saat mengonfigurasi field relasi, pastikan hal-hal berikut:

- Tabel data target: tabel mana yang akan dihubungkan oleh relasi
- Tipe relasi: satu-ke-satu, satu-ke-banyak, banyak-ke-satu, banyak-ke-banyak, atau array banyak-ke-banyak
- Kunci relasi: field mana yang digunakan untuk menemukan record di kedua sisi, biasanya primary key, foreign key, atau field unik
- Field judul: field mana dari record terkait yang secara default ditampilkan di pemilih dan blok

:::warning Perhatian

Field relasi dalam database eksternal terutama merupakan metadata relasi yang disimpan oleh NocoBase. Menambahkan field relasi tidak akan secara otomatis membuat foreign key, indeks, atau tabel perantara nyata di database eksternal. Jika memerlukan batasan foreign key pada tingkat database, buat terlebih dahulu di sisi database, lalu kembali ke NocoBase untuk menyinkronkan dan mengonfigurasi field.

:::

## Tautan terkait

- [Satu-ke-satu](./o2o/index.md) — Lihat konfigurasi field relasi satu-ke-satu
- [Satu-ke-banyak](./o2m/index.md) — Lihat konfigurasi field relasi satu-ke-banyak
- [Banyak-ke-satu](./m2o/index.md) — Lihat konfigurasi field relasi banyak-ke-satu
- [Banyak-ke-banyak](./m2m/index.md) — Lihat konfigurasi field relasi banyak-ke-banyak
- [Array banyak-ke-banyak](../../../field-m2m-array/index.md) — Lihat relasi banyak-ke-banyak berbasis array
