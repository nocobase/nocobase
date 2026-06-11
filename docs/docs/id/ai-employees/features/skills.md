---
pkg: '@nocobase/plugin-ai'
title: 'Karyawan AI Menggunakan Skills'
description: 'Skills adalah panduan pengetahuan domain profesional Karyawan AI: General skills, Employee-specific skills.'
keywords: 'Skills Karyawan AI,Skills,NocoBase'
---

# Menggunakan Skills

Skills adalah panduan pengetahuan domain profesional yang diberikan kepada Karyawan AI, memandu Karyawan AI menggunakan beberapa tools untuk memproses tugas domain profesional.

Saat ini Skills tidak mendukung kustomisasi, hanya disediakan oleh sistem secara preset.

## Struktur Skills

Halaman Skills dibagi menjadi dua kategori:

1. `General skills`: Dibagikan oleh semua Karyawan AI, biasanya read-only.
2. `Employee-specific skills`: Eksklusif untuk karyawan saat ini.

![](https://static-docs.nocobase.com/202604230832639.png)

## Pengantar Skills

### Skills Umum

| Nama Skills | Deskripsi Fungsi |
| ----------- | ---------------- |
| Data metadata | Mendapatkan model data sistem, tabel data, informasi Field, dan metadata lainnya, membantu Karyawan AI memahami konteks bisnis. |
| Data query | Query data dalam tabel data, mendukung filter kondisi, query agregasi, dan fungsi lainnya, membantu Karyawan AI mendapatkan data bisnis. |
| Business analysis report | Menghasilkan laporan analisis berdasarkan data bisnis, mendukung analisis multi-dimensi dan visualisasi, membantu Karyawan AI melakukan insight bisnis. |
| Document search | Mencari dan membaca konten dokumen yang sudah dipreset, membantu Karyawan AI menyelesaikan pekerjaan berbasis dokumen, saat ini terutama menulis kode JS. |

### Skills Eksklusif

| Nama Skills | Deskripsi Fungsi | Karyawan |
| ----------- | ---------------- | -------- |
| Data modeling | Skills pemodelan data, memahami dan membangun model data bisnis | Orin |
| Frontend developer | Menulis dan menguji kode JS Block frontend | Nathan |
