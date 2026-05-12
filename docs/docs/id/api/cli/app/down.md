---
title: "nb app down"
description: "Referensi perintah nb app down: menghentikan dan membersihkan resource runtime lokal dari env yang ditentukan."
keywords: "nb app down,NocoBase CLI,membersihkan resource,menghapus container,storage"
---

# nb app down

Menghentikan dan membersihkan resource runtime lokal dari env yang ditentukan. Secara default, data storage dan konfigurasi env akan dipertahankan; saat menghapus seluruh konten Anda harus secara eksplisit menyertakan `--all --force`.

## Penggunaan

```bash
nb app down [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dibersihkan, jika dilewati menggunakan env saat ini |
| `--all` | boolean | Hapus semua konten env tersebut, termasuk data storage dan konfigurasi env yang tersimpan |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--force`, `-f` | boolean | Paksa pembersihan destruktif, seperti `--all` atau pembersihan berisiko tinggi lainnya pada mode non-interaktif |
| `--verbose` | boolean | Menampilkan output perintah stop dan cleanup yang mendasarinya |

## Contoh

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` hanya melewati konfirmasi interaktif saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini. `--force` digunakan untuk benar-benar memaksa pembersihan destruktif, seperti `--all` atau pembersihan berisiko tinggi lainnya pada mode non-interaktif.

## Perintah Terkait

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
