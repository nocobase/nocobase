---
title: 'nb config'
description: 'Referensi perintah nb config: kelola item konfigurasi default NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,konfigurasi,konfigurasi default'
---

# nb config

Kelola konfigurasi default CLI. Item konfigurasi yang saat ini didukung meliputi:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Item konfigurasi umum

| Item konfigurasi          | Nilai default                            | Deskripsi                                                      |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `locale`                  | Diselesaikan menurut aturan CLI saat ini | Menimpa bahasa yang digunakan oleh CLI                         |
| `update.policy`           | `prompt`                                 | Kebijakan pembaruan saat startup: `prompt`, `auto`, atau `off` |
| `docker.network`          | `nocobase`                               | Jaringan default untuk aplikasi Docker yang dikelola oleh CLI  |
| `docker.container-prefix` | `nb`                                     | Prefiks default untuk kontainer Docker yang dikelola oleh CLI  |
| `bin.docker`              | `docker`                                 | Menimpa path executable Docker                                 |
| `bin.git`                 | `git`                                    | Menimpa path executable Git                                    |
| `bin.yarn`                | `yarn`                                   | Menimpa path executable Yarn                                   |

## Penggunaan

```bash
nb config <command>
```

## Subperintah

| Perintah                          | Deskripsi                                                              |
| --------------------------------- | ---------------------------------------------------------------------- |
| [`nb config get`](./get.md)       | Membaca nilai efektif dari suatu item konfigurasi                      |
| [`nb config set`](./set.md)       | Menetapkan suatu item konfigurasi                                      |
| [`nb config delete`](./delete.md) | Menghapus item konfigurasi yang ditetapkan secara eksplisit            |
| [`nb config list`](./list.md)     | Menampilkan item konfigurasi yang saat ini ditetapkan secara eksplisit |

## Contoh

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Perintah terkait

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
