---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "RAG Retrieval Augmented Generation"
description: "Pada pengaturan Karyawan AI aktifkan RAG, konfigurasi Knowledge Base Prompt, pemilihan Basis Pengetahuan, Top K, threshold Score, AI membalas berdasarkan dokumen retrieval."
keywords: "RAG,Retrieval Augmented,Retrieval Basis Pengetahuan,Top K,NocoBase"
---

# Retrieval RAG

## Pengantar

Setelah mengonfigurasi Basis Pengetahuan, dapat mengaktifkan fungsi RAG di pengaturan Karyawan AI.

Setelah RAG diaktifkan, saat Pengguna berdialog dengan Karyawan AI, Karyawan AI akan menggunakan retrieval RAG, menggunakan pesan Pengguna untuk mendapatkan dokumen dari Basis Pengetahuan dan membalas berdasarkan dokumen yang ditemukan.

## Mengaktifkan RAG

Masuk ke halaman konfigurasi Plugin Karyawan AI, klik tab `AI employees`, masuk ke halaman manajemen Karyawan AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Pilih Karyawan AI yang akan diaktifkan RAG, klik tombol `Edit`, masuk ke halaman edit Karyawan AI.

Pada tab `Knowledge base`, buka switch `Enable`.

- Pada `Knowledge Base Prompt` masukkan prompt referensi Basis Pengetahuan, `{knowledgeBaseData}` adalah placeholder tetap, jangan dimodifikasi;
- Pada `Knowledge Base` pilih Basis Pengetahuan yang sudah dikonfigurasi, rujuk: [Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base);
- Pada kotak input `Top K` masukkan jumlah dokumen yang akan di-retrieve, default 3;
- Pada kotak input `Score` threshold relevansi dokumen saat retrieval;

Klik tombol `Submit` untuk menyimpan pengaturan Karyawan AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)
