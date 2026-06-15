---
title: "nb app autostart list"
description: "Referensi nb app autostart list: tampilkan status autostart untuk semua env yang dikonfigurasi."
keywords: "nb app autostart list,NocoBase CLI,autostart,daftar env"
---

# nb app autostart list

Menampilkan status autostart untuk semua env yang dikonfigurasi.

Tabel output mencakup:

- `Current`: menandai env saat ini dengan `*`
- `Env`: nama env
- `Kind`: jenis env
- `Source`: tipe instalasi atau sumber
- `Autostart`: apakah autostart diaktifkan

## Penggunaan

```bash
nb app autostart list
```

## Contoh

```bash
nb app autostart list
```

## Catatan

Jika belum ada env yang tersimpan, perintah akan menampilkan `No environments are configured.`.

Perintah ini hanya menampilkan status yang tersimpan di CLI. Perintah ini tidak memeriksa apakah aplikasi sedang berjalan, dan juga tidak memeriksa apakah alur startup sistem Anda sudah memanggil `nb app autostart run`. Tujuan utamanya adalah menunjukkan env mana saja yang ditandai untuk autostart di konfigurasi CLI.

## Perintah terkait

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
