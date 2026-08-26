---
title: "nb license activate"
description: "Referensi perintah nb license activate: mengaktifkan license key komersial NocoBase yang sudah ada untuk env yang dipilih."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Mengaktifkan license key komersial yang sudah ada untuk env yang dipilih. Kamu bisa memberikannya langsung, membacanya dari file, atau menempelkannya di terminal interaktif.

## Penggunaan

```bash
nb license activate [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--key` | string | Berikan langsung license key komersial yang sudah ada |
| `--key-file` | string | Baca license key komersial yang sudah ada dari file |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Catatan

Saat dijalankan secara interaktif, CLI lebih dulu menampilkan Hostname dan Instance ID saat ini, lalu meminta kamu menempelkan license key secara langsung atau memasukkan path file key. Informasi itu membantu kamu memastikan lisensi terikat ke instance yang benar.

Setelah aktivasi berhasil, restart aplikasi agar lisensi dan status plugin komersial benar-benar berlaku; sebelum restart, CLI akan otomatis menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini:

```bash
nb app restart
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
