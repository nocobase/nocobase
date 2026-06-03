---
title: 'nb config set'
description: 'Tài liệu tham khảo lệnh nb config set: thiết lập một mục cấu hình CLI.'
keywords: 'nb config set,NocoBase CLI,thiết lập cấu hình'
---

# nb config set

Thiết lập một mục cấu hình CLI. Các mục cấu hình hiện được hỗ trợ là `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` và `bin.yarn`.

## Cách dùng

```bash
nb config set <key> <value>
```

## Tham số

| Tham số   | Kiểu   | Mô tả                                                                                                                             |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Tên mục cấu hình: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` hoặc `bin.yarn` |
| `<value>` | string | Giá trị cấu hình, không được để trống                                                                                             |

## Ví dụ

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Ghi chú

`update.policy` hỗ trợ `prompt`, `auto` và `off`, giá trị mặc định là `prompt`.

## Lệnh liên quan

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
