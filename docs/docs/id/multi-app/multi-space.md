---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multi-ruang

## Pendahuluan

Plugin **Multi-ruang** memungkinkan pembuatan beberapa ruang data independen melalui isolasi logis dalam satu instance aplikasi.

#### Kasus Penggunaan
- **Beberapa Toko atau Pabrik**: Proses bisnis dan konfigurasi sistem sangat konsisten, seperti manajemen inventaris terpadu, perencanaan produksi, strategi penjualan, dan templat laporan, tetapi perlu dipastikan bahwa data setiap unit bisnis tidak saling mengganggu.
- **Manajemen Multi-organisasi atau Anak Perusahaan**: Beberapa organisasi atau anak perusahaan di bawah satu grup perusahaan berbagi platform yang sama, tetapi setiap merek memiliki data pelanggan, produk, dan pesanan yang independen.

## Instalasi

Di manajemen plugin, temukan plugin **Multi-ruang** dan aktifkan.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Panduan Pengguna

### Manajemen Multi-ruang

Setelah mengaktifkan plugin, buka halaman pengaturan **"Pengguna & Izin"** dan beralih ke panel **Ruang** untuk mengelola ruang.

> Secara default, akan ada **Ruang Tidak Terkait (Unassigned Space)** bawaan, yang utamanya digunakan untuk melihat data lama yang belum terhubung dengan ruang mana pun.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Membuat Ruang

Klik tombol "Tambah ruang" untuk membuat ruang baru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Menetapkan Pengguna

Setelah memilih ruang yang telah dibuat, Anda dapat mengatur pengguna yang termasuk dalam ruang tersebut di sisi kanan:

> **Tips:** Setelah menetapkan pengguna ke ruang, Anda perlu **memuat ulang halaman secara manual** agar daftar pengalihan ruang di pojok kanan atas diperbarui dan menampilkan ruang terbaru.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Mengalihkan dan Melihat Multi-ruang

Anda dapat mengalihkan ruang saat ini di pojok kanan atas.
Saat Anda mengklik **ikon mata** di sisi kanan (dalam kondisi disorot), Anda dapat melihat data dari beberapa ruang secara bersamaan.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Manajemen Data Multi-ruang

Setelah mengaktifkan plugin, sistem akan secara otomatis menambahkan **kolom Ruang** saat membuat **koleksi**.
**Hanya koleksi yang berisi kolom ini yang akan disertakan dalam logika manajemen ruang.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Untuk **koleksi** yang sudah ada, Anda dapat menambahkan kolom Ruang secara manual untuk mengaktifkan manajemen ruang:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logika Default

Dalam **koleksi** yang berisi kolom Ruang, sistem akan secara otomatis menerapkan logika berikut:

1. Saat membuat data, data akan secara otomatis terhubung dengan ruang yang sedang dipilih;
2. Saat memfilter data, data akan secara otomatis dibatasi pada data dari ruang yang sedang dipilih.

### Mengklasifikasikan Data Lama ke dalam Multi-ruang

Untuk data yang sudah ada sebelum plugin Multi-ruang diaktifkan, Anda dapat mengklasifikasikannya ke dalam ruang melalui langkah-langkah berikut:

#### 1. Menambahkan kolom Ruang

Tambahkan kolom Ruang secara manual ke **koleksi** lama:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Menetapkan pengguna ke Ruang Tidak Terkait

Hubungkan pengguna yang mengelola data lama ke semua ruang, termasuk **Ruang Tidak Terkait (Unassigned Space)**, untuk melihat data yang belum ditetapkan ke ruang mana pun:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Beralih untuk melihat semua data ruang

Di bagian atas, pilih untuk melihat data dari semua ruang:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Mengonfigurasi halaman untuk penetapan data lama

Buat halaman baru untuk penetapan data lama. Tampilkan "kolom Ruang" di **halaman daftar** dan **halaman edit** agar dapat menyesuaikan penetapan ruang secara manual.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Jadikan kolom Ruang dapat diedit

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Menetapkan ruang data secara manual

Melalui halaman yang dibuat di atas, edit data secara manual untuk secara bertahap menetapkan ruang yang benar ke data lama (Anda juga dapat mengonfigurasi pengeditan massal sendiri).