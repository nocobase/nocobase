---
pkg: '@nocobase/plugin-api-keys'
title: "API Keys"
description: "API Keys NocoBase: menambahkan API Key untuk pengguna saat ini, digunakan untuk autentikasi panggilan API, perlu mengkonfigurasi variabel environment APP_KEY."
keywords: "API Keys,APP_KEY,autentikasi API,autentikasi panggilan antarmuka,NocoBase"
---

# API Keys

## Pengantar

## Petunjuk Penggunaan

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Menambahkan API Key

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Hal yang Perlu Diperhatikan**

- API Key yang ditambahkan adalah milik pengguna saat ini, dan rolenya adalah role yang dimiliki pengguna saat ini
- Pastikan variabel environment `APP_KEY` telah dikonfigurasi dan tidak bocor. Jika APP_KEY berubah, semua API Key yang telah ditambahkan akan menjadi tidak valid.

### Cara Mengkonfigurasi APP_KEY

Untuk versi docker, ubah file docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Untuk instalasi source code atau create-nocobase-app, langsung ubah APP_KEY pada file .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```
