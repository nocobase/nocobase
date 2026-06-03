---
title: 'nb env update'
description: 'Referensi perintah nb env update: memperbarui konfigurasi API, autentikasi, kode sumber, aplikasi, dan database yang telah disimpan.'
keywords: 'nb env update,NocoBase CLI,konfigurasi env,autentikasi,database,kode sumber'
---

# nb env update

`nb env update` digunakan untuk memperbarui konfigurasi env yang sudah disimpan. Anda dapat menggunakannya untuk menyesuaikan alamat API, metode autentikasi, sumber kode, path aplikasi lokal, port, parameter database, dan sebagainya. Setelah pembaruan selesai, CLI akan otomatis menangani langkah lanjutan sesuai perubahan yang dilakukan.

Jika Anda tidak menyertakan parameter konfigurasi apa pun, CLI juga akan melakukan sinkronisasi ulang berdasarkan status env saat ini.

## Penggunaan

```bash
nb env update [name] [flags]
```

## Parameter umum

| Parameter   | Tipe    | Deskripsi                                                                                                      |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `[name]`    | string  | Nama environment yang sudah dikonfigurasi dan ingin diperbarui; jika dihilangkan, env saat ini akan digunakan. |
| `--verbose` | boolean | Menampilkan progres terperinci.                                                                                |

## Parameter API dan autentikasi

| Parameter                         | Tipe   | Deskripsi                                                                                                                                                                     |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | Alamat API NocoBase, termasuk prefix `/api`.                                                                                                                                  |
| `--auth-type`                     | string | Metode autentikasi: `basic`, `token`, `oauth`.                                                                                                                                |
| `--access-token`, `--token`, `-t` | string | API key atau access token yang digunakan untuk autentikasi `token`. Setelah disimpan, metode autentikasi akan dialihkan ke `token`.                                           |
| `--username`                      | string | Nama pengguna yang disimpan untuk autentikasi `basic`. Hanya dapat digunakan jika env saat ini menggunakan autentikasi `basic`, atau jika `--auth-type basic` juga diberikan. |

## Parameter kode sumber dan unduhan

| Parameter                                      | Tipe    | Deskripsi                                                                 |
| ---------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `--source`                                     | string  | Sumber aplikasi yang disimpan: `docker`, `git`, `local`, `npm`.           |
| `--download-version`, `--version`              | string  | Parameter versi yang disimpan: tag Docker, versi paket npm, atau Git ref. |
| `--docker-registry`                            | string  | Nama registry image Docker, tanpa tag.                                    |
| `--docker-platform`                            | string  | Platform image Docker: `auto`, `linux/amd64`, `linux/arm64`.              |
| `--git-url`                                    | string  | Alamat repositori Git.                                                    |
| `--npm-registry`                               | string  | Registry yang digunakan untuk unduhan npm/Git dan instalasi dependensi.   |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Menentukan apakah devDependencies diinstal saat instalasi npm/Git.        |
| `--build` / `--no-build`                       | boolean | Menentukan apakah build dilakukan otomatis setelah unduhan npm/Git.       |
| `--build-dts` / `--no-build-dts`               | boolean | Menentukan apakah file deklarasi TypeScript dibuat saat build.            |

## Parameter aplikasi

| Parameter    | Tipe   | Deskripsi                                                                                                                   |
| ------------ | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Direktori aplikasi. Sekarang secara default disarankan untuk memprioritaskan parameter ini dalam mengelola direktori lokal. |
| `--app-port` | string | Port HTTP aplikasi.                                                                                                         |
| `--app-key`  | string | Kunci aplikasi (`APP_KEY`).                                                                                                 |
| `--timezone` | string | Zona waktu aplikasi (`TZ`).                                                                                                 |

## Parameter database

| Parameter                                  | Tipe    | Deskripsi                                                                    |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | Menentukan apakah menggunakan database bawaan yang dikelola oleh CLI.        |
| `--db-dialect`                             | string  | Jenis database: `postgres`, `mysql`, `mariadb`, `kingbase`.                  |
| `--builtin-db-image`                       | string  | Image container database bawaan.                                             |
| `--db-host`                                | string  | Alamat host database.                                                        |
| `--db-port`                                | string  | Port database.                                                               |
| `--db-database`                            | string  | Nama database.                                                               |
| `--db-user`                                | string  | Nama pengguna database.                                                      |
| `--db-password`                            | string  | Kata sandi database.                                                         |
| `--db-schema`                              | string  | Schema database. Biasanya hanya digunakan oleh PostgreSQL.                   |
| `--db-table-prefix`                        | string  | Prefix tabel database.                                                       |
| `--db-underscored` / `--no-db-underscored` | boolean | Menentukan apakah nama tabel dan field database menggunakan gaya underscore. |

## Parameter pembersihan konfigurasi

| Parameter | Tipe     | Deskripsi                                                                                                                                                                                         |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--unset` | string[] | Mengosongkan satu atau beberapa field yang telah disimpan berdasarkan nama baku flag. Mendukung pengulangan parameter, juga mendukung pemisahan dengan koma, misalnya `--unset git-url,username`. |

## Penjelasan

:::tip

Jika Anda hanya ingin CLI melakukan sinkronisasi ulang berdasarkan status terbaru env saat ini, cukup jalankan `nb env update` atau `nb env update <name>` tanpa parameter tambahan.

:::

- Setelah pembaruan selesai, CLI akan otomatis menangani sinkronisasi lanjutan yang diperlukan berdasarkan perubahan ini.
- Parameter lain hanya akan memperbarui konfigurasi env yang telah disimpan; aplikasi tidak akan otomatis dimulai ulang, dan kode sumber lokal maupun image Docker tidak akan otomatis diganti.
- Setelah mengubah konfigurasi seperti `app-path`, `app-port`, `timezone`, `db-*`, CLI biasanya akan memberi tahu Anda untuk kemudian menjalankan `nb app restart --env <name>`; jika perubahan melibatkan database bawaan yang dikelola CLI, maka akan disarankan menggunakan `nb app restart --env <name> --with-db`.
- Saat memperbarui pengaturan kode sumber seperti `source`, `download-version`, `docker-registry`, `git-url`, `npm-registry`, hanya nilai yang disimpan yang akan diubah. Kode sumber lokal, dependensi, dan image yang sudah ada tidak akan otomatis diganti.
- `--access-token` tidak dapat digunakan bersama `--auth-type basic` atau `--auth-type oauth`.
- Field yang sama tidak dapat menggunakan `--unset` dan penetapan nilai eksplisit secara bersamaan. Misalnya, Anda tidak dapat menulis `--unset git-url` dan `--git-url ...` pada saat yang sama.
- Jika Anda mengubah metode autentikasi ke `basic` atau `oauth`, atau mengosongkan token, biasanya Anda masih perlu menjalankan `nb env auth <name>` setelahnya.

## Contoh

```bash
# Menyinkronkan ulang env saat ini berdasarkan status terbaru
nb env update

# Menyinkronkan ulang env yang ditentukan berdasarkan status terbaru
nb env update prod

# Memperbarui alamat API
nb env update prod --api-base-url http://localhost:13000/api

# Memperbarui token dan mengalihkan metode autentikasi ke token
nb env update prod --access-token <token>

# Beralih ke autentikasi basic, hanya menyimpan nama pengguna, lalu menjalankan nb env auth nanti
nb env update prod --auth-type basic --username admin

# Menyesuaikan sumber kode dan versi, hanya memperbarui konfigurasi yang disimpan
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Menyesuaikan port aplikasi dan zona waktu, lalu mulai ulang aplikasi nanti
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Mengosongkan field yang telah disimpan
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
