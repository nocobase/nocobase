---
title: "nb source build"
description: "Tài liệu lệnh nb source build: build dự án source code NocoBase cục bộ."
keywords: "nb source build,NocoBase CLI,Build,Source code"
---

# nb source build

Build dự án source code NocoBase cục bộ. Lệnh này forward tới quy trình build NocoBase cũ tại thư mục gốc của repo.

## Cách dùng

```bash
nb source build [packages...] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[packages...]` | string[] | Tên các package cần build, bỏ qua thì build tất cả |
| `--cwd`, `-c` | string | Thư mục làm việc |
| `--no-dts` | boolean | Không sinh file khai báo `.d.ts` |
| `--sourcemap` | boolean | Sinh sourcemap |
| `--verbose` | boolean | Hiển thị output lệnh chi tiết |

## Ví dụ

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Lệnh liên quan

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
