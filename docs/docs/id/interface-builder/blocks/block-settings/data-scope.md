---
title: "Cakupan Data"
description: "Konfigurasi Block: mengkonfigurasi cakupan data, mendukung kondisi filter, filter izin, mengontrol cakupan data yang ditampilkan Block."
keywords: "cakupan data, filter data, filter izin, konfigurasi Block, interface builder, NocoBase"
---

# Atur Cakupan Data

## Pengantar

Mengatur cakupan data adalah mendefinisikan kondisi filter default untuk Data Block. Pengguna dapat menyesuaikan cakupan data secara fleksibel berdasarkan kebutuhan bisnis, tetapi terlepas dari operasi filter apa pun, sistem akan otomatis menerapkan kondisi filter default ini, memastikan data selalu sesuai dengan batasan cakupan yang ditentukan.

## Panduan Penggunaan

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

Field filter mendukung pemilihan Field Table ini, Field Table relasi.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Operator

Tipe Field yang berbeda mendukung operator yang berbeda. Misalnya Field teks mendukung operator seperti equal, not equal, contains, dll. Field number mendukung operator seperti greater than, less than, dll. Field tanggal mendukung operator seperti dalam range, sebelum tanggal tertentu, dll.

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Nilai Statis

Contoh: Filter data berdasarkan "status" pesanan.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Nilai Variabel

Contoh: Filter data pesanan pengguna saat ini.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables)
