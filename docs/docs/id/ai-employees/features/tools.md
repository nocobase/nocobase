---
pkg: '@nocobase/plugin-ai'
title: 'Karyawan AI Menggunakan Tools'
description: 'Tools mendefinisikan kemampuan Karyawan AI: General tools, Employee-specific tools, Custom tools, konfigurasi Permission Skills Ask/Allow.'
keywords: 'Tools Karyawan AI,Tools,Ask,Allow,Permission Skills,NocoBase'
---

# Menggunakan Tools

Tools mendefinisikan "apa yang dapat dilakukan" Karyawan AI.

## Struktur Tools

Halaman Tools dibagi menjadi tiga kategori:

1. `General tools`: Dibagikan oleh semua Karyawan AI, biasanya read-only.
2. `Employee-specific tools`: Eksklusif untuk karyawan saat ini.
3. `Custom tools`: Tools kustom yang dipicu melalui Workflow "AI employee event" trigger, dapat ditambah/dihapus dan dikonfigurasi Permission default.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Permission Tools

Permission tools terpadu sebagai:

- `Ask`: Tanya konfirmasi sebelum dipanggil.
- `Allow`: Mengizinkan pemanggilan langsung.

Saran: Tools yang melibatkan modifikasi data secara default menggunakan `Ask`.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Pengantar Tools

### Tools Umum

| Nama Tool | Deskripsi Fungsi |
| --------- | ---------------- |
| Form filler | Mengisi data ke formulir tertentu |
| Chart generator | Menghasilkan konfigurasi JSON grafik ECharts |
| Load specific SKILLS | Memuat Skills dan tools yang dibutuhkan Skills |
| Suggestions | Memberikan saran tindakan selanjutnya berdasarkan konten dialog dan konteks saat ini |

### Tools Eksklusif

| Nama Tool | Deskripsi Fungsi | Karyawan |
| --------- | ---------------- | -------- |
| AI employee task dispatching | Tool penjadwalan kerja, menugaskan tugas berdasarkan tipe tugas dan kemampuan karyawan | Atlas |
| List AI employees | Mencantumkan semua karyawan yang tersedia | Atlas |
| Get AI employee | Mendapatkan informasi detail karyawan tertentu, termasuk Skills dan tools | Atlas |

### Tools Kustom

Pada modul Workflow buat Workflow dengan tipe trigger `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Pada `Custom tools` klik `Add tool` untuk menambahkan Workflow sebagai tool yang akan digunakan, dan konfigurasikan Permission berdasarkan risiko bisnis.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
