---
title: "nb api resource list"
description: "Referensi perintah nb api resource list: menampilkan daftar record dari resource NocoBase yang ditentukan."
keywords: "nb api resource list,NocoBase CLI,query daftar,resource"
---

# nb api resource list

Menampilkan daftar record dari resource yang ditentukan. Anda dapat menggunakan parameter `--filter`, `--fields`, `--sort`, `--page`, dll untuk mengontrol query.

## Penggunaan

```bash
nb api resource list --resource <resource> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--source-id` | string | ID record sumber dari resource asosiasi |
| `--filter` | string | Kondisi filter dalam bentuk objek JSON |
| `--fields` | string[] | Field query, dapat dimasukkan berulang atau berupa array JSON |
| `--appends` | string[] | Field asosiasi yang akan ditambahkan, dapat dimasukkan berulang atau berupa array JSON |
| `--except` | string[] | Field yang dikecualikan, dapat dimasukkan berulang atau berupa array JSON |
| `--sort` | string[] | Field sorting, misalnya `-createdAt`, dapat dimasukkan berulang atau berupa array JSON |
| `--page` | integer | Nomor halaman |
| `--page-size` | integer | Jumlah record per halaman |
| `--paginate` / `--no-paginate` | boolean | Apakah menggunakan pagination |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Perintah Terkait

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
