---
title: "NocoBase CLI"
description: "Referensi NocoBase CLI (perintah nb): inisialisasi, manajemen lingkungan, runtime aplikasi, source code, database, plugin, API, pembaruan mandiri CLI dan manajemen Skills."
keywords: "NocoBase CLI,nb,command line,referensi perintah,manajemen lingkungan,manajemen plugin,API"
---

# NocoBase CLI

## Deskripsi

NocoBase CLI (`nb`) adalah entry point command line dari NocoBase, digunakan untuk menginisialisasi, menghubungkan, dan mengelola aplikasi NocoBase di workspace lokal.

CLI ini mendukung dua jalur inisialisasi umum:

- Menghubungkan aplikasi NocoBase yang sudah ada, dan menyimpannya sebagai env CLI
- Menginstal aplikasi NocoBase baru melalui Docker, npm, atau Git, lalu menyimpannya sebagai env CLI

Saat membuat aplikasi lokal baru, [`nb init`](./init.md) juga dapat menginstal atau memperbarui NocoBase AI coding skills. Jika Anda perlu melewati langkah ini, Anda dapat menggunakan `--skip-skills`.

## Penggunaan

```bash
nb [command]
```

Perintah root sendiri terutama digunakan untuk menampilkan help, dan mendistribusikan panggilan ke grup perintah atau perintah independen.

## Grup Perintah (Topics)

Grup perintah berikut akan ditampilkan di `nb --help`:

| Grup Perintah | Penjelasan |
| --- | --- |
| [`nb api`](./api/index.md) | Memanggil API NocoBase melalui CLI. |
| [`nb app`](./app/index.md) | Mengelola runtime aplikasi: start, stop, restart, logs, dan upgrade. |
| [`nb db`](./db/index.md) | Mengelola database bawaan dari env yang dipilih. |
| [`nb env`](./env/index.md) | Mengelola lingkungan proyek NocoBase, status, detail, dan perintah runtime. |
| [`nb plugin`](./plugin/index.md) | Mengelola plugin dari env NocoBase yang dipilih. |
| [`nb scaffold`](./scaffold/index.md) | Menghasilkan scaffold pengembangan plugin NocoBase. |
| [`nb self`](./self/index.md) | Memeriksa atau memperbarui NocoBase CLI itu sendiri. |
| [`nb skills`](./skills/index.md) | Memeriksa atau menyinkronkan NocoBase AI coding skills di workspace saat ini. |
| [`nb source`](./source/index.md) | Mengelola proyek source code lokal: download, dev, build, dan test. |

## Perintah (Commands)

Perintah independen yang langsung diekspos oleh perintah root saat ini:

| Perintah | Penjelasan |
| --- | --- |
| [`nb init`](./init.md) | Menginisialisasi NocoBase, sehingga coding agent dapat terhubung dan bekerja. |

## Melihat Bantuan

Lihat help perintah root:

```bash
nb --help
```

Lihat help perintah atau grup perintah tertentu:

```bash
nb init --help
nb app --help
nb api resource --help
```

## Contoh

Inisialisasi interaktif:

```bash
nb init
```

Inisialisasi menggunakan formulir browser:

```bash
nb init --ui
```

Membuat aplikasi Docker secara non-interaktif:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Menghubungkan aplikasi yang sudah ada:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Memulai aplikasi dan memuat ulang perintah runtime:

```bash
nb app start -e app1
nb env update app1
```

Memanggil API:

```bash
nb api resource list --resource users -e app1
```

## Variabel Lingkungan

Variabel lingkungan berikut akan memengaruhi perilaku CLI:

| Variabel | Penjelasan |
| --- | --- |
| `NB_CLI_ROOT` | Direktori root tempat CLI menyimpan konfigurasi `.nocobase` dan file aplikasi lokal. Defaultnya adalah direktori home pengguna saat ini. |
| `NB_LOCALE` | Bahasa prompt CLI dan UI inisialisasi lokal, mendukung `en-US` dan `zh-CN`. |

Contoh:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## File Konfigurasi

File konfigurasi default:

```text
~/.nocobase/config.json
```

Setelah mengatur `NB_CLI_ROOT=/your/workspace`, path file konfigurasi akan menjadi:

```text
/your/workspace/.nocobase/config.json
```

CLI juga kompatibel untuk membaca konfigurasi project lama di direktori kerja saat ini.

Cache perintah runtime disimpan di:

```text
.nocobase/versions/<hash>/commands.json
```

File ini dihasilkan atau dimuat ulang oleh [`nb env update`](./env/update.md), digunakan untuk men-cache perintah runtime yang disinkronkan dari aplikasi target.

## Tautan Terkait

- [Mulai Cepat](../../ai/quick-start.mdx)
- [Instalasi, Upgrade, dan Migrasi](../../ai/install-upgrade-migration.mdx)
- [Variabel Lingkungan Global](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Pengembangan Plugin](../../plugin-development/index.md)
