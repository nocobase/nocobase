---
title: "nb app down"
description: "Referensi perintah nb app down: menghentikan dan membersihkan resource runtime lokal dari env yang ditentukan."
keywords: "nb app down,NocoBase CLI,membersihkan resource,menghapus container,storage"
---

# nb app down

Menghentikan dan membersihkan resource runtime lokal dari env yang ditentukan. Secara default, data storage dan konfigurasi env akan dipertahankan; saat menghapus seluruh konten Anda harus secara eksplisit menyertakan `--all --yes`.

## Penggunaan

```bash
nb app down [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dibersihkan, jika dilewati menggunakan env saat ini |
| `--all` | boolean | Hapus semua konten env tersebut, termasuk data storage dan konfigurasi env yang tersimpan |
| `--yes`, `-y` | boolean | Lewati konfirmasi operasi destruktif, biasanya digunakan bersama `--all` |
| `--verbose` | boolean | Menampilkan output perintah stop dan cleanup yang mendasarinya |

## Contoh

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
