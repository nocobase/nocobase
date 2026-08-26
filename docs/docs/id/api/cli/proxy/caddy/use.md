---
title: "nb proxy caddy use"
description: "Referensi perintah nb proxy caddy use: ganti driver yang sedang dipakai oleh provider Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Mengganti driver yang sedang dipakai oleh provider Caddy.

## Penggunaan

```bash
nb proxy caddy use <driver>
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<driver>` | string | Mendukung `local` atau `docker` |

## Contoh

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Catatan

- Perintah ini menyimpan hasilnya ke `proxy.caddy-driver`
- Perintah berikutnya seperti `start`, `reload`, `stop`, `status`, dan `info` semuanya memakai driver saat ini

## Perintah terkait

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
