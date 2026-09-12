---
title: "nb env status"
description: "Referensi perintah nb env status: menampilkan status untuk env saat ini, satu env, atau semua env."
keywords: "nb env status,NocoBase CLI,status environment,API Base URL"
---

# nb env status

Menampilkan status env. Secara default, perintah ini memeriksa env saat ini. Anda juga bisa memeriksa satu env tertentu, atau gunakan `--all` untuk semua env.

Perintah ini mencetak tabel status yang disederhanakan dengan `Env`, `Status`, dan `API Base URL`.

## Penggunaan


nb env status [name] [flags]

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama env yang sudah dikonfigurasi untuk dilihat; jika dihilangkan, menggunakan env saat ini dan tidak dapat digunakan bersama `--all` |
| `--all` | boolean | Tampilkan status semua env yang telah dikonfigurasi |
| `--json-output` | boolean | Keluarkan hasil sebagai JSON |

`[name]` dan `--all` tidak dapat digunakan bersama.

## Status values

`Status` adalah hasil yang dikembalikan setelah CLI memeriksa env target. Nilai umum meliputi:

- `ok`: env dapat dijangkau dan autentikasi berhasil
- `auth failed`: API dapat dijangkau, tetapi autentikasi gagal
- `unreachable`: alamat target tidak dapat dijangkau
- `unconfigured`: konfigurasi env belum lengkap
- `missing`: app terkelola untuk env ini sudah tidak ada

## Contoh


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Perintah Terkait

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
