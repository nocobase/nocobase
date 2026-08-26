---
title: "Solusi"
description: "Skill Solusi digunakan untuk membangun aplikasi NocoBase secara batch dari file konfigurasi YAML."
keywords: "Pembangunan AI,Solusi,Pembangunan Aplikasi,YAML,Pembuatan Tabel Batch,Dashboard"
---

# Solusi

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

:::warning Perhatian

Fungsi solusi saat ini masih dalam tahap pengujian, stabilitasnya terbatas, hanya untuk pengalaman mencoba.

:::

## Pengantar

Skill Solusi digunakan untuk membangun aplikasi NocoBase secara batch dari file konfigurasi YAML — membuat tabel data, mengonfigurasi halaman, menghasilkan dashboard dan grafik sekaligus.

Cocok untuk skenario yang membutuhkan pembangunan cepat seluruh sistem bisnis, seperti CRM, manajemen tiket, inventaris, dan lainnya.


## Cakupan Kemampuan

Dapat dilakukan:

- Merancang seluruh solusi aplikasi berdasarkan deskripsi kebutuhan, termasuk tabel data, halaman, dan dashboard
- Membuat tabel data dan halaman secara batch melalui `structure.yaml`
- Mengonfigurasi popup dan formulir melalui `enhance.yaml`
- Menghasilkan dashboard secara otomatis, berisi kartu KPI dan grafik
- Update inkremental — selalu menggunakan mode `--force`, tidak akan merusak data yang sudah ada

Tidak dapat dilakukan:

- Tidak cocok untuk fine-tuning Field demi Field (gunakan [Skill Pemodelan Data](./data-modeling) lebih cocok)
- Tidak dapat melakukan migrasi data atau impor data
- Tidak dapat mengonfigurasi Permission dan Workflow (perlu dikombinasikan dengan Skill lain)

## Contoh Prompt

### Skenario A: Membangun Sistem Lengkap

```
Bantu saya menggunakan nocobase-dsl-reconciler skill untuk membangun sistem manajemen tiket, berisi dashboard, daftar tiket, manajemen pengguna, konfigurasi SLA
```

Skill akan terlebih dahulu mengeluarkan rancangan desain — mencantumkan semua tabel data dan struktur halaman, setelah dikonfirmasi baru menjalankan pembangunan dalam beberapa putaran.

![Rancangan Desain](https://static-docs.nocobase.com/20260420100420.png)

![Hasil Pembangunan](https://static-docs.nocobase.com/20260420100450.png)

### Skenario B: Memodifikasi Modul yang Sudah Ada

```
Bantu saya menggunakan nocobase-dsl-reconciler skill untuk menambahkan Field dropdown "Tingkat Urgensi" pada tabel tiket, opsinya P0 hingga P3
```

Setelah memodifikasi `structure.yaml`, gunakan `--force` untuk update.

### Skenario C: Grafik Kustom

```
Bantu saya menggunakan nocobase-dsl-reconciler skill untuk mengubah "Tiket Baru Minggu Ini" pada dashboard menjadi "Tiket Baru Bulan Ini"
```

![Grafik Kustom](https://static-docs.nocobase.com/20260420100517.png)

Edit file SQL yang sesuai, ubah rentang waktu dari `'7 days'` menjadi `'1 month'`, lalu jalankan `--verify-sql` untuk memvalidasi.

## Pertanyaan Umum

**Apa yang harus dilakukan jika validasi SQL gagal?**

NocoBase menggunakan PostgreSQL, nama kolom harus menggunakan camelCase dan dengan tanda kutip ganda (misalnya `"createdAt"`), fungsi tanggal menggunakan `NOW() - '7 days'::interval` bukan sintaks SQLite. Menjalankan `--verify-sql` dapat menemukan masalah seperti ini sebelum deployment.

**Bagaimana fine-tuning Field tertentu setelah pembangunan?**

Pembangunan seluruh sistem menggunakan Skill Solusi, fine-tuning selanjutnya menggunakan [Skill Pemodelan Data](./data-modeling) atau [Skill Konfigurasi UI](./ui-builder) lebih fleksibel.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [Pemodelan Data](./data-modeling) — Fine-tuning Field demi Field menggunakan Skill Pemodelan Data
- [Konfigurasi UI](./ui-builder) — Fine-tuning halaman dan layout Block setelah pembangunan
