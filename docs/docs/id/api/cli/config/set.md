---
title: 'nb config set'
description: 'Referensi perintah nb config set: menetapkan item konfigurasi CLI.'
keywords: 'nb config set,NocoBase CLI,menetapkan konfigurasi'
---

# nb config set

Menetapkan item konfigurasi CLI. Lihat [`nb config`](./index.md) untuk kunci konfigurasi yang didukung.

## Penggunaan

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Tipe   | Deskripsi                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------- |
| `<key>`   | string | Nama item konfigurasi. Lihat [`nb config`](./index.md) untuk nilai yang didukung |
| `<value>` | string | Nilai konfigurasi, tidak boleh kosong                                            |

## Contoh

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set nb-image-registry dockerhub
nb config set nb-image-registry aliyun
nb config set nb-image-variant full
nb config set nb-image-variant full-no-nginx
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## Catatan

- `update.policy` mendukung `prompt`, `auto`, dan `off`, dengan nilai default `prompt`
- `nb-image-registry` mendukung `dockerhub` dan `aliyun`, dengan nilai default `dockerhub`
- `nb-image-variant` mendukung `standard`, `no-nginx`, `full`, dan `full-no-nginx`, dengan nilai default `full`

## Perintah terkait

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
