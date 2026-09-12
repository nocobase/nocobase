---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Ikhtisar Basis Pengetahuan AI"
description: "Basis Pengetahuan AI menyediakan kemampuan retrieval RAG untuk Karyawan AI, melalui Embedding dan vector retrieval meningkatkan akurasi dan keterlacakan jawaban, perlu mengaktifkan Plugin AI: Knowledge base."
keywords: "Basis Pengetahuan AI,RAG,Retrieval Augmented Generation,Embedding,NocoBase"
---

# Ikhtisar

## Pengantar

Plugin Basis Pengetahuan AI menyediakan kemampuan retrieval RAG untuk Karyawan AI.

Kemampuan retrieval RAG memungkinkan Karyawan AI memberikan jawaban yang lebih akurat, lebih profesional, dan lebih relevan dengan internal perusahaan saat menjawab pertanyaan Pengguna.

Melalui Basis Pengetahuan yang dipelihara administrator yang menyediakan domain profesional dan dokumen internal perusahaan, meningkatkan akurasi dan keterlacakan jawaban Karyawan AI.

### Apa itu RAG

RAG (Retrieval Augmented Generation) berarti "Retrieval-Augmentation-Generation"

- Retrieval: Pertanyaan Pengguna diubah menjadi vektor melalui model Embedding (seperti BERT), di vector database melalui dense retrieval (semantic similarity) atau sparse retrieval (keyword matching) memanggil kembali Top-K blok teks terkait.
- Augmentation: Hasil retrieval digabungkan dengan pertanyaan asli sebagai augmented Prompt, dimasukkan ke window konteks LLM.
- Generation: LLM menggabungkan augmented Prompt untuk menghasilkan jawaban akhir, memastikan faktualitas dan keterlacakan.

## Instalasi

1. Masuk ke halaman manajemen Plugin
2. Temukan Plugin `AI: Knowledge base`, dan aktifkan

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)
