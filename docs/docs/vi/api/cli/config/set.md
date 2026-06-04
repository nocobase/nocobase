---
title: "nb config set"
description: "Tài liệu lệnh nb config set: thiết lập một giá trị cấu hình CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Thiết lập một giá trị cấu hình CLI. Các khóa được hỗ trợ là `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` và `bin.yarn`.

## Cách dùng

```bash
nb config set <key> <value>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<key>` | string | Khóa cấu hình: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` hoặc `bin.yarn` |
| `<value>` | string | Giá trị cấu hình; không được để trống |

## Ví dụ

```bash
nb config set locale vi-VN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Ghi chú

Khi đặt `license.pkg-url`, CLI sẽ chuẩn hóa URL để luôn kết thúc bằng `/`.

`update.policy` hỗ trợ `prompt`, `auto` và `off`. Giá trị mặc định là `prompt`.

## Lệnh liên quan

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
