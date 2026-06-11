---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Vector Store"
description: "Vector Store adalah pengikatan Embedding model dan vector database, digunakan untuk vektorisasi dan retrieval dokumen. Konfigurasi Vector store, LLM service, Embedding model."
keywords: "Vector Store,Embedding model,Vector Database,NocoBase"
---

# Vector Store

## Pengantar

Pada Basis Pengetahuan, saat menyimpan dokumen melakukan vektorisasi terhadap dokumen, saat me-retrieve dokumen melakukan vektorisasi terhadap kata pencarian, semua perlu menggunakan `Embedding model` untuk memproses vektorisasi terhadap teks asli.

Pada Plugin Basis Pengetahuan AI, Vector Store adalah pengikatan `Embedding model` dan vector database.

## Manajemen Vector Store

Masuk ke halaman konfigurasi Plugin Karyawan AI, klik tab `Vector store`, pilih `Vector store` masuk ke halaman manajemen Vector Store.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klik tombol `Add new` di pojok kanan atas untuk menambah Vector Store baru:

- Pada kotak input `Name` masukkan nama Vector Store;
- Pada `Vector store` pilih vector database yang sudah dikonfigurasi, rujuk: [Vector Database](/ai-employees/knowledge-base/vector-database);
- Pada `LLM service` pilih LLM Service yang sudah dikonfigurasi, rujuk: [Manajemen LLM Service](/ai-employees/features/llm-service);
- Pada kotak input `Embedding model` masukkan nama model `Embedding` yang akan digunakan;
  
Klik tombol `Submit` untuk menyimpan informasi Vector Store.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)
