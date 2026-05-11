---
title: "nb source build"
description: "Referensi perintah nb source build: build proyek source code NocoBase lokal."
keywords: "nb source build,NocoBase CLI,build,source code"
---

# nb source build

Build proyek source code NocoBase lokal. Perintah ini akan meneruskan eksekusi alur build NocoBase lama di direktori root repository.

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
| `--verbose` | boolean | Menampilkan output perintah detail |

## Contoh

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Perintah Terkait

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
