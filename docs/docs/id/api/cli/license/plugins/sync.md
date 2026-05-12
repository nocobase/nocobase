---
title: "nb license plugins sync"
description: "Referensi perintah nb license plugins sync: menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini untuk env yang dipilih."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini.

## Penggunaan

```bash
nb license plugins sync [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--dry-run` | boolean | Pratinjau perubahan tanpa menginstal, memperbarui, atau menghapus plugin |
| `--version` | string | Versi registry atau dist-tag yang akan disinkronkan; defaultnya versi workspace saat ini |
| `--verbose` | boolean | Menampilkan log detail per plugin |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Catatan

Jika `--version` tidak diberikan, CLI akan mendeteksi versi aplikasi saat ini secara otomatis dan menggunakannya untuk menentukan versi registry plugin komersial yang harus diunduh.

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
