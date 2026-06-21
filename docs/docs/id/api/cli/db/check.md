---
title: "nb db check"
description: "Referensi perintah nb db check: memeriksa apakah database dapat dijangkau menggunakan env saat ini atau flag database eksplisit."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Memeriksa apakah database dapat dijangkau. Anda dapat menggunakan kembali pengaturan database yang disimpan dari sebuah env atau memberikan flag `--db-*` secara eksplisit.

## Penggunaan

```bash
nb db check [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Membaca konfigurasi database dari env CLI; jika dilewati, semua flag `--db-*` yang wajib harus diberikan |
| `--db-dialect` | string | Dialek database: `postgres`, `kingbase`, `mysql`, atau `mariadb` |
| `--db-host` | string | Nama host atau alamat IP database |
| `--db-port` | string | Port TCP database |
| `--db-database` | string | Nama database |
| `--db-user` | string | Nama pengguna database |
| `--db-password` | string | Kata sandi database |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Catatan

Jika env yang dipilih menggunakan database bawaan yang dikelola CLI, CLI akan menyelesaikan alamat koneksi sebenarnya terlebih dahulu sebelum menjalankan pemeriksaan.

## Perintah Terkait

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
