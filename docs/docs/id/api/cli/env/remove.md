---
title: "nb env remove"
description: "Referensi perintah nb env remove: menghapus konfigurasi env NocoBase CLI yang ditentukan."
keywords: "nb env remove,NocoBase CLI,menghapus lingkungan,menghapus konfigurasi"
---

# nb env remove

Menghapus env yang sudah dikonfigurasi. Perintah ini hanya menghapus konfigurasi env CLI; jika perlu membersihkan aplikasi lokal, container, dan storage, gunakan [`nb app down`](../app/down.md).

## Penggunaan

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama lingkungan yang akan dihapus |
| `--force`, `-f` | boolean | Lewati konfirmasi dan langsung hapus |
| `--verbose` | boolean | Menampilkan progress detail |

## Contoh

```bash
nb env remove staging
nb env remove staging -f
```

## Perintah Terkait

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
