---
title: "Node Workflow - Hapus Data"
description: "Node Hapus Data: menghapus record tabel data berdasarkan kondisi, mendukung penghapusan batch, mengembalikan jumlah baris yang dihapus."
keywords: "Workflow,Hapus Data,Destroy,operasi tabel data,penghapusan batch,NocoBase"
---

# Hapus Data

Digunakan untuk menghapus data pada tabel data tertentu yang memenuhi kondisi.

Penggunaan dasar Node Hapus mirip dengan Node Update, hanya saja Node Hapus tidak memerlukan assignment field, hanya perlu memilih tabel data dan kondisi filter. Hasil Node Hapus akan mengembalikan jumlah baris data yang berhasil dihapus, hanya dapat dilihat di riwayat eksekusi, dan tidak dapat digunakan sebagai variable pada Node berikutnya.

:::info{title=Perhatian}
Saat ini Node Hapus tidak mendukung penghapusan satu per satu, semuanya adalah penghapusan batch, sehingga tidak akan memicu event lain pada penghapusan setiap record data.
:::

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Hapus Data":

![Membuat Node Hapus Data](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Konfigurasi Node

![Node Hapus_Konfigurasi Node](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Tabel Data

Pilih tabel data yang akan dihapus.

### Kondisi Filter

Mirip dengan kondisi filter pada query tabel data biasa, dapat menggunakan variable konteks alur.

## Contoh

Misalnya untuk membersihkan data pesanan historis yang sudah dibatalkan secara terjadwal, dapat diimplementasikan menggunakan Node Hapus:

![Node Hapus_Contoh_Konfigurasi Node](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Workflow akan terpicu secara terjadwal, dan menghapus semua data pesanan historis yang sudah dibatalkan.
