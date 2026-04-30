---
title: "nb api resource"
description: "Referensi perintah nb api resource: menjalankan CRUD umum dan agregasi query pada resource NocoBase apapun."
keywords: "nb api resource,NocoBase CLI,CRUD,resource,tabel data"
---

# nb api resource

Menjalankan CRUD umum dan agregasi query pada resource NocoBase apapun. Nama resource dapat berupa resource biasa, misalnya `users`, atau resource asosiasi, misalnya `posts.comments`.

## Penggunaan

```bash
nb api resource <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb api resource list`](./list.md) | Menampilkan daftar record resource |
| [`nb api resource get`](./get.md) | Mengambil satu record resource |
| [`nb api resource create`](./create.md) | Membuat record resource |
| [`nb api resource update`](./update.md) | Memperbarui record resource |
| [`nb api resource destroy`](./destroy.md) | Menghapus record resource |
| [`nb api resource query`](./query.md) | Menjalankan agregasi query |

## Parameter Umum

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--api-base-url` | string | Alamat API NocoBase, misalnya `http://localhost:13000/api` |
| `--verbose` | boolean | Menampilkan progress detail |
| `--env`, `-e` | string | Nama lingkungan |
| `--role` | string | Override role, dikirim sebagai header `X-Role` |
| `--token`, `-t` | string | Override API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Apakah menampilkan output JSON mentah, default aktif |
| `--resource` | string | Nama resource, wajib diisi, misalnya `users`, `orders`, `posts.comments` |
| `--data-source` | string | Key data source, default `main` |

Perintah resource asosiasi juga dapat dikombinasikan dengan `--source-id` untuk menentukan ID record sumber.

## Contoh

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Perintah Terkait

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
