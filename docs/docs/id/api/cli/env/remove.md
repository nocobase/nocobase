---
title: "nb env remove"
description: "Referensi perintah nb env remove: menghapus konfigurasi env NocoBase CLI yang ditentukan."
keywords: "nb env remove,NocoBase CLI,menghapus lingkungan,menghapus konfigurasi"
---

# nb env remove

Menghapus env yang sudah dikonfigurasi. Perintah ini hanya menghapus konfigurasi env CLI yang tersimpan dan tidak membersihkan direktori aplikasi lokal, container, atau data storage; gunakan [`nb app down`](../app/down.md) jika Anda perlu membersihkan resource runtime lokal.

Jika env yang dihapus juga merupakan env saat ini, CLI otomatis memilih env saat ini yang baru dari env yang tersisa. Jika tidak ada env yang tersisa, env saat ini akan dikosongkan.

Secara default, perintah akan meminta konfirmasi. Untuk melewati konfirmasi, gunakan `--yes`. Dalam mode non-interaktif, `--yes` wajib diberikan sebelum env dapat dihapus.

## Penggunaan

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama env yang sudah dikonfigurasi untuk dihapus |
| `--yes`, `-y` | boolean | Lewati konfirmasi dan hapus konfigurasi env CLI yang tersimpan |
| `--verbose` | boolean | Menampilkan progress detail |

## Contoh

```bash
nb env remove staging
nb env remove staging --yes
```

## Perintah Terkait

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
