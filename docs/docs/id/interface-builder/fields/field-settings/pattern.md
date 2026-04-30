---
title: "Mode Tampilan"
description: "Konfigurasi Field: mengkonfigurasi mode tampilan Field, mendukung peralihan mode editable, read-only, hidden, dll."
keywords: "mode tampilan, pattern, read-only, editable, interface builder, NocoBase"
---

# Mode Tampilan

## Pengantar

Berbeda dengan Block, komponen Field memiliki tiga mode tampilan (hanya mendukung Field di Form). Saat berpindah ke mode tampilan yang berbeda, item konfigurasi Field yang sesuai akan berbeda.

- Editable;
- Read-only (tidak editable);
- Read-only (mode baca);

### Mode Tampilan Field Biasa

![20251028220145](https://static-docs.nocobase.com/20251028220145.png)

- Status disabled

![20251028220211](https://static-docs.nocobase.com/20251028220211.png)

- Status mode baca

![20251028220250](https://static-docs.nocobase.com/20251028220250.png)

### Mode Tampilan Field Relasi

**Mode tampilan Field relasi** menentukan cara Field tersebut ditampilkan di antarmuka, dan menentukan tipe komponen Field yang dapat dipilih.

Dalam **status editable**, Field relasi mendukung berbagai bentuk komponen. Pengguna dapat memilih komponen Field relasi yang berbeda berdasarkan kebutuhan bisnis untuk menampilkan atau memilih data terkait.

#### Komponen Field Relasi dalam Status Editable

![20251028220447](https://static-docs.nocobase.com/20251028220447.png)

Dalam status ini, pengguna dapat dengan fleksibel memilih cara tampilan yang sesuai untuk lebih efisien menangani data.

#### Komponen Field Relasi dalam Status Mode Baca

Saat berpindah ke **status mode baca**, sistem akan secara default menggunakan **komponen Field judul** untuk menampilkan data terkait. Cocok untuk skenario di mana hanya perlu melihat data tanpa modifikasi.

![20251028220854](https://static-docs.nocobase.com/20251028220854.gif)


![20251028221451](https://static-docs.nocobase.com/20251028221451.png)
