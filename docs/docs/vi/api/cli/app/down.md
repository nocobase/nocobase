---
title: "nb app down"
description: "Tài liệu lệnh nb app down: dừng và dọn dẹp tài nguyên runtime cục bộ của env được chỉ định."
keywords: "nb app down,NocoBase CLI,Dọn dẹp tài nguyên,Xóa container,storage"
---

# nb app down

Dừng và dọn dẹp tài nguyên runtime cục bộ của env được chỉ định. Mặc định sẽ giữ lại dữ liệu storage và cấu hình env; muốn xóa toàn bộ thì phải truyền tường minh `--all --yes`.

## Cách dùng

```bash
nb app down [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn dọn dẹp, bỏ qua thì dùng env hiện tại |
| `--all` | boolean | Xóa toàn bộ nội dung của env, bao gồm dữ liệu storage và cấu hình env đã lưu |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận với thao tác phá hủy, thường dùng cùng `--all` |
| `--verbose` | boolean | Hiển thị output của lệnh stop và cleanup bên dưới |

## Ví dụ

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Lệnh liên quan

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
