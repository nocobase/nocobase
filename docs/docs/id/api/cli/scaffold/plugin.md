---
title: "nb scaffold plugin"
description: "Referensi perintah nb scaffold plugin: menghasilkan scaffold plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold plugin"
---

# nb scaffold plugin

Menghasilkan kode scaffold plugin NocoBase.

## Penggunaan

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<pkg>` | string | Nama paket plugin, wajib diisi |
| `--cwd`, `-c` | string | Direktori kerja aplikasi |
| `--force-recreate`, `-f` | boolean | Memaksa pembuatan ulang scaffold plugin |

## Contoh

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Penjelasan

Untuk source app yang dikelola CLI (aplikasi yang dibuat melalui `nb init`), plugin akan dihasilkan di direktori `<app-path>/plugins/`, dan `nb` akan secara otomatis menyinkronkan plugin ke `source/packages/plugins/` untuk alur pengembangan dan build.

Jika plugin target sudah ada, perintah ini akan menghasilkan error secara default. Gunakan `--force-recreate` untuk memaksa pembuatan ulang. Jika di sisi source terdapat konflik direktori atau symbolic link eksternal, Anda perlu menghapus item yang berkonflik secara manual terlebih dahulu sebelum mencoba lagi.

## Perintah Terkait

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
