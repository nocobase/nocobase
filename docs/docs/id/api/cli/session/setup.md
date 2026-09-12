---
title: "nb session setup"
description: "Referensi perintah nb session setup: memasang integrasi shell atau runtime untuk `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,integrasi shell"
---

# nb session setup

Memasang integrasi sesi untuk `NB_SESSION_ID`.

Perintah ini mendeteksi shell saat ini, atau menggunakan shell yang Anda berikan lewat `--shell`, lalu menulis file inisialisasi yang sesuai agar sesi shell baru otomatis mendapatkan `NB_SESSION_ID`.

Jika konfigurasi opencode terdeteksi pada mesin, perintah ini juga menulis integrasi plugin terkait agar runtime agent dapat menyuntikkan `NB_SESSION_ID` miliknya sendiri.

## Penggunaan


nb session setup [flags]

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Catatan

Dalam kebanyakan kasus, Anda hanya perlu menjalankan perintah ini sekali.

Setelah selesai, buka sesi shell baru atau muat ulang profile Anda agar `NB_SESSION_ID` terinisialisasi otomatis.

Di runtime agent seperti Codex, jika sudah ada variabel konteks seperti `CODEX_THREAD_ID`, CLI akan menggunakan nilai itu lebih dulu.

## Contoh


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Perintah Terkait

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
