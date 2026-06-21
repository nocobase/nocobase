---
title: "nb license status"
description: "Referensi perintah nb license status: menampilkan status lisensi komersial untuk env yang dipilih."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Menampilkan status lisensi komersial untuk env yang dipilih.

## Penggunaan

```bash
nb license status [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--doctor` | boolean | Menjalankan pemeriksaan diagnostik dan saran tambahan |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Catatan

CLI baru ini belum sepenuhnya mengimplementasikan pemeriksaan status lisensi di backend. Perintah ini masih dapat mengembalikan konteks dasar dan placeholder diagnostik, tetapi belum memberikan keputusan lisensi yang lengkap.

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
