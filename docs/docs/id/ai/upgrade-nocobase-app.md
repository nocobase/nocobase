---
title: Upgrade aplikasi NocoBase
description: Upgrade aplikasi NocoBase yang disimpan sebagai CLI env dengan nb app upgrade, mencakup konfirmasi env, perintah upgrade, versi target, dan verifikasi.
---

# Upgrade aplikasi NocoBase

:::tip Cakupan

Panduan ini berlaku untuk aplikasi yang diinstal dengan `nb init`. Jika aplikasimu diinstal dengan cara lama, baca dulu [Cara upgrade NocoBase dari 2.0 ke 2.1](./upgrade-from-2-0-to-2-1.md).

:::

## Langkah 1: konfirmasi env saat ini

Konfirmasi dulu CLI env yang sedang aktif:

```bash
nb env current
```

Jika belum yakin env apa saja yang tersedia, lihat daftarnya dulu:

```bash
nb env list
```

Jika env saat ini bukan aplikasi yang ingin di-upgrade, pindah dulu ke env target:

```bash
nb env use <env-name>
```

## Langkah 2: jalankan upgrade

:::warning Catatan

Secara default, upgrade akan mengunduh ulang source code aplikasi atau image Docker.

Untuk env npm / Git, direktori `source/` akan dihapus lalu diunduh ulang. Jangan simpan file yang perlu dipertahankan di `source/`.

Jika Anda sudah menyiapkan source code atau image Docker secara manual dan tidak ingin CLI mengunduhnya lagi, tambahkan `--skip-download` pada perintah.

:::

Perintah upgrade default adalah:

```bash
nb app upgrade
```

Perintah ini biasanya melakukan langkah-langkah berikut:

1. Menghentikan aplikasi saat ini
2. Mengunduh dan mengganti source atau image yang tersimpan
3. Menyinkronkan plugin komersial
4. Meng-upgrade dan menjalankan aplikasi
5. Memperbarui informasi runtime env

Dalam script, CI, atau sesi AI Agent, berikan `--force` secara eksplisit:

```bash
nb app upgrade --force
```

Jika aplikasi yang akan di-upgrade bukan env saat ini, tentukan env-nya:

```bash
nb app upgrade --env app1 --yes --force
```

### Upgrade ke versi tertentu

Gunakan `--version` untuk upgrade ke channel versi tertentu:

```bash
nb app upgrade --version beta
```

Anda juga dapat menentukan versi persis:

```bash
nb app upgrade --version 2.1.0-beta.24
```

Setelah upgrade berhasil, CLI akan menulis versi target kembali ke konfigurasi env, sehingga upgrade atau pemulihan berikutnya dapat menggunakannya kembali.

### Lewati download

Jika source code atau image Docker sudah Anda perbarui dan hanya ingin menjalankan upgrade serta start berdasarkan konten saat ini, tambahkan `--skip-download`:

```bash
nb app upgrade --skip-download
```

Parameter ini melewati download source atau image, dan juga melewati sinkronisasi plugin komersial. Biasanya gunakan hanya ketika versi target sudah disiapkan secara manual.

## Langkah 3: verifikasi hasil

Setelah upgrade, periksa dulu runtime env dan log aplikasi:

```bash
nb env info
nb app logs
```

Lalu buka aplikasi dan pastikan akun administrator dapat login. Jika Anda ingin AI Agent terus bekerja dengan aplikasi ini, mulai sesi AI Agent baru atau restart sesi saat ini agar ia membaca informasi env terbaru.

## Tautan terkait

- [Kelola aplikasi](../nocobase-cli/operations/manage-app.md) — Menjalankan, menghentikan, restart, melihat log, dan upgrade aplikasi
- [Referensi perintah `nb app upgrade`](../api/cli/app/upgrade.md) — Melihat semua opsi perintah upgrade
- [Manajemen multi environment](../nocobase-cli/operations/multi-environment.md) — Mengonfirmasi, berpindah, dan memelihara beberapa CLI env
