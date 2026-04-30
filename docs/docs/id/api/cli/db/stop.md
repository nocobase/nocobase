---
title: "nb db stop"
description: "Referensi perintah nb db stop: menghentikan container database bawaan dari env yang ditentukan."
keywords: "nb db stop,NocoBase CLI,menghentikan database,Docker"
---

# nb db stop

Menghentikan container database bawaan dari env yang ditentukan. Perintah ini hanya berlaku untuk env yang mengaktifkan database bawaan yang dikelola CLI.

## Penggunaan

```bash
nb db stop [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dihentikan database bawaannya, jika dilewati menggunakan env saat ini |
| `--verbose` | boolean | Menampilkan output perintah Docker yang mendasarinya |

## Contoh

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Perintah Terkait

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
