---
title: "nb portal dev"
description: "Referensi perintah nb portal dev: memulai mode pengembangan direktori source lokal Portal yang ditentukan."
keywords: "nb portal dev,NocoBase CLI,Portal,mode pengembangan,pengembangan lokal"
---

# nb portal dev

Memulai mode pengembangan direktori source lokal Portal yang ditentukan. Biasanya digunakan setelah menjalankan [`nb portal create`](./create.md) atau [`nb portal pull`](./pull.md).

Saat dijalankan, perintah ini akan menyegarkan `.env` dan `.env.local` di direktori source lokal, kemudian menjalankan `pnpm dev` di direktori source lokal Portal tersebut.

## Penggunaan

```bash
nb portal dev <portal> [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<portal>` | string | Nama atau slug Portal |
| `--env`, `-e` | string | Nama env CLI. Jika diabaikan, env saat ini yang digunakan |
| `--yes`, `-y` | boolean | Melewati konfirmasi interaktif ketika `--env` yang ditentukan secara eksplisit berbeda dengan env saat ini |

## Contoh

Memulai mode pengembangan Portal di env saat ini:

```bash
nb portal dev customer
```

Memulai mode pengembangan Portal di env tertentu:

```bash
nb portal dev customer --env dev --yes
```

## Catatan

`dev` memulai server pengembangan dari direktori source lokal Portal. Perintah ini tidak membuat record Portal, dan juga tidak menarik source dari remote; jika direktori source lokal belum ada, gunakan terlebih dahulu [`nb portal create`](./create.md) atau [`nb portal pull`](./pull.md).

Direktori source lokal harus berisi `package.json`. Env bertipe `ssh` untuk saat ini belum mendukung memulai mode pengembangan Portal.

## Perintah terkait

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
