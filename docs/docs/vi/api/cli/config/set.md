---
title: 'nb config set'
description: 'Tài liệu tham khảo lệnh nb config set: đặt một mục cấu hình CLI.'
keywords: 'nb config set,NocoBase CLI,đặt cấu hình'
---

# nb config set

Đặt một mục cấu hình CLI. Xem [`nb config`](./index.md) để biết các khóa cấu hình được hỗ trợ.

## Cách dùng

```bash
nb config set <key> <value>
```

## Tham số

| Tham số   | Kiểu   | Mô tả                                                                           |
| --------- | ------ | ------------------------------------------------------------------------------- |
| `<key>`   | string | Tên mục cấu hình. Xem [`nb config`](./index.md) để biết các giá trị được hỗ trợ |
| `<value>` | string | Giá trị cấu hình, không được để trống                                           |

## Ví dụ

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

## Ghi chú

- `update.policy` hỗ trợ `prompt`, `auto` và `off`, với giá trị mặc định là `prompt`
- `nb-image-registry` hỗ trợ `dockerhub` và `aliyun`, với giá trị mặc định là `dockerhub`
- `nb-image-variant` hỗ trợ `standard`, `no-nginx`, `full` và `full-no-nginx`, với giá trị mặc định là `full`

## Lệnh liên quan

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
