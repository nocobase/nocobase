---
title: "nb env update"
description: "Referensi perintah nb env update: memuat ulang OpenAPI Schema dan cache perintah runtime dari env yang ditentukan."
keywords: "nb env update,NocoBase CLI,OpenAPI,perintah runtime,swagger"
---

# nb env update

Memuat ulang OpenAPI Schema dari aplikasi NocoBase, dan memperbarui cache perintah runtime lokal. Cache akan disimpan di `.nocobase/versions/<hash>/commands.json`.

## Penggunaan

```bash
nb env update [name] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama lingkungan, jika dilewati menggunakan env saat ini |
| `--verbose` | boolean | Menampilkan progress detail |
| `--api-base-url` | string | Mengganti alamat API NocoBase, dan menyimpannya secara persisten ke env target |
| `--role` | string | Override role, dikirim sebagai header `X-Role` |
| `--token`, `-t` | string | Override API key, dan menyimpannya secara persisten ke env target |

## Contoh

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Perintah Terkait

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
