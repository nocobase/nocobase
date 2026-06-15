---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Node Workflow - Transaksi Database"
description: "Node transaksi database: menjalankan operasi data dari sumber data yang sama dalam satu transaksi, commit saat berhasil, dan rollback saat gagal."
keywords: "Workflow,transaksi database,Transaction,rollback,commit,operasi data,NocoBase"
---

# Transaksi Database

## Pengantar

Node transaksi database digunakan untuk menjalankan sekumpulan operasi database dalam transaksi yang sama. Node ini cocok untuk skenario yang membutuhkan beberapa langkah pemrosesan data "semua berhasil atau semua rollback", misalnya membuat pesanan, mengurangi stok, menulis detail, dan memperbarui status.

Node transaksi saat ini hanya mendukung sumber data database. Operasi data dari sumber data yang sama di dalam Node akan otomatis masuk ke transaksi ini; sumber data lain tidak akan menggunakan transaksi ini.

Node ini didukung sejak versi 2.2.0.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Transaksi Database".

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Setelah dibuat, dua cabang akan dihasilkan:

- **Jalankan**: cabang utama yang dijalankan di dalam transaksi. Jika semua Node dalam cabang ini berhasil, transaksi akan otomatis di-commit. Jika ada Node yang gagal atau error, transaksi akan otomatis di-rollback.
- **Setelah rollback**: cabang yang dijalankan setelah rollback. Cabang ini berjalan di luar transaksi dan dapat digunakan untuk mencatat log, mengirim notifikasi, atau menjalankan kompensasi.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Konfigurasi Node

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Sumber Data

Pilih sumber data database yang dikendalikan oleh transaksi ini. Hanya Node operasi data dari sumber data yang sama yang otomatis masuk ke transaksi.

### Level Isolasi

Atur level isolasi transaksi. Nilai default adalah `READ UNCOMMITTED`. Jika bisnis membutuhkan konsistensi data yang lebih ketat, pilih level isolasi lain sesuai kemampuan database dan kebutuhan konkurensi.

### Lanjutkan Workflow Setelah Rollback

Jika diaktifkan, setelah cabang `Setelah rollback` selesai, workflow akan melanjutkan ke Node setelah Node transaksi.

Jika dinonaktifkan, setelah cabang `Setelah rollback` selesai, workflow berhenti di Node transaksi dan tidak menjalankan Node berikutnya.

## Cara Penggunaan

### Batasan

Cabang `Jalankan` tidak mendukung Node asinkron yang membuat workflow tertunda, seperti pemrosesan manual dan delay. Transaksi harus diselesaikan dengan commit atau rollback dalam eksekusi saat ini. Jika cabang `Jalankan` masuk ke status menunggu, sistem akan melakukan rollback transaksi dan menandai workflow sebagai gagal.

Cabang `Setelah rollback` berjalan di luar transaksi, sehingga tidak terkena batasan di atas. Anda dapat menggunakan Node asinkron pada cabang ini sesuai kebutuhan, misalnya mengirim request, menunggu konfirmasi manual, atau melakukan proses tertunda.

:::warning Catatan
Transaksi akan menggunakan koneksi database sampai commit atau rollback selesai. Hindari operasi berdurasi panjang di cabang `Jalankan`, dan letakkan hanya pembacaan, penulisan, serta pemeriksaan data yang diperlukan.
:::

### Transaksi Bertingkat

Node transaksi dapat digunakan secara bertingkat, tetapi perlu memperhatikan cakupan sumber data:

- Jika transaksi dalam dan luar menggunakan sumber data yang sama, transaksi dalam dibuat dalam cakupan transaksi luar dan diproses sesuai kemampuan database dan Sequelize.
- Jika transaksi dalam menggunakan sumber data yang berbeda, transaksi luar tidak digunakan kembali. Sistem akan membuat transaksi independen untuk sumber data tersebut.
- Jika workflow dipicu oleh event tabel data sinkron, trigger itu sendiri mungkin sudah menyediakan transaksi tingkat atas untuk sumber data yang sama. Node transaksi akan memprioritaskan penggunaan transaksi luar dari sumber data yang sama, dan tidak akan menggunakan transaksi dari sumber data berbeda.

Transaksi bertingkat meningkatkan biaya pemahaman dan troubleshooting. Umumnya gunakan transaksi bertingkat hanya saat benar-benar membutuhkan batas rollback lokal. Jika tidak, lebih baik gunakan satu Node transaksi untuk membungkus seluruh proses data.

### Skenario Umum

Alur umum adalah sebagai berikut:

1. Query atau buat data terkait di cabang `Jalankan`.
2. Lanjutkan memperbarui stok, status, detail, dan data lain dari sumber data yang sama di cabang `Jalankan`.
3. Jika semuanya berhasil, transaksi otomatis di-commit.
4. Jika ada Node yang gagal atau error, transaksi otomatis di-rollback dan workflow masuk ke cabang `Setelah rollback`.
5. Di cabang `Setelah rollback`, catat alasan kegagalan, kirim notifikasi, atau jalankan logika kompensasi.

Jika perlu melanjutkan alur setelah rollback, aktifkan "Lanjutkan workflow setelah rollback".
