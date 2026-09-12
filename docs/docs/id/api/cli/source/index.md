---
title: "nb source"
description: "Referensi perintah nb source: mengelola proyek source code NocoBase lokal, termasuk download, dev, build, dan test."
keywords: "nb source,NocoBase CLI,source code,download,dev,build,test"
---

# nb source

Mengelola proyek source code NocoBase lokal. Env npm/Git menggunakan direktori source code lokal; env Docker biasanya hanya perlu menggunakan [`nb app`](../app/index.md) untuk mengelola runtime.

## Penggunaan

```bash
nb source <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb source download`](./download.md) | Mendapatkan NocoBase dari npm, Docker, atau Git |
| [`nb source dev`](./dev.md) | Memulai mode development di env source code npm/Git |
| [`nb source build`](./build.md) | Build proyek source code lokal |
| [`nb source test`](./test.md) | Menjalankan test di direktori aplikasi yang dipilih |

## Contoh

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
