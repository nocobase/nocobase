---
title: "nb app autostart enable"
description: "Referensi nb app autostart enable: aktifkan autostart aplikasi untuk satu env local atau Docker."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Mengaktifkan tanda autostart aplikasi untuk satu env.

Tanda ini hanya berlaku untuk env `local` atau `docker` yang runtime-nya dikelola CLI pada mesin saat ini. Perintah ini tidak langsung menjalankan aplikasi. Sebaliknya, env tersebut akan ditambahkan ke himpunan yang nantinya bisa dijalankan oleh `nb app autostart run`.

## Penggunaan

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Tipe | Deskripsi |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan ditambahkan ke autostart. Jika dihilangkan, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Lewati konfirmasi interaktif saat `--env` eksplisit menunjuk ke env yang berbeda dari env saat ini |

## Contoh

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Catatan

CLI hanya memeriksa apakah env tujuan berbeda dari env saat ini ketika Anda memberikan `--env` secara eksplisit. Di terminal interaktif, CLI akan meminta konfirmasi terlebih dahulu. Di terminal non-interaktif atau alur AI agent, Anda perlu menambahkan `--yes` sendiri, atau berpindah dulu ke env tujuan dengan `nb env use <name>`.

Jika env tujuan bukan runtime `local` atau `docker` yang dikelola CLI pada mesin saat ini, perintah akan gagal dan tidak menyimpan tanda autostart.

## Perintah terkait

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
