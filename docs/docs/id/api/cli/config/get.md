---
title: 'nb config get'
description: 'Referensi perintah nb config get: membaca nilai efektif dari item konfigurasi CLI.'
keywords: 'nb config get,NocoBase CLI,membaca konfigurasi'
---

# nb config get

Membaca nilai efektif dari item konfigurasi CLI yang ditentukan. Jika belum diatur secara eksplisit, nilai default akan dikembalikan.

## Penggunaan

```bash
nb config get <key>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                                                                               |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |

## Contoh

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Perintah terkait

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
