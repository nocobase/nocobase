---
pkg: '@nocobase/plugin-logger'
title: "Ikhtisar Log dan Audit"
description: "Sistem log NocoBase: log sisi server (running sistem, request), audit log (operasi pengguna, perubahan resource), riwayat record (nilai sebelum/sesudah perubahan data, perbandingan versi)."
keywords: "log sisi server,audit log,riwayat record,log request,audit operasi pengguna,riwayat perubahan data,NocoBase"
---

# Log Sisi Server, Audit Log, Riwayat Record

## Log Sisi Server

### Log Running Sistem

> Lihat [Log Sistem](./index.md#log-sistem)

- Mencatat informasi running sistem aplikasi, melacak chain eksekusi logika kode, menelusuri error running kode dan informasi anomali lainnya.
- Memiliki klasifikasi level log, dikategorikan berdasarkan modul fungsional.
- Disimpan melalui terminal output atau dalam bentuk file.
- Terutama digunakan untuk menyelidiki situasi anomali yang muncul selama running sistem.

### Log Request

> Lihat [Log Request](./index.md#log-request)

- Mencatat informasi request dan respons HTTP API, fokus mencatat informasi seperti request ID, API Path, request header, status code respons, durasi.
- Disimpan melalui terminal output atau dalam bentuk file.
- Terutama digunakan untuk melacak panggilan dan eksekusi API.

## Audit Log

> Lihat [Audit Log](/security/audit-logger/index.md)

- Mencatat perilaku operasi pengguna (API) terhadap resource sistem, fokus mencatat informasi seperti tipe resource, object resource, tipe operasi, informasi pengguna, status operasi.
- Untuk lebih baik melacak konten dan hasil spesifik dari operasi pengguna, parameter request dan respons request akan dicatat sebagai informasi MetaData. Bagian informasi ini sebagian tumpang tindih dengan log request, tetapi tidak sepenuhnya konsisten; misalnya pada log request yang ada biasanya juga tidak mencatat request body lengkap.
- Parameter request dan respons request tidak setara dengan snapshot resource. Anda dapat mengetahui perubahan apa yang dihasilkan operasi melalui parameter dan logika kode, tetapi tidak dapat mengetahui secara akurat apa konten record tabel data sebelum dimodifikasi, untuk implementasi version control dan recovery data setelah operasi yang salah.
- Disimpan dalam bentuk file dan tabel data

![](https://static-docs.nocobase.com/202501031627922.png)

## Riwayat Record

> Lihat [Riwayat Record](/record-history/index.md)

- Mencatat riwayat perubahan konten data.
- Konten utama yang dicatat adalah tipe resource, object resource, tipe operasi, field yang diubah, nilai sebelum dan sesudah perubahan.
- Dapat digunakan untuk perbandingan data.
- Disimpan dalam bentuk tabel data.

![](https://static-docs.nocobase.com/202511011338499.png)
