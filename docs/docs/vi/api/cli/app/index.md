---
title: "nb app"
description: "Tài liệu lệnh nb app: quản lý runtime của ứng dụng NocoBase, gồm khởi động, dừng, khởi động lại, log, dọn dẹp và nâng cấp."
keywords: "nb app,NocoBase CLI,Khởi động,Dừng,Khởi động lại,Log,Nâng cấp"
---

# nb app

Quản lý runtime của ứng dụng NocoBase. Env npm/Git sẽ chạy lệnh ứng dụng trong thư mục source cục bộ, còn env Docker sẽ quản lý container ứng dụng đã lưu.

## Cách dùng

```bash
nb app <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb app start`](./start.md) | Khởi động ứng dụng hoặc Docker container |
| [`nb app stop`](./stop.md) | Dừng ứng dụng hoặc Docker container |
| [`nb app restart`](./restart.md) | Dừng rồi khởi động lại ứng dụng |
| [`nb app logs`](./logs.md) | Xem log ứng dụng |
| [`nb app down`](./down.md) | Dừng và dọn dẹp tài nguyên runtime cục bộ |
| [`nb app upgrade`](./upgrade.md) | Cập nhật source code hoặc image rồi khởi động lại ứng dụng |

## Ví dụ

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Lệnh liên quan

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
