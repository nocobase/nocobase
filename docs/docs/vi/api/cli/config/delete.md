---
title: 'nb config delete'
description: 'Tài liệu tham khảo lệnh nb config delete: xóa một mục cấu hình CLI đã được đặt tường minh.'
keywords: 'nb config delete,NocoBase CLI,xóa cấu hình'
---

# nb config delete

Xóa một mục cấu hình CLI đã được đặt tường minh. Sau khi xóa, mục cấu hình đó sẽ quay về giá trị mặc định.

## Cách dùng

```bash
nb config delete <key>
```

## Tham số

| Tham số | Kiểu   | Mô tả                                                                           |
| ------- | ------ | ------------------------------------------------------------------------------- |
| `<key>` | string | Tên mục cấu hình. Xem [`nb config`](./index.md) để biết các giá trị được hỗ trợ |

## Ví dụ

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete nb-image-registry
nb config delete nb-image-variant
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Lệnh liên quan

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
