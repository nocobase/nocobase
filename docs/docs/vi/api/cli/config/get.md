---
title: "nb config get"
description: "Tài liệu tham khảo lệnh nb config get: đọc giá trị hiệu lực của một mục cấu hình CLI."
keywords: "nb config get,NocoBase CLI,đọc cấu hình"
---

# nb config get

Đọc giá trị hiệu lực của mục cấu hình CLI được chỉ định. Nếu mục đó chưa từng được đặt tường minh, giá trị mặc định sẽ được trả về.

## Cách dùng

```bash
nb config get <key>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<key>` | string | Tên mục cấu hình. Xem [`nb config`](./index.md) để biết các giá trị được hỗ trợ |

## Ví dụ

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Lệnh liên quan

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
