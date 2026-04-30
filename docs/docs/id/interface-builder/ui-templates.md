---
pkg: "@nocobase/plugin-ui-templates"
title: "UI Template"
description: "UI Template Interface Builder: template layout dan template halaman bawaan, membuat antarmuka standar dengan cepat, mendukung ekstensi template kustom."
keywords: "UI Template, template layout, template halaman, template antarmuka, interface builder, NocoBase"
---
# UI Template

## Pengantar

Template antarmuka digunakan untuk menggunakan kembali konfigurasi dalam interface builder, mengurangi pembangunan ulang, dan menjaga sinkronisasi pembaruan beberapa konfigurasi saat diperlukan.

Tipe template yang saat ini didukung meliputi:

- Template Block: menggunakan kembali konfigurasi Block secara keseluruhan
- Template Field: menggunakan kembali konfigurasi "area Field" pada Block Form/Detail
- Template Popup: menggunakan kembali konfigurasi Popup yang dipicu oleh Action/Field

## Konsep Inti

### Reference dan Copy

Saat menggunakan template, biasanya ada dua cara:

- `Reference`: beberapa tempat berbagi konfigurasi template yang sama; jika template atau salah satu reference dimodifikasi, reference lainnya akan diperbarui secara sinkron.
- `Copy`: menyalin sebagai konfigurasi independen; modifikasi selanjutnya tidak akan saling mempengaruhi.

### Simpan sebagai Template

Ketika Block/Popup tertentu sudah dikonfigurasi, Anda dapat menggunakan `Simpan sebagai template` di menu pengaturannya, dan memilih cara penyimpanan:

- `Konversi ... saat ini menjadi template`: setelah disimpan, posisi saat ini akan beralih menjadi reference template.
- `Salin ... saat ini menjadi template`: hanya membuat template, posisi saat ini tidak berubah.

## Template Block

### Simpan Block sebagai Template

1) Buka menu pengaturan Block target, klik `Simpan sebagai template`
2) Isi `Nama Template` / `Deskripsi Template`, dan pilih mode penyimpanan:
   - `Konversi Block saat ini menjadi template`: setelah disimpan, posisi saat ini akan diganti dengan Block `Template Block` (yaitu reference template tersebut)
   - `Salin Block saat ini menjadi template`: hanya membuat template, Block saat ini tidak berubah

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Menggunakan Template Block

1) Tambahkan Block → "Block Lainnya" → `Template Block`
2) Pilih dalam konfigurasi:
   - `Template`: pilih sebuah template
   - `Mode`: `Reference` atau `Copy`

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Konversi Reference menjadi Copy

Ketika Block sedang mereferensi template, Anda dapat menggunakan `Konversi reference menjadi copy` di menu pengaturan Block untuk mengubah Block saat ini menjadi Block biasa (memutus reference), modifikasi selanjutnya tidak akan saling mempengaruhi.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Perhatian

- Saat membuat Block menggunakan template, UID Block dan node anaknya akan dibuat ulang. Beberapa konfigurasi yang bergantung pada UID mungkin perlu dikonfigurasi ulang.

## Template Field

Template Field digunakan untuk menggunakan kembali konfigurasi area Field (pemilihan Field, layout, dan konfigurasi Field) di **Block Form** dan **Block Detail**, menghindari penambahan Field berulang di beberapa Page/Block.

> Template Field hanya berlaku untuk "area Field", tidak akan mengganti seluruh Block. Jika Anda ingin menggunakan kembali seluruh Block, gunakan Template Block di atas.

### Menggunakan Template Field di Block Form/Detail

1) Masuk ke mode konfigurasi, buka menu "Field" di Block Form atau Block Detail
2) Pilih `Template Field`
3) Pilih sebuah template, dan pilih mode: `Reference` atau `Copy`

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Peringatan Penggantian

Ketika Field sudah ada di Block, menggunakan mode **Reference** biasanya akan menampilkan konfirmasi (karena Field reference akan mengganti area Field saat ini).

### Konversi Reference Field menjadi Copy

Ketika Block sedang mereferensi template Field, Anda dapat menggunakan `Konversi reference Field menjadi copy` di menu pengaturan Block untuk mengubah area Field saat ini menjadi konfigurasi independen (memutus reference), modifikasi selanjutnya tidak akan saling mempengaruhi.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Perhatian

- Template Field hanya berlaku untuk **Block Form** dan **Block Detail**.
- Ketika Collection terikat template tidak konsisten dengan Block saat ini, template akan ditampilkan sebagai tidak tersedia di selector dengan alasan yang ditampilkan.
- Jika ingin melakukan "penyesuaian khusus" pada Field di Block saat ini, disarankan untuk menggunakan mode `Copy` langsung, atau terlebih dahulu menjalankan "Konversi reference Field menjadi copy".

## Template Popup

Template Popup digunakan untuk menggunakan kembali serangkaian antarmuka Popup dan logika interaksi. Untuk konfigurasi umum Popup seperti cara membuka, ukuran, dll., lihat [Edit Popup](/interface-builder/actions/action-settings/edit-popup).

### Simpan Popup sebagai Template

1) Buka menu pengaturan tombol/Field yang dapat memicu Popup, klik `Simpan sebagai template`
2) Isi nama/deskripsi template, dan pilih mode penyimpanan:
   - `Konversi Popup saat ini menjadi template`: setelah disimpan, Popup saat ini akan beralih menjadi reference template
   - `Salin Popup saat ini menjadi template`: hanya membuat template, Popup saat ini tidak berubah

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Menggunakan Template di Konfigurasi Popup

1) Buka konfigurasi Popup tombol/Field
2) Pilih template di `Template Popup` untuk digunakan kembali

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Kondisi Penggunaan (Cakupan Template yang Tersedia)

Template Popup terkait dengan skenario Action yang memicu Popup. Selector akan secara otomatis memfilter/menonaktifkan template yang tidak kompatibel berdasarkan skenario saat ini (jika kondisi tidak terpenuhi, alasan akan ditampilkan).

| Tipe Action Saat Ini | Template Popup yang Dapat Digunakan |
| --- | --- |
| **Action Collection** | Template Popup yang dibuat dari Action Collection di Collection yang sama |
| **Action Record Non-Asosiasi** | Template Popup yang dibuat dari Action Collection atau Action Record Non-Asosiasi di Collection yang sama |
| **Action Record Asosiasi** | Template Popup yang dibuat dari Action Collection atau Action Record Non-Asosiasi di Collection yang sama; atau Template Popup yang dibuat dari Action Record Asosiasi di Field asosiasi yang sama |

### Popup Data Relasi

Template Popup yang dipicu oleh data relasi (Field asosiasi) memiliki aturan pencocokan khusus:

#### Pencocokan Ketat Template Popup Relasi

Ketika template Popup dibuat dari **Action Record Asosiasi** (template memiliki `associationName`), template tersebut hanya dapat digunakan oleh Action/Field dengan **Field asosiasi yang sama persis**.

Contoh: Template Popup yang dibuat di Field asosiasi `Pesanan.Pelanggan` hanya dapat digunakan oleh Action di Field asosiasi `Pesanan.Pelanggan` lainnya, tidak dapat digunakan oleh Field asosiasi `Pesanan.Referrer` (meskipun keduanya memiliki Collection target `Pelanggan`).

Hal ini karena variabel dan konfigurasi internal template Popup relasi bergantung pada konteks asosiasi yang spesifik.

#### Action Relasi Menggunakan Kembali Template Collection Target

Field/Action asosiasi dapat menggunakan kembali **template Popup non-asosiasi dari Collection target** (template yang dibuat dari Action Collection atau Action Record Non-Asosiasi), selama Collection-nya konsisten.

Contoh: Field asosiasi `Pesanan.Pelanggan` dapat menggunakan template Popup dari Collection `Pelanggan`. Cara ini cocok untuk berbagi konfigurasi Popup yang sama di antara beberapa Field asosiasi (seperti Popup detail pelanggan yang seragam).

### Konversi Reference menjadi Copy

Ketika Popup sedang mereferensi template, Anda dapat menggunakan `Konversi reference menjadi copy` di menu pengaturan untuk mengubah Popup saat ini menjadi konfigurasi independen (memutus reference), modifikasi selanjutnya tidak akan saling mempengaruhi.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Manajemen Template

Di Pengaturan Sistem → `UI Template`, Anda dapat melihat dan mengelola semua template:

- **Template Block (v2)**: mengelola template Block
- **Template Popup (v2)**: mengelola template Popup

> Template Field berasal dari template Block, dikelola di template Block.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Operasi yang didukung: lihat, filter, edit, hapus.

> **Perhatian**: Jika template sedang direferensikan, template tidak dapat dihapus secara langsung. Silakan gunakan terlebih dahulu `Konversi reference menjadi copy` di tempat yang mereferensi template untuk memutus reference, kemudian hapus template.
