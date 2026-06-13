---
title: "nb session"
description: "Referensi perintah nb session: mengatur dan memeriksa `NB_SESSION_ID` agar env saat ini terisolasi per shell atau runtime agent."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Mengelola session mode untuk `NB_SESSION_ID`.

Setelah session mode aktif, `nb env use` dan `nb env current` akan lebih dulu menggunakan konteks shell atau runtime agent saat ini, alih-alih langsung berbagi satu current env global.

## Penggunaan


nb session <command>

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb session setup`](./setup.md) | Memasang integrasi shell atau runtime untuk `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Menampilkan id sesi efektif saat ini |
| [`nb session remove`](./remove.md) | Menghapus integrasi shell atau runtime untuk `NB_SESSION_ID` |

## Kapan Anda membutuhkannya

Rekomendasi default adalah menjalankan `nb session setup` sekali saat mulai menggunakan CLI. Dengan itu:

- terminal 1 dapat menggunakan `env1`
- terminal 2 dapat menggunakan `env2` pada saat yang sama
- runtime agent juga dapat menyimpan current env-nya sendiri

Tanpa session mode, sesi yang berbeda akan fallback ke `last env` global yang sama, sehingga pekerjaan paralel lebih mudah saling memengaruhi.

## Perintah Terkait

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
