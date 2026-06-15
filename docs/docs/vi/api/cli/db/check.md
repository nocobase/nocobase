---
title: "nb db check"
description: "Tài liệu lệnh nb db check: kiểm tra xem cơ sở dữ liệu có thể truy cập được bằng env hiện tại hoặc các cờ cơ sở dữ liệu tường minh hay không."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Kiểm tra xem cơ sở dữ liệu có thể truy cập được hay không. Bạn có thể dùng lại cấu hình cơ sở dữ liệu đã lưu từ một env hoặc truyền các cờ `--db-*` một cách tường minh.

## Cách dùng

```bash
nb db check [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Đọc cấu hình cơ sở dữ liệu từ một env CLI; nếu bỏ qua thì phải cung cấp đầy đủ các cờ `--db-*` bắt buộc |
| `--db-dialect` | string | Loại cơ sở dữ liệu: `postgres`, `kingbase`, `mysql` hoặc `mariadb` |
| `--db-host` | string | Tên host hoặc địa chỉ IP của cơ sở dữ liệu |
| `--db-port` | string | Cổng TCP của cơ sở dữ liệu |
| `--db-database` | string | Tên cơ sở dữ liệu |
| `--db-user` | string | Tên người dùng của cơ sở dữ liệu |
| `--db-password` | string | Mật khẩu của cơ sở dữ liệu |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Ghi chú

Nếu env được chọn dùng cơ sở dữ liệu tích hợp do CLI quản lý, CLI sẽ xác định địa chỉ kết nối thực tế trước khi chạy kiểm tra.

## Lệnh liên quan

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
