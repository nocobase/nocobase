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
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--dry-run` | boolean | Pratinjau plugin yang akan dihapus tanpa benar-benar menghapus apa pun |
| `--verbose` | boolean | Menampilkan log detail per plugin |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
