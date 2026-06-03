---
title: "nb config delete"
description: "Tài liệu lệnh nb config delete: xóa một thiết lập CLI đã được cấu hình rõ ràng."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Xóa một thiết lập CLI đã được cấu hình rõ ràng. Sau đó CLI sẽ quay về giá trị mặc định của khóa đó.

## Cách dùng

```bash
nb config delete <key>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<key>` | string | Khóa cấu hình: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` hoặc `bin.yarn` |

## Ví dụ

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Lệnh liên quan

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
