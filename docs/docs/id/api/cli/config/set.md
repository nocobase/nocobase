---
title: 'nb config set'
description: 'Referensi perintah nb config set: menetapkan item konfigurasi CLI.'
keywords: 'nb config set,NocoBase CLI,mengatur konfigurasi'
---

# nb config set

Menetapkan item konfigurasi CLI. Item konfigurasi yang saat ini didukung adalah `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, dan `bin.yarn`.

## Penggunaan

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                                                                               |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, atau `bin.yarn` |
| `<value>` | string | Nilai konfigurasi, tidak boleh kosong                                                                                                   |

## Contoh

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Keterangan

`update.policy` mendukung `prompt`, `auto`, dan `off`, dengan nilai default `prompt`.

## Perintah terkait

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
