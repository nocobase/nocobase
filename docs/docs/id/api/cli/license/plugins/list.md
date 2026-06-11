---
title: "nb license plugins list"
description: "Referensi perintah nb license plugins list: menampilkan plugin komersial yang terkait dengan lisensi saat ini untuk env yang dipilih."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Menampilkan plugin komersial yang terkait dengan license key tersimpan untuk env yang dipilih.

## Penggunaan

```bash
nb license plugins list [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
