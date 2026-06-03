---
title: 'nb config delete'
description: 'Referensi perintah nb config delete: menghapus item konfigurasi CLI yang diatur secara eksplisit.'
keywords: 'nb config delete,NocoBase CLI,hapus konfigurasi'
---

# nb config delete

Menghapus item konfigurasi CLI yang telah diatur secara eksplisit. Setelah dihapus, item konfigurasi tersebut akan kembali ke nilai default.

## Penggunaan

```bash
nb config delete <key>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                                                                               |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |

## Contoh

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Perintah terkait

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
