---
title: 'NocoBase CLI'
description: 'Referensi NocoBase CLI (perintah nb): inisialisasi, pencadangan dan pemulihan, konfigurasi, manajemen lingkungan, menjalankan aplikasi, kode sumber, basis data, plugin, lisensi komersial, API, pembaruan mandiri CLI, dan manajemen Skills.'
keywords: 'NocoBase CLI,nb,baris perintah,referensi perintah,pencadangan,pemulihan,manajemen lingkungan,manajemen plugin,lisensi komersial,API'
---

# NocoBase CLI

## Deskripsi

NocoBase CLI (`nb`) adalah titik masuk baris perintah NocoBase, yang digunakan untuk menginisialisasi, menghubungkan, dan mengelola aplikasi NocoBase di ruang kerja lokal.

Ini mendukung dua jalur inisialisasi umum:

- Menghubungkan aplikasi NocoBase yang sudah ada, lalu menyimpannya sebagai CLI env
- Menginstal aplikasi NocoBase baru melalui Docker, npm, atau Git, lalu menyimpannya sebagai CLI env

Saat membuat aplikasi lokal baru, [`nb init`](./init.md) juga dapat menginstal atau memperbarui skill coding AI NocoBase. Jika perlu melewati langkah ini, Anda dapat menggunakan `--skip-skills`.

## Penggunaan

```bash
nb [command]
```

Perintah root sendiri terutama digunakan untuk menampilkan bantuan dan meneruskan pemanggilan ke grup perintah atau perintah mandiri.

## Grup perintah (Topics)

`nb --help` akan menampilkan grup perintah berikut:

| Grup perintah                        | Deskripsi                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`nb api`](./api/index.md)           | Memanggil API NocoBase melalui CLI.                                                              |
| [`nb app`](./app/index.md)           | Mengelola status runtime aplikasi: mulai, berhenti, mulai ulang, log, dan upgrade.               |
| [`nb backup`](./backup/index.md)     | Membuat cadangan dan mengunduhnya ke lokal, atau memulihkan file cadangan lokal ke env target.   |
| [`nb config`](./config/index.md)     | Mengelola konfigurasi default CLI.                                                               |
| [`nb db`](./db/index.md)             | Mengelola basis data bawaan dari env yang dipilih.                                               |
| [`nb env`](./env/index.md)           | Mengelola lingkungan proyek NocoBase, env saat ini, status, detail, dan perintah runtime.        |
| [`nb license`](./license/index.md)   | Mengelola lisensi komersial dan plugin berlisensi.                                               |
| [`nb plugin`](./plugin/index.md)     | Mengelola plugin dari env NocoBase yang dipilih.                                                 |
| [`nb scaffold`](./scaffold/index.md) | Menghasilkan scaffold pengembangan plugin NocoBase.                                              |
| [`nb self`](./self/index.md)         | Memeriksa atau memperbarui NocoBase CLI itu sendiri.                                             |
| [`nb session`](./session/index.md)   | Mengonfigurasi `NB_SESSION_ID` agar current env terisolasi berdasarkan shell atau agent runtime. |
| [`nb skills`](./skills/index.md)     | Memeriksa atau menyinkronkan skill coding AI NocoBase di ruang kerja saat ini.                   |
| [`nb source`](./source/index.md)     | Mengelola proyek kode sumber lokal: unduh, pengembangan, build, dan pengujian.                   |

## Perintah (Commands)

Perintah mandiri yang saat ini diekspos langsung oleh perintah root:

| Perintah               | Deskripsi                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| [`nb init`](./init.md) | Menginisialisasi NocoBase agar coding agent dapat terhubung dan bekerja. |

## Melihat bantuan

Melihat bantuan untuk perintah root:

```bash
nb --help
```

Melihat bantuan untuk perintah atau grup perintah tertentu:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
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
nb env current
nb env status
```

Menyinkronkan ulang status env setelah aplikasi dijalankan:

```bash
nb app start -e app1
nb env update app1
```

Memanggil API:

```bash
nb api resource list --resource users -e app1
```

Melihat konfigurasi default CLI:

```bash
nb config list
nb config get docker.network
```

Melihat status lisensi komersial:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Membuat dan mengunduh cadangan:

```bash
nb backup create -e app1 --output ./backups
```

Memulihkan cadangan lokal:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Variabel lingkungan

Variabel lingkungan berikut memengaruhi perilaku CLI:

| Variabel        | Deskripsi                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Direktori root tempat CLI menyimpan konfigurasi `.nocobase` dan file aplikasi lokal. Default-nya adalah direktori home pengguna saat ini. |
| `NB_LOCALE`     | Bahasa prompt CLI dan bahasa UI inisialisasi lokal, mendukung `en-US` dan `zh-CN`.                                                        |
| `NB_SESSION_ID` | ID sesi dari shell saat ini atau agent runtime. Setelah disetel, `nb env use` dan `nb env current` akan diisolasi per sesi.               |

Contoh:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## File konfigurasi

File konfigurasi default:

```text
~/.nocobase/config.json
```

Setelah mengatur `NB_CLI_ROOT=/your/workspace`, jalur file konfigurasi akan menjadi:

```text
/your/workspace/.nocobase/config.json
```

CLI juga kompatibel untuk membaca konfigurasi project lama di direktori kerja saat ini.

Cache tingkat sesi untuk env saat ini disimpan di:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

Env terakhir yang digunakan secara global disimpan di field `lastEnv` dalam `config.json`. Jika tidak ada `NB_SESSION_ID`, CLI akan kembali ke nilai global ini.

Cache perintah runtime disimpan di:

```text
.nocobase/versions/<hash>/commands.json
```

File ini dibuat atau diperbarui oleh [`nb env update`](./env/update.md), dan digunakan untuk menyimpan cache perintah runtime yang disinkronkan dari aplikasi target.

## Tautan terkait

- [Mulai cepat](../../ai/quick-start.mdx)
- [Variabel lingkungan global](../app/env.md)
- [Pembangunan AI](../../ai-builder/index.md)
- [Pengembangan plugin](../../plugin-development/index.md)
