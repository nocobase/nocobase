---
title: "nb license plugins list"
description: "Referensi perintah nb license plugins list: menampilkan plugin komersial yang terkait dengan lisensi saat ini untuk env yang dipilih."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Menampilkan plugin komersial yang terkait dengan license key tersimpan untuk env yang dipilih.

## Penggunaan

```bash
nb license plugins list [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Perintah Terkait

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
