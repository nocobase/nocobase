---
title: 'nb db stop'
description: 'Referensi perintah nb db stop: menghentikan kontainer database bawaan untuk env yang ditentukan.'
keywords: 'nb db stop,NocoBase CLI,hentikan database,Docker'
---

# nb db stop

Menghentikan kontainer database bawaan untuk env yang ditentukan. Perintah ini hanya berlaku untuk env yang mengaktifkan database bawaan yang dikelola CLI.

## Penggunaan

```bash
nb db stop [flags]
```

## Parameter

| Parameter     | Tipe    | Deskripsi                                                                                      |
| ------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nama env CLI yang database bawaannya akan dihentikan; jika dihilangkan, env saat ini digunakan |
| `--verbose`   | boolean | Menampilkan output perintah Docker yang mendasarinya                                           |

## Contoh

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Perintah terkait

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
