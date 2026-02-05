---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Kunci API

## Pengantar

## Petunjuk Penggunaan

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Menambahkan Kunci API

![](https://static-docs.nocobase.com/461872fc0ad9a96fa5b14e97fcba12.png)

**Catatan**

- Kunci API dibuat untuk pengguna saat ini dan mewarisi peran pengguna tersebut.
- Pastikan variabel lingkungan `APP_KEY` telah dikonfigurasi dan dijaga kerahasiaannya. Jika `APP_KEY` berubah, semua kunci API yang telah ditambahkan akan menjadi tidak valid.

### Cara Mengonfigurasi APP_KEY

Untuk versi Docker, ubah file docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Untuk instalasi dari kode sumber atau `create-nocobase-app`, Anda dapat langsung mengubah `APP_KEY` di file .env.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```