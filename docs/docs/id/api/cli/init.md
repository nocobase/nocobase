---
title: "nb init"
description: "Referensi perintah nb init: menginisialisasi NocoBase, menghubungkan aplikasi yang sudah ada atau menginstal aplikasi baru, dan menyimpannya sebagai env CLI."
keywords: "nb init,NocoBase CLI,inisialisasi,env,Docker,npm,Git"
---

# nb init

Menginisialisasi workspace saat ini sehingga coding agent dapat terhubung dan menggunakan NocoBase. `nb init` dapat menghubungkan aplikasi yang sudah ada, atau menginstal aplikasi baru melalui Docker, npm, atau Git.

## Penggunaan

```bash
nb init [flags]
```

## Penjelasan

`nb init` mendukung tiga mode prompt:

- Mode default: mengisi langkah demi langkah di terminal.
- `--ui`: membuka formulir browser lokal untuk menyelesaikan alur panduan.
- `--yes`: melewati prompt dan menggunakan nilai default. Mode ini harus disertai `--env <envName>`, dan akan membuat aplikasi lokal baru.

Secara default, `nb init` akan menginstal atau memperbarui NocoBase AI coding skills saat menginisialisasi atau melanjutkan inisialisasi. Jika Anda sudah mengelola skills sendiri, atau menjalankan di lingkungan CI atau offline, Anda dapat menggunakan `--skip-skills` untuk melewati langkah ini.

Jika inisialisasi terganggu setelah konfigurasi env tersimpan, Anda dapat menggunakan `--resume` untuk melanjutkan:

```bash
nb init --env app1 --resume
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Lewati prompt, gunakan flags dan nilai default |
| `--env`, `-e` | string | Nama env untuk inisialisasi ini, wajib diisi pada mode `--yes` dan `--resume` |
| `--ui` | boolean | Buka wizard visual browser, tidak dapat digunakan bersama `--yes` |
| `--verbose` | boolean | Tampilkan output perintah secara detail |
| `--skip-skills` | boolean | Lewati instalasi atau pembaruan NocoBase AI coding skills selama inisialisasi |
| `--ui-host` | string | Alamat binding layanan lokal `--ui`, default `127.0.0.1` |
| `--ui-port` | integer | Port layanan lokal `--ui`, `0` berarti dialokasikan otomatis |
| `--locale` | string | Bahasa prompt CLI dan UI: `en-US` atau `zh-CN` |
| `--api-base-url`, `-u` | string | Alamat API NocoBase, termasuk prefix `/api` |
| `--auth-type`, `-a` | string | Metode autentikasi: `token` atau `oauth` |
| `--access-token`, `-t` | string | API key atau access token yang digunakan untuk metode autentikasi `token` |
| `--resume` | boolean | Gunakan kembali workspace env config yang tersimpan untuk melanjutkan inisialisasi |
| `--lang`, `-l` | string | Bahasa aplikasi NocoBase setelah instalasi |
| `--force`, `-f` | boolean | Konfigurasi ulang env yang sudah ada, dan ganti resource runtime yang konflik jika diperlukan |
| `--app-root-path` | string | Direktori source code aplikasi npm/Git lokal, default `./<envName>/source/` |
| `--app-port` | string | Port aplikasi lokal, default `13000`, mode `--yes` akan otomatis memilih port yang tersedia |
| `--storage-path` | string | Direktori untuk file upload dan data database yang dikelola, default `./<envName>/storage/` |
| `--root-username` | string | Username admin awal |
| `--root-email` | string | Email admin awal |
| `--root-password` | string | Password admin awal |
| `--root-nickname` | string | Nickname admin awal |
| `--builtin-db`, `--no-builtin-db` | boolean | Apakah membuat database bawaan yang dikelola CLI |
| `--db-dialect` | string | Tipe database: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Image container untuk database bawaan |
| `--db-host` | string | Alamat database |
| `--db-port` | string | Port database |
| `--db-database` | string | Nama database |
| `--db-user` | string | User database |
| `--db-password` | string | Password database |
| `--fetch-source` | boolean | Download file aplikasi atau pull image Docker sebelum instalasi |
| `--source`, `-s` | string | Cara mendapatkan NocoBase: `docker`, `npm`, atau `git` |
| `--version`, `-v` | string | Parameter versi: versi npm, tag image Docker, atau ref Git |
| `--replace`, `-r` | boolean | Ganti jika direktori target sudah ada |
| `--dev-dependencies`, `-D` | boolean | Apakah menginstal devDependencies saat instalasi npm/Git |
| `--output-dir`, `-o` | string | Direktori target download, atau direktori untuk menyimpan tarball Docker |
| `--git-url` | string | Alamat repository Git |
| `--docker-registry` | string | Nama registry image Docker, tanpa tag |
| `--docker-platform` | string | Platform image Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Apakah menyimpan sebagai tarball setelah pull image Docker |
| `--npm-registry` | string | Registry yang digunakan untuk download dan instalasi dependensi npm/Git |
| `--build`, `--no-build` | boolean | Apakah build setelah instalasi dependensi npm/Git |
| `--build-dts` | boolean | Apakah menghasilkan file deklarasi TypeScript saat build npm/Git |

## Contoh

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Perintah Terkait

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
