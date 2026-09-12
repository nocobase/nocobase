---
title: "nb api resource query"
description: "Referensi perintah nb api resource query: menjalankan agregasi query pada resource NocoBase yang ditentukan."
keywords: "nb api resource query,NocoBase CLI,agregasi query,statistik"
---

# nb api resource query

Menjalankan agregasi query pada resource yang ditentukan. `--measures`, `--dimensions`, dan `--orders` semuanya menggunakan format array JSON.

## Penggunaan

```bash
nb api resource query --resource <resource> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--measures` | string | Definisi measure dalam bentuk array JSON |
| `--dimensions` | string | Definisi dimension dalam bentuk array JSON |
| `--orders` | string | Definisi sorting dalam bentuk array JSON |
| `--filter` | string | Kondisi filter dalam bentuk objek JSON |
| `--having` | string | Kondisi filter setelah grouping dalam bentuk objek JSON |
| `--limit` | integer | Batas jumlah row yang dikembalikan |
| `--offset` | integer | Jumlah row yang dilewati |
| `--timezone` | string | Zona waktu yang digunakan untuk format query |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Perintah Terkait

- [`nb api resource list`](./list.md)
- [`nb api Perintah Dinamis`](../dynamic.md)
