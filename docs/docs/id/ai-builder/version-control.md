---
title: "Kontrol Versi"
description: "Skill Kontrol Versi (nocobase-revision) membuat versi aplikasi yang dapat dipulihkan setelah AI Builder menyelesaikan milestone."
keywords: "AI Builder,kontrol versi,nocobase-revision,nb revision create,pulihkan versi"
---

# Kontrol Versi

:::tip Prasyarat

- Sebelum membaca halaman ini, pasang NocoBase CLI dan selesaikan inisialisasi sesuai [Mulai Cepat AI Builder](./index.md)
- Aktifkan plugin Backup Management dan Version Control
- Edisi Community dan Standard tidak menyertakan plugin Version Control. Jika hanya perlu titik rollback sebelum perubahan penting, gunakan [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Pengantar

Skill Kontrol Versi (`nocobase-revision`) membuat versi aplikasi yang dapat dipulihkan setelah AI Builder menyelesaikan milestone yang bermakna. Misalnya, setelah membuat halaman, membuat sekelompok collection, atau mengonfigurasi workflow, AI dapat menjalankan `nb revision create` untuk menyimpan kondisi saat ini.

Skill ini tidak membuat versi untuk setiap perubahan field. Secara default, versi hanya disimpan setelah milestone yang jelas selesai dan diverifikasi, sehingga daftar versi tetap mudah dibaca dan titik pemulihan lebih mudah dipilih.

Untuk daftar versi, pembuatan manual, pemulihan, dan pengaturan retensi, lihat [panduan plugin Version Control](../ops-management/version-control/index.md).

## Kemampuan

Dapat melakukan:

- Membuat versi setelah milestone pembangunan selesai dan diverifikasi
- Menulis deskripsi singkat yang menjelaskan apa yang disimpan
- Membuat versi menggunakan lingkungan CLI saat ini

Tidak dapat melakukan:

- Menggantikan kemampuan simpan dan pulihkan dasar dari plugin Backup Management
- Membuat versi jika plugin Version Control belum diaktifkan
- Memulihkan ke versi tertentu secara otomatis. Gunakan [plugin Version Control](../ops-management/version-control/index.md) untuk memulihkan versi

## Contoh Prompt

### Skenario A: Simpan konfigurasi halaman yang sudah selesai

```text
Simpan hasil pembangunan saat ini sebagai versi: halaman manajemen pelanggan, area filter, dan form edit sudah selesai dikonfigurasi
```

Skill akan merapikan deskripsi menjadi catatan versi yang singkat, lalu membuat versi.

Mode perintah:

```bash
nb revision create "Halaman manajemen pelanggan, area filter, dan form edit sudah selesai dikonfigurasi"
```

### Skenario B: Simpan model data dan workflow

```text
Collection pemasok dan workflow persetujuan pembelian sudah diverifikasi. Tolong buatkan versi.
```

Cocok untuk pekerjaan yang melibatkan beberapa kemampuan. Misalnya, membuat collection dengan [Pemodelan Data](./data-modeling), mengonfigurasi proses persetujuan dengan [Manajemen Workflow](./workflow), memverifikasi hasilnya, lalu menyimpan versi.

### Skenario C: Membuat versi di lingkungan tertentu

```text
Di lingkungan dev, simpan satu versi: halaman manajemen tiket dan field SLA sudah selesai dikonfigurasi
```

Jika lingkungan yang ditentukan bukan lingkungan CLI saat ini, Skill akan mengonfirmasi target terlebih dahulu agar versi tidak tersimpan ke aplikasi yang salah.

Mode perintah:

```bash
nb revision create --env dev --yes "Halaman manajemen tiket dan field SLA sudah selesai dikonfigurasi"
```

## Cara Menulis Deskripsi Versi

Deskripsi versi sebaiknya menjelaskan apa yang sudah selesai, bukan hanya memakai label yang samar.

Disarankan:

- `Buku pelanggan, halaman detail, dan alur pengajuan persetujuan selesai dikonfigurasi`
- `Collection pemasok, form permintaan pembelian, dan workflow persetujuan selesai`
- `Completed customer detail page, edit form, and submission workflow wiring`

Tidak disarankan:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Hanya tanggal atau timestamp

Selain itu, jangan menuliskan token, URL, kata sandi, atau informasi sensitif lain di deskripsi. Deskripsi muncul di daftar versi dan sebaiknya tetap jelas, mudah dibaca, dan dapat diaudit.

## FAQ

**Kapan sebaiknya membuat versi?**

Setelah milestone yang dapat diperiksa secara terpisah. Misalnya, halaman sudah bisa dibuka dan diedit dengan benar, relasi collection sudah diverifikasi, atau workflow sudah disimpan dan rantai node-nya diperiksa.

**Mengapa tidak membuat versi setelah setiap penyesuaian AI?**

Terlalu banyak versi kecil akan membuat daftar sulit dibaca. Biasanya versi mewakili titik yang bisa dipulihkan untuk melanjutkan pekerjaan, bukan hanya penggantian nama field atau perubahan posisi tombol.

**Apakah hasil perlu diverifikasi sebelum membuat versi?**

Ya. Skill Kontrol Versi digunakan untuk menyimpan hasil yang sudah selesai dan diverifikasi. Jika halaman masih error atau workflow belum dikonfirmasi, minta AI memperbaiki dan memverifikasinya terlebih dahulu.

**Di mana versi dipulihkan?**

Di daftar versi pada plugin Version Control. Pemulihan akan menimpa konfigurasi aplikasi saat ini dan data yang termasuk dalam versi tersebut. Sebelum menjalankan operasi, baca [panduan plugin Version Control](../ops-management/version-control/index.md).

## Tautan Terkait

- [Panduan plugin Version Control](../ops-management/version-control/index.md) — membuat versi manual, memulihkan versi, dan mengatur aturan versi
- [Backup Management](../ops-management/backup-manager/index.mdx) — kemampuan dasar yang dibutuhkan Version Control
- [Ringkasan AI Builder](./index.md) — ringkasan dan instalasi semua Skill AI Builder
- [Manajemen Publikasi](./publish.md) — publikasi lintas lingkungan, backup recovery, dan migrasi
