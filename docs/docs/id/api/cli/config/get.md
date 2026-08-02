---
title: 'nb config get'
description: 'Referensi perintah nb config get: membaca nilai efektif dari item konfigurasi CLI.'
keywords: 'nb config get,NocoBase CLI,membaca konfigurasi'
---

# nb config get

Membaca nilai efektif dari item konfigurasi CLI yang ditentukan. Jika belum pernah diatur secara eksplisit, nilai default yang akan dikembalikan.

## Penggunaan

```bash
nb config get <key>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi. Lihat [`nb config`](./index.md) untuk nilai yang didukung |

## Contoh

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Perintah terkait

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
