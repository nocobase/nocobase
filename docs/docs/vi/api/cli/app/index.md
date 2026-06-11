---
title: 'nb app'
description: 'Tài liệu tham khảo lệnh nb app: quản lý runtime của ứng dụng NocoBase, bao gồm khởi động, dừng, khởi động lại, nhật ký và nâng cấp.'
keywords: 'nb app,NocoBase CLI,khởi động,dừng,khởi động lại,nhật ký,nâng cấp'
---

# nb app

Quản lý runtime của ứng dụng NocoBase. Trong npm/Git env, các lệnh ứng dụng được thực thi trong thư mục mã nguồn cục bộ; trong Docker env, các container ứng dụng được quản lý dựa trên cấu hình đã lưu.

## Cách dùng

```bash
nb app <command>
```

## Lệnh con

| Lệnh                             | Mô tả                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Khởi động ứng dụng hoặc tạo lại container Docker              |
| [`nb app stop`](./stop.md)       | Dừng ứng dụng hoặc dọn dẹp container Docker                   |
| [`nb app restart`](./restart.md) | Dừng trước rồi khởi động lại ứng dụng                         |
| [`nb app autostart`](./autostart/index.md) | Quản lý cờ tự khởi động và khởi chạy tất cả env đã bật |
| [`nb app logs`](./logs.md)       | Xem nhật ký ứng dụng                                          |
| [`nb app upgrade`](./upgrade.md) | Dừng ứng dụng, thay thế mã nguồn hoặc image rồi khởi động lại |

## Ví dụ

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Lệnh liên quan

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
