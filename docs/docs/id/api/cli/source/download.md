---
title: "nb source download"
description: "Referensi perintah nb source download: mendapatkan source code atau image NocoBase dari npm, Docker, atau Git."
keywords: "nb source download,NocoBase CLI,download,npm,Docker,Git"
---

# nb source download

Mendapatkan NocoBase dari npm, Docker, atau Git. `--version` adalah parameter versi yang digunakan bersama oleh ketiga source: npm menggunakan versi paket, Docker menggunakan tag image, Git menggunakan git ref.

## Penggunaan

```bash
nb source download [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Gunakan nilai default dan lewati prompt interaktif |
| `--verbose` | boolean | Menampilkan output perintah detail |
| `--locale` | string | Bahasa prompt CLI: `en-US` atau `zh-CN` |
| `--source`, `-s` | string | Cara mendapatkan: `docker`, `npm`, atau `git` |
| `--version`, `-v` | string | Versi paket npm, tag image Docker, atau Git ref |
| `--replace`, `-r` | boolean | Ganti jika direktori target sudah ada |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Apakah menginstal devDependencies saat instalasi npm/Git |
| `--output-dir`, `-o` | string | Direktori target download, atau direktori untuk menyimpan tarball Docker |
| `--git-url` | string | Alamat repository Git |
| `--docker-registry` | string | Nama registry image Docker, tanpa tag |
| `--docker-platform` | string | Platform image Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Apakah menyimpan sebagai tarball setelah pull image Docker |
| `--npm-registry` | string | Registry yang digunakan untuk download dan instalasi dependensi npm/Git |
| `--build` / `--no-build` | boolean | Apakah build setelah instalasi dependensi npm/Git |
| `--build-dts` | boolean | Apakah menghasilkan file deklarasi TypeScript saat build npm/Git |
| `--hook-script` | string | Modul hook yang dijalankan setelah npm scaffold atau Git clone dan sebelum instalasi dependensi; hanya berlaku untuk source npm/Git |

## Contoh

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
nb source download -y --source git --version beta --hook-script ./hooks.mjs
```

## Hook sebelum instalasi

`--hook-script` hanya memengaruhi eksekusi `nb source download` saat ini. Jika Anda ingin hook disimpan bersama env dan digunakan kembali oleh `nb app upgrade` atau restore source lokal, teruskan melalui [`nb init --hook-script`](../init.md).

File hook harus melakukan default export sebuah objek dan mengimplementasikan `beforeDependencyInstall(context)`:

```js
export default {
  beforeDependencyInstall: async ({ sourcePath, version, envConfig }) => {
    // Berjalan setelah git clone / npm scaffold dan sebelum yarn install.
  },
};
```

Saat Anda menjalankan `nb source download --hook-script` secara langsung, `beforeDependencyInstall` menerima `context.phase` sebagai `source-download` dan `context.command` sebagai `source:download`. Perintah ini tidak menjalankan `beforeAppInstall` atau `afterAppStart`; kedua hook itu milik alur install, start, restart, dan upgrade app.


## Alias Versi

Pada Git source, dist-tag yang umum akan diurai ke branch yang sesuai: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
