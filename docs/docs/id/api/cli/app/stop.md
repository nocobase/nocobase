---
title: "nb app stop"
description: "Referensi perintah nb app stop: menghentikan aplikasi NocoBase atau container Docker dari env yang ditentukan."
keywords: "nb app stop,NocoBase CLI,menghentikan aplikasi,Docker"
---

# nb app stop

Menghentikan aplikasi NocoBase dari env yang ditentukan. Instalasi npm/Git akan menghentikan proses aplikasi lokal, instalasi Docker akan menghentikan container aplikasi yang tersimpan.

## Penggunaan

```bash
nb app stop [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dihentikan, jika dilewati menggunakan env saat ini |
| `--verbose` | boolean | Menampilkan output perintah lokal atau Docker yang mendasarinya |

## Contoh

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
