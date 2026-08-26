---
title: "Produk, Penawaran, dan Pesanan"
description: "Panduan penggunaan katalog Produk CRM, Penawaran (dengan alur persetujuan), manajemen Pesanan: alur lengkap dari pemeliharaan Produk hingga persetujuan Penawaran hingga pengiriman Pesanan."
keywords: "Manajemen Produk,Penawaran,Manajemen Pesanan,Alur Persetujuan,Multi-mata uang,NocoBase CRM"
---

# Produk, Penawaran, dan Pesanan

> Bab ini mencakup paruh kedua alur penjualan: pemeliharaan katalog Produk, pembuatan dan persetujuan Penawaran, serta pengiriman Pesanan dan pelacakan pembayaran. Penawaran juga dibahas di [Manajemen Peluang](./guide-opportunities) (dari perspektif Peluang), bab ini berfokus pada perspektif Produk dan Pesanan.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Katalog Produk

Dari menu atas masuk ke halaman **Products**, berisi dua tab:

### Daftar Produk

Sisi kiri adalah pohon kategori (filter JS), sisi kanan adalah tabel Produk. Setiap Produk berisi: nama, kode, kategori, spesifikasi, satuan, harga daftar, biaya, mata uang.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Saat membuat Produk baru, selain informasi dasar, Anda juga dapat mengonfigurasi **sub-tabel harga bertingkat**:

| Field | Deskripsi |
|------|------|
| Mata uang | Mata uang harga |
| Jumlah Minimum | Jumlah awal tier harga |
| Jumlah Maksimum | Jumlah maksimum tier harga |
| Harga Satuan | Harga satuan untuk rentang jumlah tersebut |
| Persentase Diskon | Rasio diskon batch |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Saat membuat Penawaran, setelah memilih Produk, sistem akan otomatis mencocokkan harga bertingkat berdasarkan jumlah.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Manajemen Kategori

Tab kedua adalah tabel pohon kategori Produk, mendukung nesting kategori multi-level. Klik "Add Subcategory" untuk membuat sub-kategori di bawah node saat ini.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Penawaran

Penawaran biasanya dibuat dari detail Peluang (lihat bagian "Membuat Penawaran" di [Peluang dan Penawaran](./guide-opportunities)), di sini ditambahkan detail Produk dan alur persetujuan Penawaran.

### Detail Produk

Pada sub-tabel baris detail Penawaran, setelah memilih Produk, beberapa field akan otomatis terisi:

| Field | Deskripsi |
|------|------|
| **Produk** | Pilih dari katalog Produk |
| **Spesifikasi** | Read-only, otomatis terisi setelah memilih Produk |
| **Satuan** | Read-only, otomatis terisi |
| **Jumlah** | Diisi manual |
| **Harga Daftar** | Read-only, harga di katalog Produk |
| **Harga Satuan** | Read-only, otomatis cocok harga bertingkat berdasarkan jumlah |
| **Persentase Diskon** | Read-only, diskon dari harga bertingkat |
| **Total Baris** | Otomatis dihitung |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

Sistem otomatis menyelesaikan rantai perhitungan jumlah: subtotal → diskon → pajak → pengiriman → total → ekuivalen USD.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Dukungan Multi-Mata Uang

Jika Pelanggan menggunakan mata uang non-USD untuk transaksi, pilih mata uang yang sesuai. Sistem **mengunci nilai tukar saat ini** saat pembuatan, dan otomatis mengkonversi ke jumlah ekuivalen USD. Manajemen nilai tukar dipelihara di halaman **Settings → Exchange Rate**.

### Persetujuan

Penawaran yang dibuat perlu melalui persetujuan, setelah disetujui dapat dibuat Pesanan baru.

---

## Manajemen Pesanan

Dari menu atas masuk ke halaman **Orders**. Anda juga dapat membuat langsung dari Penawaran yang sudah disetujui di detail Peluang dengan klik "New Order".

### Daftar Pesanan

Bagian atas halaman memiliki tombol filter:

| Tombol | Arti |
|------|------|
| **All** | Semua Pesanan |
| **Sedang Diproses** | Pesanan yang sedang dijalankan |
| **Menunggu Pembayaran** | Menunggu pembayaran Pelanggan |
| **Terkirim** | Sudah dikirim, menunggu konfirmasi penerimaan |
| **Selesai** | Alur selesai |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Kolom Progress Pesanan

Kolom "Progress Pesanan" pada tabel menampilkan status saat ini dengan progress bar visual berbentuk titik:

```
Menunggu Konfirmasi → Dikonfirmasi → Sedang Diproses → Terkirim → Selesai
```

Langkah yang sudah selesai akan disorot, langkah yang belum tercapai akan abu-abu.

### Baris Ringkasan

Informasi ringkasan di bagian bawah tabel:

- **Jumlah Pesanan yang Dipilih / Semua**
- **Distribusi Status Pembayaran** (dalam bentuk tag)
- **Distribusi Status Pesanan** (dalam bentuk tag)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Membuat Pesanan

**Konversi dari Penawaran (Direkomendasikan)**: Pada detail Peluang, Penawaran dengan status Approved akan menampilkan tombol "New Order", setelah klik sistem otomatis membawa informasi Pelanggan, detail Produk, jumlah, mata uang, nilai tukar, dll.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Pembuatan Manual**: Pada halaman daftar Pesanan klik "New", perlu mengisi Pelanggan, detail Produk, jumlah Pesanan, syarat pembayaran.

### Peningkatan Status Pesanan

Klik Pesanan untuk masuk ke popup detail, bagian atas memiliki status flow interaktif, klik node status berikutnya untuk meningkatkan. Setiap perubahan status akan dicatat oleh sistem.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Pelacakan Pembayaran

Status Pesanan dan status pembayaran adalah dua jalur independen:

- **Status Pesanan**: Konfirmasi → Pemrosesan → Pengiriman → Selesai (alur pengiriman)
- **Status Pembayaran**: Menunggu Pembayaran → Sebagian Dibayar → Sudah Dibayar (alur pembayaran)

Saat ini kami berfokus pada alur frontend CRM, tidak ada batasan kondisi untuk status Pesanan, hanya sebagai item record, jika diperlukan, dapat dikontrol dengan reaction rules dan event tabel data.

---

Setelah Pesanan selesai, seluruh closed-loop penjualan telah selesai. Selanjutnya pelajari manajemen [Pelanggan, Kontak, dan Email](./guide-customers-emails).

## Halaman Terkait

- [Panduan Penggunaan CRM](./index.md)
- [Manajemen Peluang](./guide-opportunities) — Operasi Penawaran dari perspektif Peluang
- [Pelanggan, Kontak, dan Email](./guide-customers-emails)
- [Dashboard](./guide-overview) — Drill-through data Pesanan
