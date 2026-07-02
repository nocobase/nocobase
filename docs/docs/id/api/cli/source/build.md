---
title: "nb source build"
description: "Referensi perintah nb source build: build proyek source code NocoBase lokal."
keywords: "nb source build,NocoBase CLI,build,source code"
---

# nb source build

Build proyek source code NocoBase lokal. Perlu dijalankan di direktori source code (`<app-path>/source/`). Untuk source app yang dikelola CLI, plugin di direktori `plugins/` akan secara otomatis disinkronkan ke `source/packages/plugins/` sebelum build.

## Penggunaan

```bash
nb source build [packages...] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[packages...]` | string[] | Nama paket yang akan di-build, jika dilewati akan build semua |
| `--cwd`, `-c` | string | Direktori kerja |
| `--no-dts` | boolean | Tidak menghasilkan file deklarasi `.d.ts` |
| `--sourcemap` | boolean | Menghasilkan sourcemap |
| `--tar` | boolean | Otomatis mengemas menjadi file `.tgz` setelah build selesai |
| `--verbose` | boolean | Menampilkan output perintah detail |

## Contoh

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Penjelasan

Saat menggunakan `--tar`, setelah build selesai plugin yang ditentukan akan dikemas menjadi file `.tgz` dan disimpan ke direktori `source/storage/tar/`. Path lengkap tarball akan ditampilkan saat perintah selesai.

## Perintah Terkait

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
