---
title: "nb db logs"
description: "Referensi perintah nb db logs: melihat log container database bawaan dari env yang ditentukan."
keywords: "nb db logs,NocoBase CLI,log database,Docker logs"
---

# nb db logs

Melihat log container database bawaan dari env yang ditentukan. Perintah ini hanya berlaku untuk env yang mengaktifkan database bawaan yang dikelola CLI.

## Penggunaan

```bash
nb db logs [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dilihat log database bawaannya, jika dilewati menggunakan env saat ini |
| `--tail` | integer | Jumlah baris log terbaru yang ditampilkan sebelum mengikuti log, default `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Apakah terus mengikuti log baru |

## Contoh

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Perintah Terkait

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
