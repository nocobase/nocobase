---
title: "Manajemen Publikasi"
description: "Skill Manajemen Publikasi digunakan untuk menjalankan operasi publikasi yang dapat diaudit di antara beberapa lingkungan, dengan dukungan pemulihan backup dan migrasi."
keywords: "Pembangunan AI,Manajemen Publikasi,Publikasi Lintas Lingkungan,Pemulihan Backup,Migrasi"
---

# Manajemen Publikasi

:::tip Prasyarat

- Sebelum membaca halaman ini, instal NocoBase CLI dan selesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md)
- Memerlukan lisensi edisi Professional atau lebih tinggi. Lihat [Edisi Komersial NocoBase](https://www.nocobase.com/cn/commercial)
- Aktifkan plugin "Manajemen Backup" dan "Manajemen Migrasi", lalu tingkatkan ke versi terbaru

:::

## Pengantar

Skill Manajemen Publikasi digunakan untuk menjalankan operasi publikasi di antara beberapa lingkungan NocoBase. Skill ini mendukung dua cara: pemulihan backup dan migrasi.

Jika Anda hanya ingin menimpa satu lingkungan sepenuhnya dengan lingkungan lain, biasanya pemulihan backup sudah cukup. Jika Anda perlu mengontrol konten yang disinkronkan berdasarkan aturan, misalnya hanya menyinkronkan struktur tanpa data bisnis, migrasi lebih sesuai.

## Cakupan Kemampuan

- Pemulihan backup satu lingkungan: memulihkan lingkungan saat ini menggunakan paket backup yang sudah ada
- Pemulihan backup instan satu lingkungan: membuat backup lingkungan saat ini terlebih dahulu, lalu memulihkan lingkungan saat ini dengan backup tersebut
- Pemulihan backup lintas lingkungan: memulihkan paket backup dari lingkungan sumber ke lingkungan target
- Migrasi lintas lingkungan: memperbarui lingkungan target secara diferensial dengan paket migrasi

## Contoh Prompt

### Skenario A: pemulihan backup satu lingkungan dengan file tertentu

:::tip Prasyarat

Di lingkungan saat ini harus sudah ada file backup dengan nama yang sama.

:::

```text
Pulihkan menggunakan backup <file-name.nbdata>
```

Skill akan menggunakan file backup bernama sama yang sudah ada di server lingkungan saat ini untuk melakukan pemulihan.

### Skenario B: pemulihan backup satu lingkungan tanpa menentukan file

```text
Lakukan backup dan pemulihan pada lingkungan saat ini
```

Skill akan membuat backup lingkungan saat ini terlebih dahulu, lalu memulihkan lingkungan saat ini dengan backup tersebut.

### Skenario C: pemulihan backup lintas lingkungan

:::tip Prasyarat

Siapkan dua lingkungan, misalnya lingkungan dev lokal dan lingkungan test jarak jauh, atau dua lingkungan lokal. Anda dapat menentukan file backup tertentu atau tidak menentukannya.

:::

```text
Pulihkan dev ke test
```

Skill akan membuat paket backup di lingkungan dev, lalu memulihkan paket backup tersebut ke lingkungan test.

### Skenario D: migrasi lintas lingkungan

:::tip Prasyarat

Seperti Skenario C, siapkan dua lingkungan. Anda dapat menentukan file migrasi tertentu atau tidak menentukannya.

:::

```text
Migrasikan dev ke test
```

Skill akan membuat paket migrasi di lingkungan dev, lalu menggunakan paket migrasi tersebut untuk memperbarui lingkungan test.

## Pertanyaan Umum

**Harus memilih pemulihan backup atau migrasi?**

Secara default, gunakan pemulihan backup, terutama jika Anda sudah memiliki paket backup yang dapat digunakan atau ingin lingkungan target sepenuhnya ditimpa dengan status lingkungan sumber. Gunakan migrasi hanya ketika Anda perlu mengontrol cakupan sinkronisasi berdasarkan aturan, misalnya hanya menyinkronkan struktur tanpa data.

**Apa artinya jika plugin migrasi tidak ada?**

Plugin Manajemen Migrasi memerlukan lisensi edisi Professional atau lebih tinggi. Lihat [Edisi Komersial NocoBase](https://www.nocobase.com/cn/commercial) untuk detail.

## Tautan Terkait

- [Gambaran Umum Pembangunan AI](./index.md) — gambaran umum dan cara instalasi semua Skill Pembangunan AI
- [Manajemen Lingkungan](./env-bootstrap) — pemeriksaan lingkungan, instalasi, deployment, dan diagnosis masalah
