---
title: 'nb app stop'
description: 'Referensi perintah nb app stop: menghentikan aplikasi NocoBase untuk env yang ditentukan, dan bila diperlukan sekaligus membersihkan container database bawaan yang dikelola CLI.'
keywords: 'nb app stop,NocoBase CLI,menghentikan aplikasi,Docker,with-db,database bawaan'
---

# nb app stop

Menghentikan aplikasi NocoBase untuk env yang ditentukan. Pada instalasi npm/Git, ini akan menghentikan proses aplikasi lokal; pada instalasi Docker, ini akan membersihkan container aplikasi yang tersimpan.

Jika Anda memberikan `--with-db` dan env ini menggunakan database bawaan yang dikelola CLI, perintah ini juga akan membersihkan container database. Jika env ini menggunakan database eksternal, resource database tidak akan disentuh.

## Penggunaan

```bash
nb app stop [flags]
```

## Parameter

| Parameter     | Tipe    | Deskripsi                                                                                                   |
| ------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nama CLI env yang akan dihentikan; jika dihilangkan, env saat ini akan digunakan                            |
| `--yes`, `-y` | boolean | Lewati konfirmasi interaktif saat env yang secara eksplisit ditunjuk oleh `--env` berbeda dari env saat ini |
| `--with-db`   | boolean | Sekaligus membersihkan container database jika ada database bawaan yang dikelola CLI                        |
| `--verbose`   | boolean | Menampilkan output perintah lokal atau Docker yang mendasarinya                                             |

## Contoh

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Penjelasan

CLI hanya akan memeriksa apakah env yang ditentukan sama dengan env saat ini jika Anda secara eksplisit memberikan `--env`. Jika Anda secara eksplisit menentukan env yang berbeda, terminal interaktif akan meminta konfirmasi terlebih dahulu; di terminal non-interaktif atau dalam skenario AI agent, Anda perlu menambahkan `--yes` sendiri secara eksplisit, atau menjalankan `nb env use <name>` terlebih dahulu lalu mencoba lagi.

`--with-db` hanya memengaruhi container database bawaan yang dikelola CLI. Secara umum, jika Anda hanya ingin menghentikan aplikasinya saja, Anda tidak perlu menambahkan parameter ini; tambahkan hanya jika Anda juga ingin menghentikan runtime database bawaan di mesin saat ini.

Perintah ini hanya dapat beroperasi pada runtime local atau Docker di mesin saat ini. Jika suatu env hanya berupa koneksi HTTP API, atau merupakan SSH env yang dicadangkan, `nb app stop` tidak dapat menghentikannya dari jarak jauh untuk Anda.

## Perintah terkait

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
