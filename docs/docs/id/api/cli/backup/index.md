---
title: 'nb backup'
description: 'Referensi perintah nb backup: buat cadangan NocoBase dan unduh ke lokal, atau pulihkan file cadangan lokal ke env target.'
keywords: 'nb backup,NocoBase CLI,cadangan,pemulihan,nbdata'
---

# nb backup

Membuat atau memulihkan cadangan NocoBase. `nb backup create` akan membuat cadangan jarak jauh di env target, lalu mengunduh file cadangan ke lokal; `nb backup restore` akan mengunggah file cadangan lokal ke env target dan menunggu hingga aplikasi siap kembali.

## Penggunaan

```bash
nb backup <command>
```

## Subperintah

| Perintah                            | Deskripsi                                    |
| ----------------------------------- | -------------------------------------------- |
| [`nb backup create`](./create.md)   | Membuat cadangan dan mengunduhnya ke lokal   |
| [`nb backup restore`](./restore.md) | Memulihkan file cadangan lokal ke env target |

## Contoh

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Penjelasan

Sebelum dijalankan, CLI terlebih dahulu memeriksa apakah env target mengekspos perintah runtime terkait cadangan. Jika ada perintah yang tidak tersedia, cache runtime akan otomatis disegarkan sekali; jika setelah penyegaran kemampuan `nb api backup ...` masih belum ada, itu berarti env target belum mengaktifkan atau menyinkronkan kemampuan backup/restore, dan dalam kasus ini Anda perlu menangani aplikasi target itu sendiri terlebih dahulu.

Secara khusus:

- `nb backup create` bergantung pada `nb api backup create`, `nb api backup status`, dan `nb api backup download`
- `nb backup restore` bergantung pada `nb api backup restore-upload`

## Perintah terkait

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
