---
title: "Query Data"
description: "Query data Chart: mode grafis Builder dan mode SQL, konfigurasi ukuran/dimensi, filter/sortir/paginasi, pemilihan sumber data dan koleksi."
keywords: "query data,mode Builder,ukuran,dimensi,kondisi filter,sumber data,NocoBase"
---

# Query Data

Panel konfigurasi Chart secara keseluruhan dibagi menjadi tiga bagian: Query Data, Opsi Chart, dan Event Interaksi, serta tombol Batal, Preview, dan Simpan di bagian paling bawah.

Mari kita lihat panel "Query Data" terlebih dahulu untuk memahami dua mode query (Builder/SQL) dan fitur umumnya.


## Struktur Panel
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tips: Untuk lebih mudah mengkonfigurasi konten saat ini, Anda dapat melipat panel lainnya terlebih dahulu.


Bagian paling atas adalah toolbar
- Mode: Builder (grafis, sederhana dan mudah) / SQL (statement manual, lebih fleksibel).
- Jalankan Query: klik untuk mengeksekusi permintaan query data.
- Lihat Hasil: buka panel hasil data, dapat beralih antara Table/JSON. Klik lagi untuk menyembunyikan panel.

Dari atas ke bawah secara berurutan:
- Sumber data dan koleksi: wajib diisi, pilih sumber data dan tabel data.
- Ukuran (Measures): wajib diisi, field numerik yang ditampilkan.
- Dimensi (Dimensions): pengelompokan berdasarkan field (tanggal/kategori/wilayah, dll.).
- Filter: atur kondisi filter (=, ≠, >, <, contains, range, dll.), beberapa kondisi dapat dikombinasikan.
- Sortir: pilih field untuk sortir dan urutan naik/turun.
- Paginasi: kontrol cakupan data dan urutan pengembalian.


## Mode Builder

### Pilih Sumber Data dan Koleksi
- Pada panel "Query Data" pilih mode "Builder".
- Pilih sumber data dan koleksi (tabel data). Saat koleksi tidak dapat dipilih atau kosong, periksa terlebih dahulu izin dan apakah sudah dibuat.


### Konfigurasikan Ukuran (Measures)
- Pilih satu atau beberapa field numerik, atur agregasi: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Skenario umum: `Count` untuk menghitung jumlah record, `Sum` untuk menghitung total.


### Konfigurasikan Dimensi (Dimensions)
- Pilih satu atau beberapa field sebagai dimensi pengelompokan.
- Field tanggal-waktu dapat diatur formatnya (seperti `YYYY-MM`, `YYYY-MM-DD`) untuk memudahkan pengelompokan per bulan/hari.


### Filter, Sortir, dan Paginasi
- Filter: tambahkan kondisi (=, ≠, contains, range, dll.), beberapa kondisi dapat dikombinasikan.
- Sortir: pilih field dan urutan naik/turun.
- Paginasi: atur `Limit` dan `Offset` untuk mengontrol jumlah baris yang dikembalikan; saat debugging disarankan mengatur `Limit` lebih kecil terlebih dahulu.


### Jalankan Query dan Lihat Hasil
- Klik "Jalankan Query" untuk eksekusi, setelah dikembalikan periksa kolom dan nilai pada "Lihat Data" dengan beralih `Table / JSON`.
- Sebelum memetakan field Chart, konfirmasikan terlebih dahulu nama dan tipe kolom di sini, untuk menghindari Chart kosong atau error.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Pemetaan Field Selanjutnya

Selanjutnya pada konfigurasi "Opsi Chart", lakukan pemetaan field berdasarkan field tabel sumber data dan koleksi yang dipilih.

## Mode SQL

### Tulis Query
- Beralih ke mode "SQL", masukkan statement query, klik "Jalankan Query".
- Contoh (statistik jumlah pesanan berdasarkan tanggal):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Jalankan Query dan Lihat Hasil

- Klik "Jalankan Query" untuk eksekusi, setelah dikembalikan periksa kolom dan nilai pada "Lihat Data" dengan beralih `Table / JSON`.
- Sebelum memetakan field Chart, konfirmasikan terlebih dahulu nama dan tipe kolom di sini, untuk menghindari Chart kosong atau error.

### Pemetaan Field Selanjutnya

Selanjutnya pada konfigurasi "Opsi Chart", lakukan pemetaan field berdasarkan kolom hasil query.


> [!TIP]
> Untuk informasi lebih lanjut tentang mode SQL, lihat Penggunaan Lanjutan — Query Data Mode SQL.
