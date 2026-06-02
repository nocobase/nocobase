---
title: "nb env"
description: "Referensi perintah nb env: mengelola env NocoBase CLI, termasuk menambahkan, melihat env saat ini, memeriksa status, beralih, autentikasi, dan menghapus."
keywords: "nb env,NocoBase CLI,manajemen lingkungan,env,env saat ini,autentikasi,OpenAPI"
---

# nb env

Mengelola env NocoBase CLI yang tersimpan. Env menyimpan alamat API, informasi autentikasi, path aplikasi lokal, konfigurasi database, dan cache perintah runtime.

Pada model saat ini, CLI memisahkan dua konsep:

- `current env`: env yang digunakan oleh shell atau runtime agent aktif, diisolasi dengan `NB_SESSION_ID` jika tersedia
- `last env`: env terakhir yang digunakan secara global, dipakai sebagai fallback saat session mode tidak aktif

## Penggunaan


nb env <command>

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb env add`](./add.md) | Menyimpan endpoint API NocoBase dan beralih ke env tersebut |
| [`nb env current`](./current.md) | Menampilkan env yang sedang efektif |
| [`nb env update`](./update.md) | Memuat ulang OpenAPI Schema dan cache perintah runtime dari aplikasi |
| [`nb env list`](./list.md) | Menampilkan env yang dikonfigurasi |
| [`nb env status`](./status.md) | Menampilkan status env saat ini, satu env, atau semua env |
| [`nb env info`](./info.md) | Melihat informasi detail satu env |
| [`nb env remove`](./remove.md) | Hentikan runtime terkelola jika ada, lalu hapus konfigurasi env |
| [`nb env auth`](./auth.md) | Melakukan login OAuth pada env yang tersimpan |
| [`nb env use`](./use.md) | Beralih env saat ini |

## Contoh


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode adalah rekomendasi default. Ini menjaga `current env` tetap terisolasi di antara terminal, shell, dan runtime agent yang berbeda, sehingga pekerjaan paralel tidak saling memengaruhi.

Saat session mode tidak aktif, `nb env use` memperbarui `last env` global, dan sesi lain tanpa isolasi juga bisa terpengaruh.

Aktifkan dengan [`nb session setup`](../session/setup.md).

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
