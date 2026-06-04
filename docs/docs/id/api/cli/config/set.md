---
title: "nb config set"
description: "Referensi perintah nb config set: menetapkan nilai konfigurasi CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Menetapkan nilai konfigurasi CLI. Key yang didukung adalah `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, dan `bin.yarn`.

## Penggunaan

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<key>` | string | Key konfigurasi: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |
| `<value>` | string | Nilai konfigurasi; tidak boleh kosong |

## Contoh

```bash
nb config set locale id-ID
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Catatan

Saat menetapkan `license.pkg-url`, CLI akan menormalkan URL agar selalu diakhiri dengan `/`.

`update.policy` mendukung `prompt`, `auto`, dan `off`. Nilai default-nya adalah `prompt`.

## Perintah Terkait

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
