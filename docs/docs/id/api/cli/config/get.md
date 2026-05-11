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
| `<key>` | string | Key konfigurasi: `license.pkg-url`, `docker.network`, atau `docker.container-prefix` |

## Contoh

```bash
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
```

## Perintah Terkait

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
