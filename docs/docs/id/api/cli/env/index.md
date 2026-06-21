---
title: "nb env"
description: "Referensi perintah nb env: mengelola env NocoBase CLI yang tersimpan, termasuk menambah, melihat env saat ini, memeriksa status, berpindah, memperbarui, melakukan autentikasi, dan menghapus."
keywords: "nb env,NocoBase CLI,pengelolaan environment,env,current env,autentikasi,OpenAPI"
---

# nb env

Mengelola env NocoBase CLI yang tersimpan. Sebuah env menyimpan detail koneksi dan informasi runtime lokal, seperti alamat API, info autentikasi, path aplikasi lokal, dan konfigurasi database.

Mulai versi ini, CLI memisahkan dua konsep:

- `current env`: env yang sedang digunakan oleh shell atau runtime agent aktif, diisolasi oleh `NB_SESSION_ID` bila memungkinkan
- `last env`: env terakhir yang digunakan secara global, dipakai sebagai fallback saat mode session tidak diaktifkan

## Penggunaan

```bash
nb env <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb env add`](./add.md) | Menyimpan endpoint API NocoBase dan berpindah ke env ini |
| [`nb env current`](./current.md) | Melihat env yang sedang berlaku |
| [`nb env update`](./update.md) | Memperbarui konfigurasi env yang tersimpan dan otomatis menangani sinkronisasi lanjutan bila diperlukan |
| [`nb env list`](./list.md) | Mencantumkan env yang telah dikonfigurasi |
| [`nb env status`](./status.md) | Melihat status env saat ini, env tertentu, atau semua env |
| [`nb env info`](./info.md) | Melihat informasi detail untuk satu env |
| [`nb env remove`](./remove.md) | Menghapus konfigurasi env setelah runtime yang dikelola dihentikan |
| [`nb env auth`](./auth.md) | Melakukan login OAuth untuk env yang tersimpan |
| [`nb env use`](./use.md) | Berpindah ke env saat ini |

## Contoh

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Mode session

Mode session disarankan untuk diaktifkan secara default. Dengan begitu, `current env` di terminal, shell, atau runtime agent yang berbeda dapat tetap terisolasi dan tidak saling memengaruhi secara paralel.

Jika mode session tidak diaktifkan, `nb env use` akan memperbarui `last env` global, dan sesi lain tanpa isolasi session juga akan ikut terpengaruh.

Lihat [`nb session setup`](../session/setup.md) untuk cara mengaktifkannya.

## Perintah terkait

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
