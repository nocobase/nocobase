---
title: 'nb db stop'
description: 'Tham khảo lệnh nb db stop: dừng vùng chứa cơ sở dữ liệu tích hợp của env được chỉ định.'
keywords: 'nb db stop,NocoBase CLI,dừng cơ sở dữ liệu,Docker'
---

# nb db stop

Dừng vùng chứa cơ sở dữ liệu tích hợp của env được chỉ định. Lệnh này chỉ áp dụng cho các env đã bật cơ sở dữ liệu tích hợp do CLI quản lý.

## Cách dùng

```bash
nb db stop [flags]
```

## Tham số

| Tham số       | Kiểu    | Mô tả                                                                            |
| ------------- | ------- | -------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Tên env CLI có cơ sở dữ liệu tích hợp cần dừng; nếu bỏ qua thì dùng env hiện tại |
| `--verbose`   | boolean | Hiển thị đầu ra của lệnh Docker bên dưới                                         |

## Ví dụ

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Lệnh liên quan

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
