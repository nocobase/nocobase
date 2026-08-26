---
title: "nb proxy nginx use"
description: "Referensi perintah nb proxy nginx use: ganti driver yang sedang dipakai oleh provider Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Mengganti driver yang sedang dipakai oleh provider Nginx.

## Penggunaan

```bash
nb proxy nginx use <driver>
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<driver>` | string | Mendukung `local` atau `docker` |

## Contoh

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Catatan

- Perintah ini menyimpan hasilnya ke `proxy.nginx-driver`
- Perintah berikutnya seperti `start`, `reload`, `stop`, `status`, dan `info` semuanya memakai driver saat ini

## Perintah terkait

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
