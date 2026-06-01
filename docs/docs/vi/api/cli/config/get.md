---
title: "nb config get"
description: "Tài liệu lệnh nb config get: lấy giá trị hiệu lực của một khóa cấu hình CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Lấy giá trị hiệu lực của một khóa cấu hình CLI. Nếu không có giá trị được thiết lập rõ ràng thì giá trị mặc định sẽ được trả về.

## Cách dùng

```bash
nb config get <key>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<key>` | string | Khóa cấu hình: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` hoặc `bin.yarn` |

## Ví dụ

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Lệnh liên quan

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
