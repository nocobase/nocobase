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
| `--dry-run` | boolean | Pratinjau perubahan tanpa memasang, memperbarui, atau menghapus plugin |
| `--version` | string | Versi registry atau dist-tag yang akan disinkronkan; default memakai versi workspace saat ini |
| `--skip-if-no-license` | boolean | Lewati tanpa error saat env saat ini belum memiliki license key yang tersimpan |
| `--verbose` | boolean | Menampilkan log detail untuk setiap plugin |
| `--json` | boolean | Keluaran JSON |

## Contoh

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Catatan

Saat `--version` diabaikan, CLI akan mendeteksi versi aplikasi saat ini secara otomatis dan memakainya untuk menentukan versi registry plugin komersial yang perlu diunduh.

`--skip-if-no-license` hanya mengabaikan satu kondisi: env saat ini belum memiliki license key yang tersimpan. Error lain, seperti kredensial registry yang hilang di license key, kegagalan login registry, atau kegagalan mengunduh plugin, akan tetap ditampilkan seperti biasa.

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
