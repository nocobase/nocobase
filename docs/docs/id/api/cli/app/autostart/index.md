---
title: "nb app autostart"
description: "Referensi grup perintah nb app autostart: aktifkan atau nonaktifkan autostart untuk env local atau Docker, lalu jalankan semua env yang diaktifkan sekaligus."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Mengelola pengaturan autostart aplikasi.

Grup perintah ini mencakup dua jenis pekerjaan:

- mengaktifkan atau menonaktifkan tanda autostart untuk satu env
- menjalankan semua env yang sudah mengaktifkan autostart

`nb app autostart` hanya berlaku untuk env dengan runtime yang dikelola CLI pada mesin saat ini, yaitu `local` dan `docker`. Jika sebuah env hanya berupa koneksi API jarak jauh, atau bukan runtime aplikasi yang dikelola CLI dan dapat dijalankan di mesin ini, env tersebut tidak bisa ikut dalam alur autostart ini.

## Penggunaan

```bash
nb app autostart <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Mengaktifkan tanda autostart untuk satu env |
| [`nb app autostart disable`](./disable.md) | Menonaktifkan tanda autostart untuk satu env |
| [`nb app autostart list`](./list.md) | Menampilkan status autostart semua env |
| [`nb app autostart run`](./run.md) | Menjalankan semua env yang autostart-nya aktif |

## Catatan

`nb app autostart enable` hanya menandai sebuah env agar boleh dijalankan otomatis. Perintah ini tidak otomatis menghubungkannya ke alur startup sistem Anda. Dalam setup production nyata, biasanya Anda tetap perlu memanggil `nb app autostart run` dari mekanisme startup host Anda sendiri, misalnya `systemd`, script startup platform container, atau proses boot lain yang sudah Anda gunakan.

Selain itu, `nb app autostart run` memeriksa setiap env yang diaktifkan satu per satu. Env yang bisa dijalankan akan lanjut secara internal melalui `nb app start --env <name> --yes`. Env yang seharusnya tidak dijalankan otomatis di mesin saat ini akan muncul sebagai `skipped` atau `failed` di tabel hasil.

## Contoh

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Perintah terkait

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
