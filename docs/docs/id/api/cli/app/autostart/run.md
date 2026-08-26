---
title: "nb app autostart run"
description: "Referensi nb app autostart run: jalankan semua env yang telah mengaktifkan autostart aplikasi."
keywords: "nb app autostart run,NocoBase CLI,autostart,start massal"
---

# nb app autostart run

Menjalankan semua env yang telah mengaktifkan autostart aplikasi.

Perintah ini biasanya dipanggil setelah sistem host selesai boot, melalui mekanisme startup Anda sendiri. CLI akan membaca semua env yang tersimpan, memfilter env yang mengaktifkan autostart, lalu mencoba menjalankannya satu per satu.

## Penggunaan

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Tipe | Deskripsi |
| --- | --- | --- |
| `--verbose` | boolean | Tampilkan output startup mentah dari perintah local atau Docker yang mendasari |

## Contoh

```bash
nb app autostart run
nb app autostart run --verbose
```

## Catatan

Jika tidak ada env yang mengaktifkan autostart, perintah akan menampilkan `No environments have app autostart enabled.`.

Selama eksekusi, CLI memproses setiap env yang diaktifkan satu per satu:

- env yang bisa dijalankan akan muncul sebagai `started`
- env yang tidak seharusnya dijalankan otomatis di mesin saat ini akan muncul sebagai `skipped`
- env yang gagal saat startup akan muncul sebagai `failed`

Secara internal, perintah ini memanggil `nb app start --env <name> --yes`. Jika Anda memberikan `--verbose`, flag ini juga diteruskan ke alur startup di bawahnya.

Jika ada hasil `failed`, perintah akan keluar dengan error dan menampilkan `Some app autostart envs failed to start.`. Ini membuat kegagalan terlihat jelas di `systemd`, CI, atau mekanisme startup host lainnya.

## Perintah terkait

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
