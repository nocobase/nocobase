---
pkg: "@nocobase/plugin-multi-space"
title: "Multi-Space NocoBase"
description: "Plugin Multi-Space: isolasi logis pada single instance, isolasi data multi-store/multi-organization, space field, alokasi user, switch space, klasifikasi data lama, plugin professional."
keywords: "multi-space,Multi Space,isolasi space,multi-store,multi-organization,space field,isolasi data,NocoBase"
---
# Multi-Space

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## Pengantar

**Plugin Multi-Space** memungkinkan beberapa data space independen melalui isolasi logis dalam satu instance aplikasi.

#### Skenario Penggunaan
- **Multi-store atau multi-factory**: Proses bisnis dan konfigurasi sistem sangat konsisten, contohnya manajemen inventory, perencanaan produksi, strategi penjualan, dan template laporan terpadu, tetapi perlu memastikan data setiap unit bisnis tidak saling mengganggu.
- **Manajemen multi-organization atau anak perusahaan**: Beberapa organisasi atau anak perusahaan di bawah grup berbagi platform yang sama, tetapi setiap brand memiliki data customer, produk, dan order independen.


## Instalasi

Cari plugin **Multi-Space** di plugin manager, dan aktifkan.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Manual Penggunaan

### Manajemen Multi-Space

Setelah plugin diaktifkan, masuk ke halaman setting **"Users & Permissions"**, beralih ke panel **Space** untuk mengelola space.

> Pada status awal akan ada **Unassigned Space** built-in, terutama digunakan untuk melihat data lama yang belum terkait dengan space.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Membuat Space

Klik tombol "Add space" untuk membuat space baru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Alokasi User

Setelah memilih space yang dibuat, Anda dapat mengatur user yang termasuk dalam space tersebut di sebelah kanan:

> **Tips:** Setelah space mengalokasikan user, perlu **refresh halaman secara manual**, list switch space di kanan atas baru akan menampilkan space terbaru.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Switch dan Lihat Multi-Space

Anda dapat beralih space saat ini di kanan atas.
Saat mengklik **icon mata** di sebelah kanan (status highlighted), Anda dapat melihat data dari beberapa space sekaligus.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Manajemen Data Multi-Space

1. Untuk tabel data yang **tidak berisi space field**, sistem tidak akan menerapkan logika terkait space.
2. Untuk tabel data yang **berisi space field**, sistem akan secara otomatis mengaktifkan aturan berikut:
   1. Saat membuat data, secara otomatis terkait dengan space yang dipilih saat ini;
   2. Saat query atau filter data, hanya mengembalikan data dalam space yang dipilih saat ini.

Setelah plugin diaktifkan, saat membuat tabel data (Collection) sistem akan secara otomatis menyiapkan **space field**.
**Hanya tabel yang berisi field tersebut yang akan dimasukkan dalam logika manajemen space**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Untuk tabel data yang sudah ada, Anda dapat menambahkan space field secara manual untuk mengaktifkan manajemen space:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)


### Klasifikasi Multi-Space untuk Data Lama

Untuk data yang sudah ada sebelum plugin multi-space diaktifkan (default tidak terpengaruh logika space), klasifikasi space dapat dilakukan dengan langkah-langkah berikut:

#### 1. Tambah Space Field

Tambahkan space field secara manual untuk tabel lama:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Alokasi User ke Unassigned Space

Kaitkan user yang mengelola data lama ke semua space, perlu termasuk **Unassigned Space** untuk dapat melihat data yang belum termasuk dalam space:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Switch untuk Lihat Data Semua Space

Klik di bagian atas untuk melihat data dari semua space:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurasi Halaman Alokasi Data Lama

Buat halaman baru untuk alokasi data lama, tampilkan "space field" di **list page** dan **edit page**, untuk dapat menyesuaikan space yang dimiliki secara manual.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Sesuaikan space field menjadi dapat diedit

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Alokasi Data Space Secara Manual

Melalui halaman di atas, edit data secara manual, secara bertahap alokasikan space yang benar untuk data lama (Anda juga dapat mengkonfigurasi batch edit sendiri).
