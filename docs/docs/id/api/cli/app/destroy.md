---
title: "nb app destroy"
description: "Referensi perintah nb app destroy: menghapus resource runtime terkelola, data storage, dan konfigurasi env yang tersimpan untuk env yang dipilih."
keywords: "nb app destroy,NocoBase CLI,menghancurkan env,cleanup,menghapus storage"
---

# nb app destroy

Menghancurkan env yang dipilih dengan menghapus resource runtime terkelola, data storage, dan konfigurasi CLI env yang tersimpan.

Untuk env local dan Docker, perintah ini terlebih dahulu menghapus resource runtime aplikasi yang dikelola pada mesin ini, juga menghapus runtime database bawaan jika ada, menghapus data storage, lalu menghapus konfigurasi CLI env yang tersimpan. Untuk env HTTP dan SSH, perintah ini hanya menghapus konfigurasi CLI env yang tersimpan dan tidak menyentuh layanan eksternal.

Untuk env local npm/Git hasil unduhan, perintah ini juga menghapus file aplikasi lokal yang dikelola CLI. Untuk path app local kustom, file source code lokal akan tetap dipertahankan dan hanya resource runtime terkelola, data storage, serta konfigurasi env yang tersimpan yang dihapus.

Secara default, perintah akan meminta konfirmasi. Dalam mode non-interaktif, Anda harus memberikan `--env` dan `--force` secara eksplisit.

## Penggunaan

```bash
nb app destroy [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama CLI env yang akan dihancurkan; dalam mode interaktif, env saat ini digunakan secara default jika tidak diberikan |
| `--force`, `-f` | boolean | Lewati konfirmasi dan langsung hancurkan env yang dipilih; wajib dalam mode non-interaktif |
| `--verbose` | boolean | Menampilkan output mentah dari perintah destroy |

## Contoh

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
