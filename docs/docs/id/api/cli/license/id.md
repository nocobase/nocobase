---
title: "nb license id"
description: "Referensi perintah nb license id: menampilkan atau membuat ulang instance ID lisensi komersial untuk env yang dipilih."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Menampilkan instance ID lisensi komersial untuk env yang dipilih. Jika belum ada instance ID yang tersimpan, CLI akan membuat dan menyimpannya secara otomatis.

## Penggunaan

```bash
nb license id [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--force` | boolean | Buat ulang instance ID meskipun sudah ada yang tersimpan |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` hanya memaksa regenerasi instance ID. Opsi ini tidak menggantikan konfirmasi lintas env; jika `--env` yang diberikan secara eksplisit menargetkan env yang bukan env saat ini, Anda tetap memerlukan konfirmasi atau `--yes`.

## Perintah Terkait

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
