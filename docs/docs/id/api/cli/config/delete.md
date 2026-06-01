---
title: "nb config delete"
description: "Referensi perintah nb config delete: menghapus pengaturan CLI yang dikonfigurasi secara eksplisit."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Menghapus pengaturan CLI yang dikonfigurasi secara eksplisit. Setelah dihapus, CLI akan kembali memakai nilai default untuk key tersebut.

## Penggunaan

```bash
nb config delete <key>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<key>` | string | Key konfigurasi: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |

## Contoh

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Perintah Terkait

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
