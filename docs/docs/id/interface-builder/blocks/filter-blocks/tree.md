---
title: "Tree Filter Block"
description: "Tree Filter Block: menampilkan kondisi filter dalam struktur tree, melakukan filter hierarki pada Data Block, cocok untuk skenario filter linkage data tree."
keywords: "Tree Filter, TreeFilter, filter tree, filter hierarki, refresh linkage, interface builder, NocoBase"
---

# Tree Filter

## Pengantar

Block Tree Filter menyediakan kemampuan filter data melalui struktur tree, cocok untuk skenario data dengan hubungan hierarki, seperti kategori produk, struktur organisasi, dll.
Pengguna dapat memilih node level yang berbeda untuk melakukan filter linkage pada Data Block yang terkait.

## Cara Penggunaan

Block Tree Filter perlu digunakan bersama dengan Data Block, untuk memberikan kemampuan filter padanya.

Langkah konfigurasi adalah sebagai berikut:

1. Aktifkan mode konfigurasi, tambahkan Block "Tree Filter" dan Data Block (seperti "Block Table") di Page.
2. Konfigurasi Block Tree Filter, pilih Collection tipe tree (seperti Table kategori produk).
3. Atur hubungan koneksi antara Block Tree Filter dan Data Block.
4. Setelah konfigurasi selesai, klik node tree untuk memfilter Data Block.

## Tambah Block

Dalam mode konfigurasi, klik tombol "Tambah Block" di Page, di kategori "Filter Block" pilih "Tree" untuk menyelesaikan penambahan.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Konfigurasi Block

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Hubungkan Data Block

Block Tree Filter harus terhubung ke Data Block agar berlaku.
Melalui konfigurasi "Hubungkan Data Block", Anda dapat membangun hubungan linkage antara Tree Filter dan Block Table, List, Chart, dll. di Page, sehingga mengimplementasikan fungsi filter.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Field Judul

Digunakan untuk menentukan Field yang ditampilkan di node tree (yaitu nama node).

### Pencarian

Setelah diaktifkan, mendukung pencarian dan pencarian node tree dengan cepat melalui keyword, meningkatkan efisiensi pencarian.

### Expand Semua

Mengontrol apakah secara default expand semua node tree saat Page dimuat pertama kali.

### Filter Sub-Node

Setelah diaktifkan, saat memilih suatu node, akan termasuk semua sub-node-nya untuk filter.
Cocok untuk skenario di mana perlu melihat semua data sub-level berdasarkan kategori parent.
