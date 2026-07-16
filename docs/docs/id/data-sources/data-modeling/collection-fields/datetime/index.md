---
title: "Ikhtisar"
description: "Tipe field datetime: dengan timezone/tanpa timezone, tanggal, waktu, Unix Timestamp, perbandingan tipe NocoBase/MySQL/PostgreSQL."
keywords: "datetime,DateTime,field waktu,dengan timezone,tanpa timezone,Unix Timestamp,NocoBase"
---

# Ikhtisar

## Tipe Field Datetime

Tipe field datetime meliputi beberapa berikut:

- **Datetime (dengan Timezone)** - Datetime akan dikonversi secara seragam ke waktu UTC (Coordinated Universal Time), dan dikonversi ke timezone saat dibutuhkan;
- **Datetime (tanpa Timezone)** - Menyimpan tanggal dan waktu tanpa informasi timezone;
- **Tanggal (tanpa Waktu)** - Hanya menyimpan tanggal, tidak termasuk bagian waktu;
- **Waktu** - Hanya menyimpan waktu, tidak termasuk bagian tanggal;
- **Unix Timestamp** - Disimpan sebagai Unix timestamp, biasanya dalam detik sejak 1 Januari 1970.

Contoh untuk berbagai tipe field terkait tanggal:

| **Tipe Field**         | **Contoh Nilai**                 | **Deskripsi**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Datetime (dengan Timezone)    | 2024-08-24T07:30:00.000Z   | Datetime akan dikonversi secara seragam ke waktu UTC (Coordinated Universal Time)      |
| Datetime (tanpa Timezone)  | 2024-08-24 15:30:00        | Datetime tanpa timezone, hanya mencatat tanggal dan waktu             |
| Tanggal (tanpa Waktu)     | 2024-08-24                 | Hanya menyimpan informasi tanggal, tidak termasuk waktu                     |
| Waktu               | 15:30:00                   | Hanya menyimpan informasi waktu, tidak termasuk tanggal                     |
| Unix Timestamp        | 1724437800                 | Jumlah detik yang berlalu sejak 00:00:00 UTC 1 Januari 1970 |

## Perbandingan Berbagai Data Source

Tabel perbandingan NocoBase, MySQL, dan PostgreSQL:

| **Tipe Field**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Datetime (dengan Timezone)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Datetime (tanpa Timezone)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Tanggal (tanpa Waktu)     | Date                      | DATE                 | DATE                          |
| Waktu               | Time                     | TIME                 | TIME WITHOUT TIME ZONE        |
| Unix Timestamp        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Waktu (dengan Timezone)      | -                         | -                  | TIME WITH TIME ZONE           |

Catatan:
- Rentang data MySQL TIMESTAMP berada di antara waktu UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Saat melebihi rentang ini, disarankan untuk menggunakan DATETIME atau BIGINT untuk menyimpan Unix timestamp.

## Alur Pemrosesan Penyimpanan Datetime

### Dengan Timezone

Termasuk `Datetime (tanpa Timezone)` dan `Unix Timestamp`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Catatan:
- Untuk mendukung rentang data yang lebih luas, field datetime (dengan timezone) NocoBase di database MySQL menggunakan DATETIME. Nilai tanggal yang disimpan adalah nilai yang sudah dikonversi berdasarkan environment variable TZ server. Jika environment variable TZ berubah, nilai datetime yang tersimpan akan berubah.
- Ada perbedaan timezone antara waktu UTC dan waktu lokal. Menampilkan langsung nilai UTC asli dapat menyebabkan kesalahpahaman bagi pengguna.

### Tanpa Timezone

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) adalah standar waktu global yang digunakan untuk mengoordinasikan dan menyatukan waktu di seluruh dunia. Standar ini berbasis pada jam atom dengan presisi tinggi dan tetap sinkron dengan waktu rotasi bumi.

Ada perbedaan timezone antara waktu UTC dan waktu lokal. Menampilkan langsung nilai UTC asli dapat menyebabkan kesalahpahaman bagi pengguna, contohnya:

| **Timezone**       | **Datetime**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| WITA (UTC+8) | 2024-08-24 15:30:00               |
| Zona Timur 5 (UTC+5) | 2024-08-24 12:30:00               |
| Zona Barat 5 (UTC-5) | 2024-08-24 02:30:00               |
| Waktu Inggris (UTC+0) | 2024-08-24 07:30:00              |
| Waktu Tengah (UTC-6) | 2024-08-23 01:30:00              |

Semua di atas merepresentasikan satu waktu yang sama, hanya berbeda timezone-nya saja.
