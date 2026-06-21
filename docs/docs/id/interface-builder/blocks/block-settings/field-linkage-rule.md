---
title: "Aturan Linkage Field"
description: "Konfigurasi Block: mengkonfigurasi aturan linkage Field, mengimplementasikan linkage data antar Field, tampilan/sembunyi, linkage opsi."
keywords: "Aturan Linkage Field, linkage Field, linkage opsi, konfigurasi Block, interface builder, NocoBase"
---

# Aturan Linkage Field

## Pengantar

Aturan Linkage Field memungkinkan penyesuaian status Field Block Form/Detail secara dinamis berdasarkan perilaku pengguna. Saat ini Block yang mendukung aturan linkage Field meliputi:

- [Block Form](/interface-builder/blocks/data-blocks/form)
- [Block Detail](/interface-builder/blocks/data-blocks/details)
- [Sub-Form](/interface-builder/fields/specific/sub-form)

## Petunjuk Penggunaan

### **Block Form**

Di Block Form, aturan linkage dapat menyesuaikan perilaku Field secara dinamis berdasarkan kondisi tertentu:

- **Mengontrol tampilan/sembunyi Field**: Menentukan apakah Field saat ini ditampilkan berdasarkan nilai Field lainnya.
- **Mengatur apakah Field wajib diisi**: Dalam kondisi tertentu, mengatur Field menjadi wajib atau tidak wajib secara dinamis.
- **Penugasan**: Penugasan Field secara otomatis berdasarkan kondisi.
- **Menjalankan JavaScript yang ditentukan**: Tulis JavaScript sesuai kebutuhan bisnis.

### **Block Detail**

Di Block Detail, aturan linkage terutama digunakan untuk mengontrol tampilan dan sembunyi Field di Block Detail secara dinamis.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Linkage Atribut

### Penugasan

Contoh: Saat pesanan dicentang sebagai pesanan tambahan, status pesanan secara otomatis ditugaskan menjadi "Menunggu Persetujuan".

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Wajib Diisi

Contoh: Saat status pesanan adalah "Sudah Dibayar", jumlah pesanan wajib diisi.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Tampilan/Sembunyi

Contoh: Hanya saat status pesanan adalah "Belum Dibayar" baru menampilkan akun pembayaran dan total jumlah.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)
