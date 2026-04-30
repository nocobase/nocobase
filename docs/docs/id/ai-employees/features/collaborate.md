---
pkg: "@nocobase/plugin-ai"
title: "Berkolaborasi dengan Karyawan AI"
description: "Berkolaborasi dengan Karyawan AI: entry utama pojok kanan bawah, entry Action Block, operasi dialog, ganti karyawan dan model dalam sesi (AI Employee Switcher, Model Switcher)."
keywords: "Kolaborasi Karyawan AI,Panel Dialog,Ganti Karyawan,Ganti Model,NocoBase"
---

# Berkolaborasi dengan Karyawan AI

Setelah membuat dan mengaktifkan Karyawan AI, dapat berkolaborasi dengannya di halaman.

## Entry

Entry yang umum ada dua jenis:

1. **Entry utama pojok kanan bawah**: Memunculkan panel dialog AI di pojok kanan bawah halaman bisnis, cocok untuk Q&A umum dan kolaborasi lintas Block.
2. **Entry Action Block**: Pada Block yang mendukung `Actions`, masuk melalui `Actions -> AI employees`, cocok untuk menjalankan tugas terhadap Block saat ini (misalnya skenario JSBlock).

### Entry Utama Pojok Kanan Bawah

![20260331165456](https://static-docs.nocobase.com/20260331165456.png)

### Entry Action Block

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

## Operasi Dasar Dialog

Kotak dialog mendukung operasi umum seperti mengirim pesan, mengunggah attachment, melihat sesi history, membuat sesi baru, dan mengedit prompt sistem.

## Beralih dalam Sesi

Sebagian besar kasus langsung berdialog dengan Atlas saja, ia akan mengoordinasikan Karyawan AI yang sesuai untuk membantu menangani masalah.

Jika ingin menggunakan Karyawan AI tertentu, dapat klik daftar dropdown Karyawan AI di kotak kirim untuk memilih

![20260331174320](https://static-docs.nocobase.com/20260331174320.png)

Model akan menyimpan preferensi berdasarkan dimensi karyawan, akan diprioritaskan untuk dipulihkan saat masuk berikutnya.

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)
