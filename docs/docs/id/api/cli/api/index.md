---
title: "nb api"
description: "Referensi perintah nb api: memanggil API NocoBase melalui CLI, termasuk perintah resource umum dan perintah dinamis."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Memanggil API NocoBase melalui CLI. `nb api` mencakup perintah CRUD umum [`nb api resource`](./resource/index.md), serta perintah yang dihasilkan secara dinamis berdasarkan OpenAPI Schema dari aplikasi saat ini.

## Penggunaan

```bash
nb api <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Menjalankan CRUD umum dan agregasi query pada resource NocoBase apapun |
| [`nb api perintah dinamis`](./dynamic.md) | Perintah topic dan operation yang dihasilkan dari OpenAPI Schema aplikasi |

## Parameter Umum

Sebagian besar perintah `nb api` mendukung parameter koneksi berikut:

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--api-base-url` | string | Alamat API NocoBase, misalnya `http://localhost:13000/api` |
| `--env`, `-e` | string | Nama lingkungan |
| `--token`, `-t` | string | Override API key |
| `--role` | string | Override role, dikirim sebagai header `X-Role` |
| `--verbose` | boolean | Menampilkan progress detail |
| `--json-output`, `-j` / `--no-json-output` | boolean | Apakah menampilkan output JSON mentah, default aktif |

## Contoh

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Perintah Terkait

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
