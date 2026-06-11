---
title: "Konfigurasi API Key"
description: "API Key NocoBase: tambahkan API Key untuk pengguna saat ini untuk akses terprogram, perlu mengkonfigurasi variabel lingkungan APP_KEY, cara konfigurasi instalasi Docker dan source code."
keywords: "API Key,APP_KEY,autentikasi API,akses terprogram,Bearer token,NocoBase"
---

# API Key

## Pengenalan

## Instalasi

## Petunjuk Penggunaan

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Tambahkan API Key

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Perhatian**

- API Key yang ditambahkan adalah milik pengguna saat ini, perannya adalah peran yang dimiliki oleh pengguna saat ini
- Pastikan variabel lingkungan `APP_KEY` sudah dikonfigurasi dan jangan sampai bocor; jika APP_KEY berubah, semua API Key yang sudah ditambahkan akan tidak berlaku.

### Cara Mengkonfigurasi APP_KEY

Untuk versi docker, modifikasi file docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Untuk instalasi source code atau create-nocobase-app, langsung modifikasi APP_KEY pada file .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```
