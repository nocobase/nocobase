---
title: "nb source test"
description: "Tài liệu lệnh nb source test: chạy test trong thư mục ứng dụng đã chọn và tự động chuẩn bị database test tích hợp."
keywords: "nb source test,NocoBase CLI,Test,Vitest,Database"
---

# nb source test

Chạy test trong thư mục ứng dụng đã chọn. Trước khi chạy test, CLI sẽ tạo lại một Docker test database tích hợp và inject các biến môi trường `DB_*` cho mục đích nội bộ.

## Cách dùng

```bash
nb source test [paths...] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[paths...]` | string[] | Đường dẫn file test hoặc glob, được pass thẳng tới test runner |
| `--cwd`, `-c` | string | Thư mục ứng dụng để chạy test, mặc định thư mục hiện tại |
| `--watch`, `-w` | boolean | Chạy Vitest ở chế độ watch |
| `--run` | boolean | Chạy một lần, không vào chế độ watch |
| `--allowOnly` | boolean | Cho phép test `.only` |
| `--bail` | boolean | Dừng ngay khi có test fail |
| `--coverage` | boolean | Bật báo cáo coverage |
| `--single-thread` | string | Pass chế độ single-thread cho test runner bên dưới |
| `--server` | boolean | Ép chế độ test server |
| `--client` | boolean | Ép chế độ test client |
| `--db-clean`, `-d` | boolean | Dọn database khi lệnh ứng dụng bên dưới hỗ trợ |
| `--db-dialect` | string | Loại database test tích hợp: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Docker image cho database test tích hợp |
| `--db-port` | string | TCP port mà database test tích hợp publish lên host |
| `--db-database` | string | Tên database inject cho test |
| `--db-user` | string | User database inject cho test |
| `--db-password` | string | Mật khẩu database inject cho test |
| `--verbose` | boolean | Hiển thị output Docker và test runner bên dưới |

## Ví dụ

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Lệnh liên quan

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
