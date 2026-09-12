---
title: "nb db start"
description: "Referensi perintah nb db start: memulai container database bawaan dari env yang ditentukan."
keywords: "nb db start,NocoBase CLI,memulai database,Docker"
---

# nb db start

Memulai container database bawaan dari env yang ditentukan. Perintah ini hanya berlaku untuk env yang mengaktifkan database bawaan yang dikelola CLI.

## Penggunaan

```bash
nb db start [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dimulai database bawaannya, jika dilewati menggunakan env saat ini |
| `--verbose` | boolean | Menampilkan output perintah Docker yang mendasarinya |

## Contoh

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Perintah Terkait

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
