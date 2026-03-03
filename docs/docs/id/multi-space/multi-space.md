---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/multi-space/multi-space).
:::

# Multi-ruang

## Pengantar

**Plugin Multi-space** memungkinkan pembuatan beberapa ruang data independen dalam satu instans aplikasi melalui isolasi logika.

#### Skenario Penggunaan
- **Multi-toko atau pabrik**: Proses bisnis dan konfigurasi sistem sangat konsisten—seperti manajemen inventaris terpadu, perencanaan produksi, strategi penjualan, dan templat laporan—tetapi data untuk setiap unit bisnis harus tetap independen dan tidak saling mengganggu.
- **Manajemen multi-organisasi atau anak perusahaan**: Beberapa organisasi atau anak perusahaan di bawah satu grup perusahaan berbagi platform yang sama, tetapi setiap merek memiliki data pelanggan, produk, dan pesanan yang independen.

## Instalasi

Temukan plugin **Multi-space** di Manajer Plugin dan aktifkan.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Panduan Pengguna

### Manajemen Multi-ruang

Setelah mengaktifkan plugin, buka halaman pengaturan **「Pengguna & Izin」** dan beralih ke panel **Ruang** untuk mengelola ruang.

> Secara default, terdapat **Ruang Belum Dialokasikan (Unassigned Space)** bawaan, yang terutama digunakan untuk melihat data lama yang belum dikaitkan dengan ruang tertentu.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Membuat Ruang

Klik tombol 「Tambah ruang」 untuk membuat ruang baru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Mengalokasikan Pengguna

Setelah memilih ruang yang telah dibuat, Anda dapat mengatur pengguna yang termasuk dalam ruang tersebut di sisi kanan:

> **Tip:** Setelah mengalokasikan pengguna ke ruang, Anda harus **menyegarkan halaman secara manual** agar daftar pengalih ruang di sudut kanan atas diperbarui dan menampilkan ruang terbaru.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Beralih dan Melihat Multi-ruang

Anda dapat beralih ruang saat ini di sudut kanan atas.  
Saat Anda mengklik **ikon mata** di sebelah kanan (dalam status sorot), Anda dapat melihat data dari beberapa ruang secara bersamaan.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Manajemen Data Multi-ruang

Setelah plugin diaktifkan, sistem akan secara otomatis menyediakan **bidang ruang** saat membuat tabel data (**koleksi**).  
**Hanya tabel yang berisi bidang ini yang akan disertakan dalam logika manajemen ruang.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Untuk tabel data yang sudah ada, Anda dapat menambahkan bidang ruang secara manual untuk mengaktifkan manajemen ruang:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logika Default

Pada tabel data yang menyertakan bidang ruang, sistem secara otomatis menerapkan logika berikut:

1. Saat membuat data, data akan secara otomatis dikaitkan dengan ruang yang dipilih saat ini;
2. Saat memfilter data, data akan secara otomatis dibatasi pada data dari ruang yang dipilih saat ini.

### Kategorisasi Multi-ruang untuk Data Lama

Untuk data yang sudah ada sebelum mengaktifkan plugin Multi-space, Anda dapat melakukan kategorisasi ruang melalui langkah-langkah berikut:

#### 1. Tambahkan Bidang Ruang

Tambahkan bidang ruang secara manual ke tabel lama:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Alokasikan Pengguna ke Ruang Belum Dialokasikan

Kaitkan pengguna yang mengelola data lama dengan semua ruang, termasuk **Ruang Belum Dialokasikan (Unassigned Space)**, untuk melihat data yang belum memiliki pemilik ruang:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Beralih untuk Melihat Semua Data Ruang

Klik di bagian atas untuk melihat data dari semua ruang:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurasi Halaman Alokasi Data Lama

Buat halaman baru untuk alokasi data lama. Tampilkan 「Bidang Ruang」 di **halaman daftar** dan **halaman edit** untuk menyesuaikan kepemilikan ruang secara manual.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Atur bidang ruang menjadi mode dapat diedit:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Alokasikan Ruang Data Secara Manual

Melalui halaman tersebut, edit data secara manual untuk mengalokasikan ruang yang benar bagi data lama secara bertahap (Anda juga dapat mengonfigurasi pengeditan massal sendiri).