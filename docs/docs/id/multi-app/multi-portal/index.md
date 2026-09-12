---
title: "Multi-portal"
description: "Pelajari konsep, skenario penggunaan, konfigurasi, serta hubungan antara Multi-portal, Multi-app, dan Multi-space di NocoBase."
keywords: "ruang kerja, portal, multi-portal, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multi-portal

## Apa itu portal

Portal digunakan untuk menyediakan beberapa pintu masuk akses dalam aplikasi yang sama.

Setiap portal dapat memiliki secara terpisah:

- Halaman
- Menu
- Struktur navigasi
- Tata letak
- Konfigurasi izin

Plugin Multi-portal menyediakan kemampuan berikut:

- Manajemen portal
- Perpindahan portal
- Kontrol izin portal

Dengan kemampuan ini, Anda dapat menyediakan pengalaman yang berbeda untuk peran yang berbeda sambil tetap berbagi data dan kemampuan bisnis yang sama.

## Mengapa portal dibutuhkan

Dalam skenario bisnis nyata, peran yang berbeda sering kali membutuhkan antarmuka yang berbeda.

Contohnya dalam sistem manajemen ritel:

```text
Sistem Manajemen Ritel

├─ Portal Kantor Pusat
├─ Portal Toko
├─ Portal Distributor
└─ Portal Mobile
```

Staf kantor pusat berfokus pada:

- Manajemen produk
- Manajemen inventaris
- Analisis data

Staf toko berfokus pada:

- Kasir
- Stock opname
- Pemrosesan pesanan

Distributor berfokus pada:

- Pembelian
- Rekonsiliasi
- Status pengiriman

Meskipun menggunakan sistem yang sama, peran yang berbeda tidak perlu melihat menu dan halaman yang sama.

Portal hadir untuk menyelesaikan masalah ini.

## Hubungan antara portal dan menu

Setiap portal memiliki pohon menu sendiri.

Menu di portal yang berbeda tidak saling memengaruhi.

Contohnya:

```text
Portal Kantor Pusat
├─ Manajemen Produk
├─ Manajemen Rantai Pasok
└─ Analisis Data

Portal Toko
├─ Kasir
├─ Manajemen Pesanan
└─ Stock opname
```

## Hubungan antara portal dan halaman

Halaman dimiliki oleh portal masing-masing.

Halaman yang sama juga dapat ditampilkan hanya pada portal tertentu.

Ini memungkinkan perancangan alur kerja yang benar-benar berbeda untuk peran yang berbeda.

## Hubungan antara portal dan izin

Portal itu sendiri dapat dikonfigurasi dengan izin akses.

Hanya pengguna yang diberi otorisasi yang dapat mengakses portal terkait.

Portal yang tidak diizinkan:

- Tidak akan muncul di daftar switcher
- Tidak dapat diakses secara langsung

## Manajemen portal

Setelah plugin Multi-portal diaktifkan, sistem secara default menyediakan dua portal bawaan:

| Portal | Path | Tujuan |
|----------|----------|----------|
| Desktop | `/v/admin` | Pintu masuk desktop |
| Mobile | `/v/mobile` | Pintu masuk mobile |

### Portal bawaan

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Portal desktop

Path akses:

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Portal mobile

Path akses:

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Membuat portal

Selain portal bawaan, Anda juga dapat membuat lebih banyak portal sesuai kebutuhan bisnis.

Contohnya:

- Portal toko
- Portal distributor
- Portal layanan pelanggan
- Portal analisis data

Setelah dibuat, Anda dapat mengonfigurasi:

- Halaman
- Menu
- Izin
- Navigasi

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Berpindah portal

Pengguna dapat dengan cepat berpindah antarportal melalui portal switcher.

### Berpindah portal dalam satu aplikasi

Tambahkan ke panel portal switcher di kiri atas

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Tambahkan ke blok panel aksi

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Berpindah portal lintas aplikasi

Setelah Multi-app diaktifkan dan SSO dikonfigurasi, pengguna juga dapat berpindah antarportal dari aplikasi yang berbeda melalui portal switcher.

Tambahkan ke panel portal switcher di kiri atas

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Tambahkan ke blok panel aksi

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Izin portal

Anda dapat mengontrol portal mana yang dapat diakses pengguna melalui izin peran.

Portal yang tidak diizinkan tidak akan muncul di daftar portal switcher, dan pengguna tidak dapat langsung mengakses pintu masuk tersebut.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Tautan terkait

Untuk perbedaan dan pola kombinasi antara Multi-portal, Multi-app, dan Multi-space, lihat: [Multi-app vs Multi-portal vs Multi-space](../multi-app-vs-multi-portal-vs-multi-space.md).
