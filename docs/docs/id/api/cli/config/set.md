---
title: "nb config set"
description: "Referensi perintah nb config set: menetapkan nilai konfigurasi CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Menetapkan nilai konfigurasi CLI. Key yang didukung adalah `license.pkg-url`, `docker.network`, dan `docker.container-prefix`.

## Penggunaan

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<key>` | string | Key konfigurasi: `license.pkg-url`, `docker.network`, atau `docker.container-prefix` |
| `<value>` | string | Nilai konfigurasi; tidak boleh kosong |

## Contoh

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Catatan

Saat menetapkan `license.pkg-url`, CLI akan menormalkan URL agar selalu diakhiri dengan `/`.

## Perintah Terkait

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
