---
title: "Manajemen Publikasi"
description: "Skill Manajemen Publikasi digunakan untuk menjalankan operasi publikasi yang dapat diaudit di antara beberapa lingkungan."
keywords: "Pembangunan AI,Manajemen Publikasi,Publikasi Lintas Lingkungan,Backup Recovery,Migrasi"
---

# Manajemen Publikasi

:::tip Prasyarat

- Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).
- Harus mendapatkan otorisasi versi profesional atau yang lebih tinggi [NocoBase Versi Komersial](https://www.nocobase.com/cn/commercial).
- Pastikan Plugin manajemen backup dan manajemen migrasi diaktifkan dan diupgrade ke versi terbaru.

:::

:::warning Perhatian
CLI terkait manajemen publikasi masih dalam pengembangan berkelanjutan, sementara belum mendukung penggunaan.
:::
## Pengantar

Skill Manajemen Publikasi digunakan untuk menjalankan operasi publikasi di antara beberapa lingkungan — mendukung dua metode publikasi: backup recovery dan migrasi.


## Cakupan Kemampuan

- Backup restore lingkungan tunggal: menggunakan paket backup untuk restore penuh data lokal.
- Backup restore lintas lingkungan: menggunakan paket backup untuk restore penuh data lingkungan target.
- Migrasi lintas lingkungan: menggunakan paket migrasi baru untuk update diferensial data lingkungan target.

## Contoh Prompt

### Skenario A: Backup Restore Lingkungan Tunggal
:::tip Prasyarat

Lingkungan saat ini perlu memiliki paket backup atau backup terlebih dahulu sebelum restore

:::

Mode Prompt
```
Gunakan <file-name> untuk backup restore
```
Mode Baris Perintah
```
// Lihat paket backup yang tersedia, jika tidak ada paket backup, jalankan nb backup <file-name> 
nb backup list 
nb restore <file-name> 
```
![Backup Restore](https://static-docs.nocobase.com/20260417150854.png)

### Skenario B: Backup Restore Lintas Lingkungan

:::tip Prasyarat

Perlu menyiapkan dua lingkungan, misalnya satu lingkungan dev lokal dan satu lingkungan test remote, atau memasang dua lingkungan secara lokal.

:::

Mode Prompt
```
Restore dev ke test 
```
Mode Baris Perintah
```
// Lihat paket backup yang tersedia, jika tidak ada paket backup, jalankan nb backup <file-name> --env dev
nb backup list --env dev
// Gunakan paket backup untuk restore
nb restore <file-name> --env test
```
![Backup Restore](https://static-docs.nocobase.com/20260417150854.png)

### Skenario C: Migrasi Lintas Lingkungan

:::tip Prasyarat

Mirip dengan Skenario B, perlu menyiapkan dua lingkungan, misalnya satu lingkungan dev lokal dan satu lingkungan test remote, atau memasang dua lingkungan secara lokal.

:::

Mode Prompt
```
Migrasi dev ke test 
```
Mode Baris Perintah
```
// Buat aturan migrasi baru, akan menghasilkan ruleId baru atau nb migration rule list --env dev untuk mendapatkan ruleId history 
nb migration rule add --env dev 
// Gunakan ruleId untuk menghasilkan paket migrasi
nb migration generate <ruleId> --env dev 
// Gunakan paket migrasi untuk migrasi
nb migration run <file-name> --env test
```
![Publikasi Migrasi](https://static-docs.nocobase.com/20260417151022.png)

## Pertanyaan Umum

**Memilih backup recovery atau migrasi?**

Jika Anda sudah memiliki paket backup yang tersedia, pilih backup restore. Jika Anda perlu mengontrol data mana yang disinkronkan berdasarkan strategi (misalnya hanya menyinkronkan struktur tanpa data), pilih migrasi.

**Apa masalahnya jika tidak ada Plugin migrasi?**

Plugin manajemen migrasi memerlukan versi profesional atau lebih tinggi, lihat detail di [NocoBase Versi Komersial](https://www.nocobase.com/cn/commercial).

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [Manajemen Lingkungan](./env-bootstrap) — Pemeriksaan lingkungan, instalasi deployment, dan diagnostik masalah
