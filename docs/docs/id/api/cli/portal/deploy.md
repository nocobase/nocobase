---
title: "nb portal deploy"
description: "Referensi perintah nb portal deploy: build dan deploy workspace Portal yang ditentukan."
keywords: "nb portal deploy,NocoBase CLI,Portal,build,deploy"
---

# nb portal deploy

Build dan deploy workspace Portal yang ditentukan. Biasanya digunakan setelah pengembangan lokal selesai dan Portal perlu diperbarui ke env tujuan.

Saat dijalankan, perintah ini terlebih dahulu menyegarkan `.env` dan `.env.local` di workspace, lalu menjalankan `pnpm build`. Artefak build harus berisi `dist/client/index.html`.

## Penggunaan

```bash
nb portal deploy <portal> [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<portal>` | string | Nama atau slug Portal |
| `--env`, `-e` | string | Nama env CLI. Jika diabaikan, env saat ini digunakan |
| `--no-install` | boolean | Lewati `pnpm install` sebelum build |
| `--yes`, `-y` | boolean | Lewati konfirmasi interaktif ketika `--env` eksplisit menunjuk ke env yang berbeda dari env saat ini |

## Contoh

Deploy Portal pada env saat ini:

```bash
nb portal deploy customer
```

Deploy Portal pada env tertentu:

```bash
nb portal deploy customer --env dev --yes
```

Lewati instalasi dependensi, lalu hanya build ulang dan deploy:

```bash
nb portal deploy customer --no-install
```

## Catatan

`deploy` ditujukan untuk workspace pengembangan Portal yang sudah ada. Jika workspace lokal belum ada, buat terlebih dahulu dengan [`nb portal create`](./create.md) atau gunakan [`nb portal pull`](./pull.md) untuk menariknya dari source storage.

Deploy akan membangun Portal dari path pengembangan yang tercatat dalam konfigurasi env CLI, lalu menyinkronkan artefak build ke direktori deploy pada storage aplikasi tujuan.

Deploy tidak mengubah source storage atau konfigurasi Git. Konfigurasi tersebut diperbarui ke record Portal remote oleh [`nb portal config`](./config.md).

## Perintah terkait

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
