---
title: "Wajib Diisi"
description: "Konfigurasi Field: mengkonfigurasi Field wajib diisi, validasi non-empty saat submit, mendukung prompt error kustom."
keywords: "wajib diisi, required, validasi Field, validasi Form, interface builder, NocoBase"
---

# Wajib Diisi

## Pengantar

Wajib diisi adalah aturan validasi Form yang umum. Anda dapat langsung mengaktifkan wajib diisi di item konfigurasi Field, atau dapat secara dinamis mengatur Field wajib diisi melalui aturan linkage Form.

## Di Mana Dapat Mengatur Field Wajib Diisi

### Pengaturan Field Collection

Saat wajib diisi diatur di Field Collection, akan memicu validasi backend. Frontend juga secara default ditampilkan sebagai wajib diisi (tidak dapat dimodifikasi).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Pengaturan Field

Langsung mengatur Field sebagai wajib diisi, cocok untuk Field yang selalu memerlukan input pengguna, seperti username, password, dll.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Aturan Linkage

Mengatur wajib diisi sesuai kondisi melalui aturan linkage Field di Block Form.

Contoh: Saat tanggal pesanan tidak kosong, nomor pesanan wajib diisi.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Event Flow
