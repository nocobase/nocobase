---
title: "Pemodelan Data"
description: "Skill Pemodelan Data digunakan untuk membuat dan mengelola tabel data NocoBase melalui bahasa natural, termasuk membuat tabel, menambahkan Field, mengatur relasi, dan lainnya."
keywords: "Pembangunan AI,Pemodelan Data,Tabel Data,Field,Relasi,Collection"
---

# Pemodelan Data

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Pemodelan Data digunakan untuk membuat dan mengelola tabel data NocoBase melalui bahasa natural — membuat tabel, menambahkan Field, mengatur relasi, dan lainnya.

Sebelum digunakan, pastikan data source target sudah dikonfigurasi di "Data Source Management".


## Cakupan Kemampuan

- Membuat, memodifikasi, menghapus tabel data, mendukung tabel biasa, tabel pohon, tabel file, tabel kalender, tabel SQL, tabel view, tabel inheritance
- Menambahkan, memodifikasi, menghapus Field, termasuk berbagai tipe Field bawaan NocoBase (termasuk Field relasi) dan tipe Field yang diperluas oleh Plugin

## Contoh Prompt

### Skenario A: Membuat Tabel Data

```
Tolong bantu saya membuat tabel file untuk mengelola kontrak
```

Skill akan memandu AI menganalisis Field yang dibutuhkan tabel data dan tipe Field yang sesuai di NocoBase, kemudian membuat tabel data tipe file dan menambahkan Field yang sesuai dalam sistem.

![Membuat Tabel Data](https://static-docs.nocobase.com/202604162103369.png)

### Skenario B: Menambahkan Field

```
Tolong tambahkan Field status pada tabel pengguna, untuk menunjukkan apakah Pengguna sedang aktif, berisi tiga status: aktif, sedang resign, dan sudah resign
```

Skill akan memandu AI mendapatkan informasi metadata tabel pengguna, dan menganalisis bahwa Field status untuk menunjukkan status aktif sesuai dengan tipe Field "dropdown menu (single select)" di NocoBase, kemudian menambahkan Field pada tabel pengguna dan mengatur nilai enum.

![Menambahkan Field](https://static-docs.nocobase.com/202604162112692.png)

### Skenario C: Inisialisasi Model Data

```
Saya sedang membangun CRM, tolong bantu saya merancang dan membangun model data
```

Skill akan membuat tabel data, menambahkan Field, dan mengonfigurasi relasi dalam sistem berdasarkan model data yang dianalisis dan dirancang AI.

![Inisialisasi Model Data](https://static-docs.nocobase.com/202604162126729.png)

![Hasil Inisialisasi Model Data](https://static-docs.nocobase.com/202604162201867.png)

### Skenario D: Menambahkan Modul Fungsional

```
Saya ingin menambahkan model data manajemen pesanan pengguna pada sistem CRM saat ini
```

Skill akan memandu AI mendapatkan model data sistem saat ini, dan berdasarkan ini menyelesaikan desain pemodelan data fungsi baru, kemudian secara otomatis membuat tabel data, menambahkan Field, dan mengonfigurasi relasi.

![Menambahkan Modul Fungsional](https://static-docs.nocobase.com/202604162203006.png)

![Hasil Menambahkan Modul Fungsional](https://static-docs.nocobase.com/202604162203893.png)

## Pertanyaan Umum

**Apakah saat membuat tabel dapat secara otomatis membuat Field sistem?**

Ya. Field sistem seperti `id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy` dibuat secara otomatis oleh server, tidak perlu ditentukan secara manual.

**Bagaimana memodifikasi relasi yang dibuat dengan salah?**

Disarankan untuk memeriksa terlebih dahulu foreign key dan reverse field dari Field relasi saat ini, baru memutuskan apakah akan dimodifikasi atau dihapus dan dibuat ulang. Skill akan membaca kembali untuk memvalidasi status relasi di kedua sisi setelah perubahan.

**Bagaimana membuat tabel data berdasarkan tipe tabel data yang diperluas oleh Plugin?**

Kondisi ini mengharuskan Plugin yang sesuai dalam status aktif. Jika tidak diaktifkan, AI biasanya akan mencoba mengaktifkan Plugin, jika AI tidak berhasil mengoperasikan, harap aktifkan Plugin secara manual.

**Bagaimana menambahkan Field berdasarkan tipe Field yang diperluas oleh Plugin?**

Sama seperti di atas.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [Konfigurasi UI](./ui-builder) — Setelah membuat tabel data, gunakan AI untuk membangun halaman dan Block
- [Solusi](./dsl-reconciler) — Membangun seluruh sistem bisnis secara batch dari YAML
