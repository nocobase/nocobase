---
title: "nb app autostart disable"
description: "Referensi nb app autostart disable: nonaktifkan autostart aplikasi untuk satu env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Menonaktifkan tanda autostart aplikasi untuk satu env.

Setelah dinonaktifkan, env tersebut tidak lagi ikut dalam `nb app autostart run`. Perintah ini tidak langsung menghentikan aplikasi yang sudah berjalan. Jika Anda juga ingin menghentikan runtime yang sedang aktif, gunakan `nb app stop` secara terpisah.

## Penggunaan

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Tipe | Deskripsi |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dihapus dari autostart. Jika dihilangkan, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Lewati konfirmasi interaktif saat `--env` eksplisit menunjuk ke env yang berbeda dari env saat ini |

## Contoh

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Catatan

Perintah ini hanya mengubah tanda autostart yang tersimpan. Aplikasi tidak dihentikan secara langsung. Jika sebuah env memang sebelumnya tidak mengaktifkan autostart, perintah ini hanya akan mempertahankannya tetap nonaktif.

Sama seperti `enable`, CLI hanya memeriksa konfirmasi lintas env saat `--env` diberikan secara eksplisit. Di terminal non-interaktif atau alur AI agent, tambahkan `--yes` sendiri bila diperlukan.

## Perintah terkait

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
