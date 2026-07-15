---
title: "Ikhtisar"
description: "Jenis field tanggal dan waktu: dengan/tanpa zona waktu, tanggal, waktu, stempel waktu Unix, serta perbandingan tipe NocoBase/MySQL/PostgreSQL."
keywords: "tanggal dan waktu,DateTime,field waktu,dengan zona waktu,tanpa zona waktu,stempel waktu Unix,NocoBase"
---

# Ikhtisar

## Jenis field tanggal dan waktu

Jenis field tanggal dan waktu meliputi:

- **Tanggal dan waktu (dengan zona waktu)** - Tanggal dan waktu akan dikonversi secara konsisten ke waktu UTC (Waktu Universal Terkoordinasi), dan dikonversi ke zona waktu yang sesuai jika diperlukan;
- **Tanggal dan waktu (tanpa zona waktu)** - Menyimpan tanggal dan waktu tanpa informasi zona waktu;
- **Tanggal (tanpa waktu)** - Hanya menyimpan tanggal, tanpa bagian waktu;
- **Waktu** - Hanya menyimpan waktu, tanpa bagian tanggal;
- **Stempel waktu Unix** - Disimpan sebagai stempel waktu Unix, biasanya berupa jumlah detik sejak 1 Januari 1970.

Contoh setiap jenis field terkait tanggal:

| **Jenis field**         | **Nilai contoh**                 | **Deskripsi**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Tanggal dan waktu (dengan zona waktu)    | 2024-08-24T07:30:00.000Z   | Tanggal dan waktu dikonversi secara konsisten ke waktu UTC (Waktu Universal Terkoordinasi)      |
| Tanggal dan waktu (tanpa zona waktu)  | 2024-08-24 15:30:00        | Tanggal dan waktu tanpa zona waktu, hanya mencatat tanggal dan waktu             |
| Tanggal (tanpa waktu)     | 2024-08-24                 | Hanya menyimpan informasi tanggal, tanpa waktu                     |
| Waktu               | 15:30:00                   | Hanya menyimpan informasi waktu, tanpa tanggal                     |
| Stempel waktu Unix        | 1724437800                 | Jumlah detik yang telah berlalu sejak 1970-01-01 00:00:00 waktu UTC |

## Perbandingan sumber data

Tabel perbandingan NocoBase, MySQL, dan PostgreSQL:

| **Jenis field**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Tanggal dan waktu (dengan zona waktu)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Tanggal dan waktu (tanpa zona waktu)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Tanggal (tanpa waktu)     | Date                      | DATE                 | DATE                          |
| Waktu               | Time                     | TIME                     | TIME WITHOUT TIME ZONE        |
| Stempel waktu Unix        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Waktu (dengan zona waktu)      | -                         | -                  | TIME WITH TIME ZONE           |

Catatan:
- Rentang data TIMESTAMP MySQL berada di antara waktu UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Jika berada di luar rentang tersebut, disarankan menggunakan DATETIME atau BIGINT untuk menyimpan stempel waktu Unix.

## Alur pemrosesan penyimpanan tanggal dan waktu

### Dengan zona waktu

Meliputi `日期时间（不含时区）` dan `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Catatan:
- Untuk mendukung rentang data yang lebih luas, field tanggal dan waktu (dengan zona waktu) NocoBase di database MySQL menggunakan DATETIME. Nilai tanggal yang disimpan adalah nilai setelah dikonversi berdasarkan variabel lingkungan TZ di sisi server. Jika variabel lingkungan TZ berubah, nilai tanggal dan waktu yang disimpan juga akan berubah.
- Perbedaan zona waktu antara waktu UTC dan waktu lokal dapat menyebabkan kesalahpahaman jika nilai asli UTC ditampilkan secara langsung.

### Tanpa zona waktu

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Waktu Universal Terkoordinasi, Coordinated Universal Time) adalah standar waktu global yang digunakan untuk mengoordinasikan dan menyelaraskan waktu di seluruh dunia. UTC didasarkan pada standar waktu berpresisi tinggi dari jam atom dan disinkronkan dengan rotasi bumi.

Perbedaan zona waktu antara waktu UTC dan waktu lokal dapat menyebabkan kesalahpahaman jika nilai asli UTC ditampilkan secara langsung, misalnya:

| **Zona waktu**       | **Tanggal dan waktu**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| Zona timur 8 (UTC+8) | 2024-08-24 15:30:00               |
| Zona timur 5 (UTC+5) | 2024-08-24 12:30:00               |
| Zona barat 5 (UTC-5) | 2024-08-24 02:30:00               |
| Waktu Inggris (UTC+0) | 2024-08-24 07:30:00              |
| Waktu Tengah (UTC-6) | 2024-08-23 01:30:00              |

Semua waktu di atas menunjukkan satu waktu yang sama; perbedaannya hanya terletak pada zona waktunya.
