---
title: "nb source"
description: "Tài liệu lệnh nb source: quản lý dự án source code NocoBase cục bộ, gồm download, dev, build và test."
keywords: "nb source,NocoBase CLI,Source code,download,dev,build,test"
---

# nb source

Quản lý dự án source code NocoBase cục bộ. Env npm/Git dùng thư mục source cục bộ; còn env Docker thường chỉ cần dùng [`nb app`](../app/index.md) để quản lý runtime.

## Cách dùng

```bash
nb source <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb source download`](./download.md) | Lấy NocoBase từ npm, Docker hoặc Git |
| [`nb source dev`](./dev.md) | Khởi động chế độ dev trong env source npm/Git |
| [`nb source build`](./build.md) | Build dự án source cục bộ |
| [`nb source test`](./test.md) | Chạy test trong thư mục ứng dụng đã chọn |

## Ví dụ

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
