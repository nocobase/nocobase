---
title: "nb config get"
description: "Referensi perintah nb config get: mengambil nilai efektif dari key konfigurasi CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Mengambil nilai efektif dari key konfigurasi CLI. Jika tidak ada nilai eksplisit yang disetel, nilai default akan dikembalikan.

## Penggunaan

```bash
nb config get <key>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<key>` | string | Key konfigurasi: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |

## Contoh

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Perintah Terkait

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
