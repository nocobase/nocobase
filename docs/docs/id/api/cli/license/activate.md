---
title: "nb license activate"
description: "Referensi perintah nb license activate: mengaktifkan lisensi komersial NocoBase untuk env yang dipilih."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Mengaktifkan lisensi komersial untuk env yang dipilih. Anda dapat langsung memberikan license key yang sudah ada, atau meminta dan mengaktifkan lisensi secara online.

## Penggunaan

```bash
nb license activate [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI; jika dilewati, env saat ini yang digunakan |
| `--key` | string | Masukkan license key yang sudah ada secara langsung |
| `--key-file` | string | Membaca license key dari file |
| `--online` | boolean | Meminta lisensi secara online dan mengaktifkannya |
| `--account` | string | Akun layanan lisensi untuk aktivasi online |
| `--password` | string | Kata sandi layanan lisensi untuk aktivasi online |
| `--desc` | string | Nama aplikasi untuk aktivasi online |
| `--yes` | boolean | Mengonfirmasi bahwa informasi yang dikirim benar dan akurat |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Catatan

Saat aktivasi online digunakan, CLI meminta license key ke layanan lisensi dengan instance ID dan URL aplikasi dari env saat ini.

## Perintah Terkait

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
