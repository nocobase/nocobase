---
title: "nb scaffold plugin"
description: "Tham khảo lệnh nb scaffold plugin: tạo scaffold cho Plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold Plugin"
---

# nb scaffold plugin

Tạo mã scaffold cho Plugin NocoBase.

## Cách dùng

```bash
nb scaffold plugin <pkg> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<pkg>` | string | Tên gói Plugin, bắt buộc |
| `--cwd`, `-c` | string | Chỉ định đường dẫn thư mục gốc ứng dụng |
| `--force-recreate`, `-f` | boolean | Buộc tạo lại scaffold của Plugin |

## Ví dụ

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Giải thích

Đối với source app do CLI quản lý (ứng dụng được tạo bằng `nb init`), plugin sẽ được sinh ra trong thư mục `<app-path>/plugins/`, `nb` sẽ tự động đồng bộ plugin vào `source/packages/plugins/` để phục vụ quy trình phát triển và build.

Nếu plugin đích đã tồn tại, lệnh mặc định sẽ báo lỗi. Sử dụng `--force-recreate` để buộc tạo lại. Nếu phía source có thư mục hoặc liên kết tượng trưng bên ngoài bị xung đột, bạn cần xóa thủ công mục xung đột trước rồi thử lại.

## Lệnh liên quan

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
