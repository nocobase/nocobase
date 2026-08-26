---
title: "nb env update"
description: "Referensi perintah nb env update: perbarui konfigurasi API, autentikasi, source code, aplikasi, dan database yang tersimpan."
keywords: "nb env update,NocoBase CLI,konfigurasi env,autentikasi,database,source code"
---

# nb env update

`nb env update` memperbarui konfigurasi dari env yang tersimpan. Kamu bisa menggunakannya untuk menyesuaikan alamat API, metode autentikasi, asal source code, path aplikasi lokal, public path, port, parameter database, dan lainnya. Setelah pembaruan selesai, CLI akan otomatis menangani langkah lanjutan yang diperlukan sesuai perubahan tersebut.

Jika kamu tidak memberikan parameter konfigurasi apa pun, CLI tetap akan melakukan sinkronisasi ulang berdasarkan status env saat ini.

## Penggunaan

```bash
nb env update [name] [flags]
```

## Opsi umum

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `[name]` | string | Nama env terkonfigurasi yang akan diperbarui. Jika dihilangkan, env saat ini yang digunakan |
| `--verbose` | boolean | Menampilkan progres secara detail |

## Opsi API dan autentikasi

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL API NocoBase, termasuk prefix `/api` |
| `--auth-type` | string | Metode autentikasi: `basic`, `token`, atau `oauth` |
| `--access-token`, `--token`, `-t` | string | API key atau access token yang digunakan untuk autentikasi `token`. Menyimpannya juga akan mengganti tipe autentikasi menjadi `token` |
| `--username` | string | Username yang disimpan untuk autentikasi `basic`. Gunakan hanya ketika env saat ini sudah memakai `basic`, atau bersama `--auth-type basic` |

## Opsi source dan unduhan

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `--source` | string | Source aplikasi yang tersimpan: `docker`, `git`, `local`, atau `npm` |
| `--download-version`, `--version` | string | Pemilih versi yang tersimpan: tag Docker, versi paket npm, atau Git ref |
| `--docker-registry` | string | Nama registry image Docker, tanpa tag |
| `--docker-platform` | string | Platform image Docker: `auto`, `linux/amd64`, atau `linux/arm64` |
| `--git-url` | string | URL repository Git |
| `--npm-registry` | string | Registry yang dipakai untuk unduhan npm atau Git dan pemasangan dependency |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Apakah `devDependencies` perlu dipasang untuk source npm atau Git |
| `--build` / `--no-build` | boolean | Apakah build dijalankan otomatis setelah unduhan npm atau Git |
| `--build-dts` / `--no-build-dts` | boolean | Apakah file deklarasi TypeScript perlu dibuat saat build |

## Opsi aplikasi

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `--app-path` | string | Direktori aplikasi. Ini sekarang menjadi cara yang direkomendasikan untuk mengelola path aplikasi lokal |
| `--app-public-path` | string | Public path aplikasi (`APP_PUBLIC_PATH`), seperti `/` atau `/nocobase/` |
| `--app-port` | string | Port HTTP aplikasi |
| `--cdn-base-url` | string | URL dasar CDN untuk aset statis sisi klien (`CDN_BASE_URL`) |
| `--app-key` | string | Kunci aplikasi (`APP_KEY`) |
| `--timezone` | string | Zona waktu aplikasi (`TZ`) |

## Opsi database

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Apakah menggunakan database bawaan yang dikelola CLI |
| `--db-dialect` | string | Jenis database: `postgres`, `mysql`, `mariadb`, atau `kingbase` |
| `--builtin-db-image` | string | Image container yang digunakan untuk database bawaan |
| `--db-host` | string | Host database |
| `--db-port` | string | Port database |
| `--db-database` | string | Nama database |
| `--db-user` | string | Username database |
| `--db-password` | string | Password database |
| `--db-schema` | string | Schema database. Ini biasanya hanya digunakan oleh PostgreSQL |
| `--db-table-prefix` | string | Prefix tabel |
| `--db-underscored` / `--no-db-underscored` | boolean | Apakah nama tabel dan nama field menggunakan gaya underscore |

## Pembersihan konfigurasi

| Opsi | Tipe | Deskripsi |
| --- | --- | --- |
| `--unset` | string[] | Mengosongkan satu atau beberapa field yang tersimpan berdasarkan nama flag. Kamu bisa mengulang opsi ini atau memberikan daftar yang dipisahkan koma, seperti `--unset git-url,username` |

## Catatan

:::tip

Jika kamu hanya ingin CLI melakukan sinkronisasi ulang berdasarkan status terbaru dari env saat ini, cukup jalankan `nb env update` atau `nb env update <name>` tanpa opsi tambahan.

:::

- Setelah pembaruan selesai, CLI akan otomatis menangani sinkronisasi lanjutan yang diperlukan berdasarkan perubahan yang dibuat kali ini
- Opsi lainnya hanya memperbarui konfigurasi env yang tersimpan. Opsi ini tidak otomatis me-restart aplikasi atau mengganti source code lokal maupun image Docker
- Setelah mengubah pengaturan seperti `app-path`, `app-port`, `timezone`, atau `db-*`, CLI biasanya akan menyarankan kamu menjalankan `nb app restart --env <name>`; jika perubahan menyangkut database bawaan yang dikelola CLI, CLI akan menyarankan `nb app restart --env <name> --with-db`
- Setelah mengubah pengaturan seperti `app-port`, `app-public-path`, atau `cdn-base-url` yang memengaruhi hasil reverse proxy, jalankan ulang `nb proxy nginx generate` atau `nb proxy caddy generate` jika kamu sudah memakai konfigurasi proxy hasil generate
- Saat memperbarui pengaturan source seperti `source`, `download-version`, `docker-registry`, `git-url`, atau `npm-registry`, hanya nilai yang tersimpan yang berubah. Source code lokal, dependency, dan image yang sudah ada tidak diganti secara otomatis
- `--access-token` tidak dapat digunakan bersama `--auth-type basic` atau `--auth-type oauth`
- Field yang sama tidak bisa digunakan bersamaan dengan `--unset` dan nilai eksplisit. Misalnya, jangan gunakan `--unset git-url` bersama `--git-url ...`
- Jika kamu mengganti metode autentikasi menjadi `basic` atau `oauth`, atau mengosongkan token, biasanya kamu perlu menjalankan `nb env auth <name>` setelah itu

## Contoh

```bash
# Sinkronkan ulang env saat ini berdasarkan status tersimpan terbaru
nb env update

# Sinkronkan ulang env tertentu
nb env update prod

# Perbarui URL API
nb env update prod --api-base-url http://localhost:13000/api

# Perbarui token dan ganti tipe autentikasi menjadi token
nb env update prod --access-token <token>

# Ganti ke autentikasi basic, simpan username, lalu jalankan nb env auth nanti
nb env update prod --auth-type basic --username admin

# Perbarui source dan versi yang tersimpan tanpa langsung mengganti kode lokal
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Sesuaikan port aplikasi dan zona waktu, lalu restart nanti
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Sesuaikan public path dan generate ulang proxy setelahnya jika diperlukan
nb env update local --app-public-path /nocobase/

# Simpan URL dasar CDN untuk aset klien
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Kosongkan field yang tersimpan
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Perintah terkait

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
