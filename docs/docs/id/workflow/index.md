---
pkg: '@nocobase/plugin-workflow'
title: "Ikhtisar Workflow"
description: "Workflow: orkestrasi visual proses bisnis otomatis, Trigger dan Node, persetujuan, sinkronisasi data, HTTP Request, kolaborasi manusia-mesin, tanpa perlu menulis kode."
keywords: "Workflow,otomasi,Trigger,persetujuan,orkestrasi alur,sinkronisasi data,kolaborasi manusia-mesin,NocoBase"
---

# Ikhtisar

## Pengantar

Plugin Workflow membantu Anda mengorkestrasi proses bisnis otomatis di NocoBase, seperti persetujuan harian, sinkronisasi data, pengingat, dan lain sebagainya. Pada Workflow, Anda hanya perlu mengonfigurasi Trigger dan Node terkait melalui antarmuka visual untuk mengimplementasikan logika bisnis yang kompleks tanpa harus menulis kode.

### Contoh

Setiap Workflow disusun dari satu Trigger dan beberapa Node. Trigger merepresentasikan event di dalam sistem, sedangkan setiap Node merepresentasikan langkah eksekusi, secara keseluruhan menggambarkan logika bisnis yang perlu ditangani setelah event terjadi. Gambar di bawah menampilkan alur tipikal pengurangan stok setelah pemesanan produk:

![Contoh Workflow](https://static-docs.nocobase.com/20251029222146.png)

Ketika pengguna mengirimkan pesanan, Workflow akan secara otomatis memeriksa stok. Jika stok mencukupi, maka stok akan dikurangi dan pembuatan pesanan dilanjutkan; jika tidak, alur akan diakhiri.

### Skenario Penggunaan

Dari sudut pandang yang lebih umum, Workflow di aplikasi NocoBase dapat menyelesaikan berbagai masalah dalam berbagai skenario:

- Menangani tugas berulang secara otomatis: peninjauan pesanan, sinkronisasi stok, pembersihan data, perhitungan skor, dan lain-lain tidak perlu lagi dilakukan secara manual.
- Mendukung kolaborasi manusia-mesin: mengatur persetujuan atau peninjauan ulang pada Node kunci, dan melanjutkan langkah berikutnya berdasarkan hasil pemrosesan.
- Menghubungkan sistem eksternal: mengirim HTTP Request, menerima push dari layanan eksternal, mewujudkan otomasi lintas sistem.
- Beradaptasi cepat dengan perubahan bisnis: menyesuaikan struktur alur, kondisi, atau konfigurasi Node lainnya, tanpa perlu rilis ulang untuk go-live.

## Instalasi

Workflow adalah plugin bawaan NocoBase, tidak memerlukan instalasi atau konfigurasi tambahan.

## Pelajari Lebih Lanjut

- [Memulai](./getting-started)
- [Trigger](./triggers/index)
- [Node](./nodes/index)
- [Menggunakan Variabel](./advanced/variables)
- [Rencana Eksekusi](./advanced/executions)
- [Manajemen Versi](./advanced/revisions)
- [Konfigurasi Lanjutan](./advanced/options)
- [Pengembangan Ekstensi](./development/index)
