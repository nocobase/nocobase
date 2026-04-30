---
title: "nb env"
description: "Referensi perintah nb env: mengelola env NocoBase CLI, termasuk menambahkan, memuat ulang, melihat, beralih, autentikasi, dan menghapus."
keywords: "nb env,NocoBase CLI,manajemen lingkungan,env,autentikasi,OpenAPI"
---

# nb env

Mengelola env NocoBase CLI yang tersimpan. Env menyimpan alamat API, informasi autentikasi, path aplikasi lokal, konfigurasi database, dan cache perintah runtime.

## Penggunaan

```bash
nb env <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb env add`](./add.md) | Menyimpan endpoint API NocoBase dan mengubahnya menjadi env saat ini |
| [`nb env update`](./update.md) | Memuat ulang OpenAPI Schema dan cache perintah runtime dari aplikasi |
| [`nb env list`](./list.md) | Menampilkan daftar env yang sudah dikonfigurasi dan status autentikasi API |
| [`nb env info`](./info.md) | Melihat informasi detail satu env |
| [`nb env remove`](./remove.md) | Menghapus konfigurasi env |
| [`nb env auth`](./auth.md) | Melakukan login OAuth pada env yang tersimpan |
| [`nb env use`](./use.md) | Beralih env saat ini |

## Contoh

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
