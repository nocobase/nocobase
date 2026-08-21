---
title: "nb source build"
description: "Tài liệu lệnh nb source build: build dự án source code NocoBase cục bộ."
keywords: "nb source build,NocoBase CLI,Build,Source code"
---

# nb source build

Build dự án source code NocoBase cục bộ. Cần thực thi trong thư mục source (`<app-path>/source/`). Đối với source app do CLI quản lý, trước khi build sẽ tự động đồng bộ plugin trong thư mục `plugins/` vào `source/packages/plugins/`.

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
| `--tar` | boolean | Tự động đóng gói thành file `.tgz` sau khi build xong |
| `--verbose` | boolean | Hiển thị output lệnh chi tiết |

## Ví dụ

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Giải thích

Khi sử dụng `--tar`, sau khi build xong, plugin được chỉ định sẽ được đóng gói thành file `.tgz` và xuất ra thư mục `source/storage/tar/`. Khi lệnh kết thúc, đường dẫn đầy đủ của tarball sẽ được in ra.

## Lệnh liên quan

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
