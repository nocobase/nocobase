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
| `--dry-run` | boolean | Pratinjau perubahan tanpa menginstal, memperbarui, atau menghapus plugin |
| `--version` | string | Versi registry atau dist-tag yang akan disinkronkan; defaultnya versi workspace saat ini |
| `--verbose`, `-V` | boolean | Menampilkan log detail per plugin |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Catatan

Jika `--version` tidak diberikan, CLI akan mendeteksi versi aplikasi saat ini secara otomatis dan menggunakannya untuk menentukan versi registry plugin komersial yang harus diunduh.

## Perintah Terkait

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
