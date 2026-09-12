---
pkg: "@nocobase/plugin-ai"
title: "Pencarian Web Karyawan AI"
description: "Pencarian web melengkapi informasi terbaru di luar data pelatihan model, tergantung pada apakah model mendukung Web Search, aktifkan/nonaktifkan di area input dialog."
keywords: "Pencarian Web,Web Search,Retrieval AI,NocoBase"
---

# Pencarian Web

Pencarian web digunakan untuk melengkapi informasi terbaru di luar data pelatihan model.

## Cara Kerja

Apakah pencarian web tersedia, tergantung pada apakah layanan model yang dipilih dalam sesi saat ini mendukung Web Search.

- Mendukung: Menampilkan switch pencarian web, dapat diaktifkan/dinonaktifkan sesuai kebutuhan.
- Tidak mendukung: Switch ini tidak ditampilkan, dan akan secara otomatis menonaktifkan status pencarian.

## Penggunaan dalam Sesi

Gunakan switch pencarian web di area input dialog:

- Setelah dibuka, AI akan memperhalus kata kunci berdasarkan konteks, kemudian memanggil tool untuk pencarian, akhirnya menggabungkan hasil pencarian untuk membalas.

![20260420155024](https://static-docs.nocobase.com/20260420155024.png)

- Setelah ditutup, AI hanya menjawab berdasarkan konteks yang ada.

![20260420154948](https://static-docs.nocobase.com/20260420154948.png)

## Perbedaan Platform

Kemampuan dukungan platform LLM Service yang berbeda terhadap Web Search berbeda, harap gunakan sesuai situasi aktual.

Beberapa LLM Service berikut mendukung pencarian web:

- OpenAI (perhatikan OpenAI (completions) tidak mendukung)
- Google Generative AI
- Dashscope
