---
title: "nb proxy nginx reload"
description: "Tài liệu tham khảo lệnh nb proxy nginx reload: tải lại cấu hình Nginx với driver hiện tại."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Tải lại cấu hình Nginx với driver hiện tại.

## Cách dùng

```bash
nb proxy nginx reload
```

## Ví dụ

```bash
nb proxy nginx reload
```

## Ghi chú

- Lệnh này thường được dùng sau khi bạn tạo lại cấu hình
- `reload` yêu cầu Nginx đã chạy sẵn; nếu chưa chạy, hãy dùng `nb proxy nginx start` trước
- Driver local sẽ tải lại Nginx cục bộ, còn driver Docker sẽ tải lại Nginx bên trong container

## Lệnh liên quan

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
