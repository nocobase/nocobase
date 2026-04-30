---
title: "nb db"
description: "Referensi perintah nb db: melihat atau mengelola status runtime database bawaan dari env yang dipilih."
keywords: "nb db,NocoBase CLI,database bawaan,Docker,status database"
---

# nb db

Melihat atau mengelola database bawaan yang dikelola CLI. Untuk env yang tidak memiliki container database yang dikelola CLI, `nb db ps` juga akan menampilkan status seperti `external` atau `remote`.

## Penggunaan

```bash
nb db <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb db ps`](./ps.md) | Melihat status runtime database bawaan |
| [`nb db start`](./start.md) | Memulai container database bawaan |
| [`nb db stop`](./stop.md) | Menghentikan container database bawaan |
| [`nb db logs`](./logs.md) | Melihat log container database bawaan |

## Contoh

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Perintah Terkait

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
