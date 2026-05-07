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
| `<key>` | string | Key konfigurasi: `license.pkg-url`, `docker.network`, atau `docker.container-prefix` |

## Contoh

```bash
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
```

## Perintah Terkait

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
