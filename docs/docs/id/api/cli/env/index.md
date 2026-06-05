---
title: 'nb env'
description: 'Referensi perintah nb env: kelola env NocoBase CLI, termasuk menambah, melihat current env, memeriksa status, beralih, memperbarui, menghasilkan konfigurasi proxy, mengautentikasi, dan menghapus.'
keywords: 'nb env,NocoBase CLI,pengelolaan lingkungan,env,current env,proxy,autentikasi,OpenAPI'
---

# nb env

Kelola env NocoBase CLI yang tersimpan. Env menyimpan informasi koneksi dan runtime lokal seperti alamat API, informasi autentikasi, path aplikasi lokal, dan konfigurasi database.

Mulai versi ini, CLI memisahkan dua konsep:

- `current env`: env yang sedang digunakan oleh shell atau agent runtime saat ini, diisolasi dengan `NB_SESSION_ID` jika memungkinkan
- `last env`: env terakhir yang digunakan secara global, digunakan sebagai nilai cadangan saat mode sesi tidak diaktifkan

## Penggunaan

```bash
nb env <command>
```

## Subperintah

| Perintah                         | Deskripsi                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Menyimpan endpoint API NocoBase dan beralih ke env ini                                                          |
| [`nb env current`](./current.md) | Melihat env yang saat ini berlaku                                                                               |
| [`nb env update`](./update.md)   | Memperbarui konfigurasi env yang tersimpan dan secara otomatis menangani sinkronisasi lanjutan sesuai kebutuhan |
| [`nb env list`](./list.md)       | Menampilkan daftar env yang sudah dikonfigurasi                                                                 |
| [`nb env status`](./status.md)   | Melihat status env saat ini, env tertentu, atau semua env                                                       |
| [`nb env info`](./info.md)       | Melihat informasi terperinci untuk satu env                                                                     |
| [`nb env proxy`](./proxy.md)   | Menghasilkan konfigurasi proxy Nginx atau Caddy untuk satu env yang dikelola                                     |
| [`nb env remove`](./remove.md)   | Menghapus konfigurasi env setelah menghentikan runtime yang dikelola                                            |
| [`nb env auth`](./auth.md)       | Menjalankan login OAuth untuk env yang tersimpan                                                                |
| [`nb env use`](./use.md)         | Beralih env saat ini                                                                                            |

## Contoh

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Secara default, disarankan untuk mengaktifkan session mode. Dengan begitu, `current env` di terminal yang berbeda, shell yang berbeda, atau agent runtime yang berbeda dapat saling terisolasi dan tidak saling memengaruhi saat berjalan paralel.

Jika session mode tidak diaktifkan, `nb env use` akan memperbarui `last env` global, dan sesi lain yang tidak memiliki isolasi sesi juga akan ikut terpengaruh.

Lihat [`nb session setup`](../session/setup.md) untuk cara mengaktifkannya.

## Perintah terkait

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
