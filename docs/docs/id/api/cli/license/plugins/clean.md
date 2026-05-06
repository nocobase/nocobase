---
title: "nb license plugins clean"
description: "Referensi perintah nb license plugins clean: menghapus plugin komersial yang diunduh untuk env yang dipilih."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Menghapus plugin komersial yang diunduh untuk env yang dipilih tanpa mengubah status aktivasi lisensi.

## Penggunaan

```bash
nb license plugins clean [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--dry-run` | boolean | Pratinjau plugin yang akan dihapus tanpa benar-benar menghapus apa pun |
| `--verbose`, `-V` | boolean | Menampilkan log detail per plugin |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Perintah Terkait

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
