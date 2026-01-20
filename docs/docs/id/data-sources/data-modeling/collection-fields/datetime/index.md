:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

## Tipe Kolom Tanggal dan Waktu

Tipe kolom tanggal dan waktu dapat dikategorikan sebagai berikut:

-   **Tanggal dan Waktu (dengan Zona Waktu)**: Nilai tanggal dan waktu ini distandardisasi ke UTC (Coordinated Universal Time) dan disesuaikan dengan zona waktu jika diperlukan.
-   **Tanggal dan Waktu (tanpa Zona Waktu)**: Tipe ini menyimpan data tanggal dan waktu tanpa menyertakan informasi zona waktu apa pun.
-   **Tanggal (tanpa Waktu)**: Format ini secara eksklusif menyimpan informasi tanggal, tanpa komponen waktu.
-   **Waktu**: Hanya menyimpan informasi waktu, tidak termasuk tanggal.
-   **Unix Timestamp**: Tipe ini merepresentasikan jumlah detik yang telah berlalu sejak 1 Januari 1970, dan disimpan sebagai Unix timestamp.

Berikut adalah contoh untuk setiap tipe kolom terkait tanggal dan waktu:

| **Tipe Kolom**                  | **Contoh Nilai**           | **Deskripsi**                                          |
|---------------------------------|----------------------------|--------------------------------------------------------|
| Tanggal dan Waktu (dengan Zona Waktu) | 2024-08-24T07:30:00.000Z   | Dikonversi ke UTC dan dapat disesuaikan untuk zona waktu |
| Tanggal dan Waktu (tanpa Zona Waktu) | 2024-08-24 15:30:00        | Menyimpan tanggal dan waktu tanpa mempertimbangkan zona waktu |
| Tanggal (tanpa Waktu)           | 2024-08-24                 | Hanya menangkap tanggal, tanpa informasi waktu         |
| Waktu                           | 15:30:00                   | Hanya menangkap waktu, tidak termasuk detail tanggal   |
| Unix Timestamp                  | 1724437800                 | Merepresentasikan detik sejak 1970-01-01 00:00:00 UTC |

## Perbandingan Sumber Data

Berikut adalah tabel perbandingan untuk NocoBase, MySQL, dan PostgreSQL:

| **Tipe Kolom**                  | **NocoBase**                  | **MySQL**                  | **PostgreSQL**                        |
|---------------------------------|-------------------------------|----------------------------|---------------------------------------|
| Tanggal dan Waktu (dengan Zona Waktu) | Datetime with timezone        | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE              |
| Tanggal dan Waktu (tanpa Zona Waktu) | Datetime without timezone     | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE           |
| Tanggal (tanpa Waktu)           | Date                          | DATE                       | DATE                                  |
| Waktu                           | Time                          | TIME                       | TIME WITHOUT TIME ZONE                |
| Unix Timestamp                  | Unix timestamp                | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                    |
| Waktu (dengan Zona Waktu)       | -                             | -                          | TIME WITH TIME ZONE                   |

Catatan:
-   Tipe `TIMESTAMP` MySQL mencakup rentang antara `1970-01-01 00:00:01 UTC` dan `2038-01-19 03:14:07 UTC`. Untuk tanggal dan waktu di luar rentang ini, disarankan untuk menggunakan `DATETIME` atau `BIGINT` untuk menyimpan Unix timestamp.

## Alur Kerja Pemrosesan Penyimpanan Tanggal dan Waktu

### Dengan Zona Waktu

Ini termasuk `Tanggal dan Waktu (dengan Zona Waktu)` dan `Unix Timestamp`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Catatan:
-   Untuk mengakomodasi rentang tanggal yang lebih luas, NocoBase menggunakan tipe `DATETIME` di database MySQL untuk kolom Tanggal dan Waktu (dengan Zona Waktu). Nilai tanggal yang disimpan dikonversi berdasarkan variabel lingkungan `TZ` server, yang berarti jika variabel lingkungan `TZ` berubah, nilai Tanggal dan Waktu yang disimpan juga akan berubah.
-   Karena ada perbedaan zona waktu antara UTC dan waktu lokal, menampilkan nilai UTC mentah secara langsung dapat menyebabkan kebingungan bagi pengguna.

### Tanpa Zona Waktu

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) adalah standar waktu global yang digunakan untuk mengoordinasikan dan menyinkronkan waktu di seluruh dunia. Ini adalah standar waktu yang sangat presisi, dipertahankan oleh jam atom, dan disinkronkan dengan rotasi Bumi.

Perbedaan antara UTC dan waktu lokal dapat menyebabkan kebingungan saat menampilkan nilai UTC mentah. Contohnya:

| **Zona Waktu** | **Tanggal dan Waktu**    |
|----------------|--------------------------|
| UTC            | 2024-08-24T07:30:00.000Z |
| UTC+8          | 2024-08-24 15:30:00      |
| UTC+5          | 2024-08-24 12:30:00      |
| UTC-5          | 2024-08-24 02:30:00      |
| UTC+0          | 2024-08-24 07:30:00      |
| UTC-6          | 2024-08-23 01:30:00      |

Waktu-waktu yang berbeda ini semuanya merujuk pada momen yang sama, hanya saja diekspresikan dalam zona waktu yang berbeda.