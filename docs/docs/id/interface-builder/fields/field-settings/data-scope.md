---
title: "Cakupan Data Field"
description: "Konfigurasi Field: mengkonfigurasi cakupan data Field relasi, filter data yang tersedia, mendukung filter izin."
keywords: "cakupan data, data scope, filter relasi, konfigurasi Field, interface builder, NocoBase"
---

# Atur Cakupan Data

## Pengantar

Pengaturan cakupan data Field relasi mirip dengan pengaturan cakupan data Block, menetapkan kondisi filter default untuk data relasi.

## Petunjuk Penggunaan

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Nilai Statis

Contoh: Hanya produk yang belum dihapus yang dapat dipilih untuk diasosiasikan.

> Daftar Field adalah Field Table target Field relasi

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Nilai Variabel

Contoh: Hanya produk dengan tanggal layanan lebih dari tanggal pesanan yang dapat dipilih untuk diasosiasikan.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables)

### Linkage Field Relasi

Field relasi melakukan linkage melalui pengaturan cakupan data.

Contoh: Di Table pesanan terdapat Field relasi one-to-many "Produk Peluang" dan Field relasi many-to-one "Peluang". Produk Peluang memiliki Field relasi many-to-one "Peluang". Di Block Form pesanan, data yang tersedia untuk Produk Peluang adalah produk peluang yang terkait dengan peluang yang dipilih di Form saat ini.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)
