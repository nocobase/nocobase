---
title: "nb session remove"
description: "Referensi perintah nb session remove: menghapus integrasi shell atau runtime untuk `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,hapus integrasi sesi"
---

# nb session remove

Menghapus integrasi sesi untuk `NB_SESSION_ID`.

Perintah ini membersihkan konfigurasi shell yang sebelumnya ditulis oleh [`nb session setup`](./setup.md). Jika integrasi plugin opencode terdeteksi, integrasi itu juga akan dihapus.

## Penggunaan


nb session remove [flags]

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Contoh


nb session remove
nb session remove --shell zsh

## Perintah Terkait

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
