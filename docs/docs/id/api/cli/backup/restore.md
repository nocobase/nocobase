---
title: 'nb backup restore'
description: 'Referensi perintah nb backup restore: memulihkan file cadangan lokal ke env target.'
keywords: 'nb backup restore,NocoBase CLI,pulihkan cadangan,pemulihan,nbdata'
---

# nb backup restore

Memulihkan file cadangan lokal ke env target. Biasanya, file `*.nbdata` digunakan di sini. Proses pemulihan akan menimpa data aplikasi target, sehingga CLI secara default akan meminta konfirmasi lagi.

## Penggunaan

```bash
nb backup restore --file <path> [flags]
```

## Parameter

| Parameter      | Tipe    | Deskripsi                                                                                                         |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`  | string  | Nama CLI env tujuan pemulihan; jika dihilangkan, env saat ini akan digunakan                                      |
| `--yes`, `-y`  | boolean | Lewati konfirmasi interaktif ketika env yang ditentukan secara eksplisit oleh `--env` berbeda dari env saat ini   |
| `--file`, `-f` | string  | Path file cadangan lokal; wajib                                                                                   |
| `--force`      | boolean | Konfirmasi penimpaan data aplikasi; wajib diberikan secara eksplisit di terminal non-interaktif dan sesi AI agent |

## Contoh

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Penjelasan

CLI hanya akan memeriksa apakah `--env` sama dengan env saat ini jika Anda secara eksplisit memberikan `--env`. Jika env yang berbeda ditentukan secara eksplisit, terminal interaktif akan meminta konfirmasi terlebih dahulu; dalam terminal non-interaktif atau skenario AI agent, Anda perlu menambahkan `--yes` sendiri secara eksplisit, atau jalankan dulu `nb env use <name>` lalu coba lagi.

Sebelum dijalankan, CLI akan terlebih dahulu memeriksa apakah path yang ditunjuk oleh `--file` ada, dan memastikan bahwa path tersebut adalah file biasa. Jika path tidak ada atau menunjuk ke direktori, perintah akan langsung gagal.

Jika `--force` tidak diberikan, terminal interaktif akan kembali menampilkan konfirmasi, dengan penegasan bahwa pemulihan ini akan menimpa data aplikasi. Dalam terminal non-interaktif dan sesi AI agent, jika `--force` tidak ada, CLI akan langsung menolak menjalankan perintah dan memberikan petunjuk untuk menjalankan ulang yang bisa langsung disalin. Jika pada saat yang sama ini juga merupakan operasi lintas env, biasanya Anda perlu memberikan `--yes` dan `--force` sekaligus.

Setelah unggahan berhasil, CLI akan terus menunggu hingga aplikasi target kembali lolos `__health_check`. Artinya, saat perintah berhasil selesai, aplikasi biasanya sudah dipulihkan ke keadaan yang dapat diakses.

## Perintah terkait

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
