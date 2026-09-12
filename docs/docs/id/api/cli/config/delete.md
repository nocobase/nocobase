---
title: 'nb config delete'
description: 'Referensi perintah nb config delete: menghapus item konfigurasi CLI yang diatur secara eksplisit.'
keywords: 'nb config delete,NocoBase CLI,menghapus konfigurasi'
---

# nb config delete

Menghapus item konfigurasi CLI yang sudah diatur secara eksplisit. Setelah dihapus, item konfigurasi tersebut akan kembali ke nilai default.

## Penggunaan

```bash
nb config delete <key>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi. Lihat [`nb config`](./index.md) untuk nilai yang didukung |

## Contoh

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete nb-image-registry
nb config delete nb-image-variant
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Perintah terkait

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
