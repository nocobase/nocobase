---
title: "Tinggi Block"
description: "Konfigurasi Block: mengkonfigurasi tinggi Block, mendukung mode tampilan tinggi tetap, adaptif, fullscreen."
keywords: "tinggi Block, konfigurasi Block, konfigurasi tinggi, interface builder, NocoBase"
---

# Tinggi Block

## Pengantar

Tinggi Block mendukung tiga mode: **Tinggi Default**, **Tinggi Spesifik**, **Full Height**. Sebagian besar Block mendukung pengaturan tinggi.
![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Mode Tinggi

### Tinggi Default

Strategi tinggi default berbeda untuk tipe Block yang berbeda. Misalnya Block Table dan Form akan adaptif tinggi berdasarkan konten,
tidak akan ada scrollbar di dalam Block.

### Tinggi Spesifik

Anda dapat menentukan total tinggi frame luar Block secara manual. Bagian dalam Block akan otomatis menghitung dan mendistribusikan tinggi yang tersedia.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Full Height

Mode Full Height mirip dengan Tinggi Spesifik. Tinggi Block akan dihitung berdasarkan **area visual** browser saat ini sebagai tinggi maksimum layar penuh.
Tidak ada scrollbar di halaman browser, scrollbar hanya muncul di dalam Block.

Penanganan scroll internal Block yang berbeda dalam mode Full Height sedikit berbeda:

- **Table**: scroll internal `tbody`;
- **Form / Detail**: scroll dalam Grid (konten kecuali area Action di-scroll);
- **List / Grid Card**: scroll dalam Grid (konten kecuali area Action dan bar pagination di-scroll);
- **Map / Calendar**: tinggi adaptif keseluruhan, tanpa scrollbar;
- **Iframe / Markdown**: membatasi total tinggi frame luar Block, scrollbar muncul di dalam Block.

#### Table Full Height

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Form Full Height

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)
