---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Manajemen Basis Pengetahuan AI"
description: "Basis Pengetahuan adalah dasar retrieval RAG, mengorganisir dokumen dan membangun index. Buat Basis Pengetahuan Local/Readonly/External, unggah dokumen, konfigurasi vector store dan file storage."
keywords: "Basis Pengetahuan,Basis Pengetahuan Local,RAG,Vector Store,Upload Dokumen,NocoBase"
---

# Basis Pengetahuan

## Pengantar

Basis Pengetahuan adalah dasar retrieval RAG, Basis Pengetahuan mengorganisir dokumen secara terkategori dan membangun index. Saat Karyawan AI menjawab pertanyaan, akan memprioritaskan mencari jawaban dari Basis Pengetahuan.

## Manajemen Basis Pengetahuan

Masuk ke halaman konfigurasi Plugin Karyawan AI, klik tab `Knowledge base`, masuk ke halaman manajemen Basis Pengetahuan.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klik tombol `Add new` di pojok kanan atas untuk menambah Basis Pengetahuan `Local`

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Masukkan informasi yang diperlukan untuk database baru:

- Pada kotak input `Name` masukkan nama Basis Pengetahuan;
- Pada `File storage` pilih lokasi penyimpanan file;
- Pada `Vector store` pilih vector store, rujuk [Vector Store](/ai-employees/knowledge-base/vector-store);
- Pada kotak input `Description` masukkan deskripsi Basis Pengetahuan;

Klik tombol `Submit` untuk membuat informasi vector store.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Manajemen Dokumen Basis Pengetahuan

Setelah membuat Basis Pengetahuan, di halaman daftar Basis Pengetahuan, klik Basis Pengetahuan yang baru dibuat, masuk ke halaman manajemen dokumen Basis Pengetahuan.

![20260426233838](https://static-docs.nocobase.com/20260426233838.png)

![20260426233417](https://static-docs.nocobase.com/20260426233417.png)

Klik tombol `Upload` untuk mengunggah dokumen, setelah dokumen diunggah, akan otomatis mulai vektorisasi, tunggu `Status` berubah dari `Pending` menjadi `Success`.

Saat ini Basis Pengetahuan mendukung tipe dokumen: txt, md, json, cvs, xls, xlsx, pdf, doc, docx, ppt, pptx; pdf hanya mendukung teks murni.

Jika perlu mengunggah file secara batch, dapat membuat satu paket zip, kemudian mengunggah di Basis Pengetahuan. Backend akan mengekstrak paket zip kemudian otomatis mengimpor dan memvektorisasi dokumen.

![20260426233711](https://static-docs.nocobase.com/20260426233711.png)

Jika mengunggah paket zip menemui error, memberi tahu file terlalu besar, dapat mengatur batas ukuran file unggah di modul manajemen file.

![20260426234224](https://static-docs.nocobase.com/20260426234224.png)

## Tipe Basis Pengetahuan

### Basis Pengetahuan Local

Basis Pengetahuan Local adalah Basis Pengetahuan yang disimpan secara lokal di NocoBase, dokumen, data vektor dokumen semuanya disimpan secara lokal oleh NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Basis Pengetahuan Readonly

Basis Pengetahuan Readonly adalah Basis Pengetahuan read-only, dokumen dan data vektor dipelihara secara eksternal, hanya membuat koneksi vector database di NocoBase (saat ini hanya mendukung PGVector)

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Basis Pengetahuan External

Basis Pengetahuan External adalah Basis Pengetahuan eksternal, dokumen dan data vektor dipelihara secara eksternal. Retrieval vector database perlu diperluas oleh pengembang, dapat menggunakan vector database yang saat ini tidak didukung NocoBase

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)
