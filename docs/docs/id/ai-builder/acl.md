---
title: "Konfigurasi Permission"
description: "Skill Konfigurasi Permission digunakan untuk mengelola role, kebijakan Permission, pengikatan Pengguna, dan penilaian risiko ACL NocoBase melalui bahasa natural."
keywords: "Pembangunan AI,Konfigurasi Permission,ACL,Role,Permission,Pengikatan Pengguna,Penilaian Risiko"
---

# Konfigurasi Permission

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Konfigurasi Permission digunakan untuk mengelola role, kebijakan Permission, pengikatan Pengguna, dan penilaian risiko ACL NocoBase melalui bahasa natural — Anda mendeskripsikan target bisnis, ia memilih perintah dan parameter.


## Cakupan Kemampuan

- Membuat role baru
- Mengganti mode role global (mode independen / mode gabungan)
- Mengonfigurasi Permission Action dan rentang data secara batch untuk tabel data
- Membatalkan ikatan Pengguna dengan role
- Menghasilkan laporan penilaian risiko tingkat role, tingkat Pengguna, tingkat sistem

## Contoh Prompt

### Skenario A: Mengikat Pengguna Secara Batch
:::tip Prasyarat
Lingkungan saat ini memiliki role Member dan beberapa Pengguna
:::

```
Bantu saya mengikat role Member ke beberapa Pengguna baru ini: James, Emma, Michael
```

![Mengikat Pengguna Secara Batch](https://static-docs.nocobase.com/20260422202343.png)

### Skenario B: Mengonfigurasi Permission Halaman Secara Batch
:::tip Prasyarat
Lingkungan saat ini memiliki role Member dan beberapa halaman
:::
```
Bantu saya mengonfigurasi Permission halaman-halaman ini untuk role Member: Product, Order, Stock
```

![Mengonfigurasi Permission Halaman Secara Batch](https://static-docs.nocobase.com/20260422202949.png)

### Skenario C: Mengonfigurasi Permission Multi-tabel Data Secara Batch
:::tip Prasyarat
Lingkungan saat ini memiliki role Member dan beberapa tabel data
:::

```
Tambahkan Permission read-only independen tabel data ini ke role Member: order, product, stock
```

![Mengonfigurasi Permission Independen Tabel Data Secara Batch](https://static-docs.nocobase.com/20260422205341.png)

![Mengonfigurasi Permission Independen Tabel Data Secara Batch 2](https://static-docs.nocobase.com/20260422205430.png)

### Skenario D: Konfigurasi Permission Multi-role Multi-tabel Data
:::tip Prasyarat
Lingkungan saat ini memiliki beberapa role dan beberapa tabel data
:::

```
Tambahkan Permission read-write independen tabel data ini ke role Member, Sales: order, product, stock
```

![Konfigurasi Multi-role Multi-tabel Data](https://static-docs.nocobase.com/20260422213524.png)

### Skenario E: Penilaian Risiko

```
Nilai risiko Permission role Member
```

Akan menghasilkan skor risiko, penjelasan rentang dampak, dan saran perbaikan.

## Pertanyaan Umum

**Apa yang harus dilakukan jika Permission yang dikonfigurasi tidak berlaku?**

Pertama konfirmasi apakah mode role global sudah benar — jika Pengguna memiliki beberapa role secara bersamaan, perilaku mode gabungan dan mode independen sangat berbeda, dapat melihat mode saat ini untuk mengonfirmasi masalah.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
