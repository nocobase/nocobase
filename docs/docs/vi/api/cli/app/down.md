---
title: "nb app down"
description: "Tài liệu lệnh nb app down: dừng và dọn dẹp tài nguyên runtime cục bộ của env được chỉ định."
keywords: "nb app down,NocoBase CLI,Dọn dẹp tài nguyên,Xóa container,storage"
---

# nb app down

Dừng và dọn dẹp tài nguyên runtime cục bộ của env được chỉ định. Mặc định sẽ giữ lại dữ liệu storage và cấu hình env; muốn xóa toàn bộ thì phải truyền tường minh `--all --force`.

## Cách dùng

```bash
nb app down [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn dọn dẹp, bỏ qua thì dùng env hiện tại |
| `--all` | boolean | Xóa toàn bộ nội dung của env, bao gồm dữ liệu storage và cấu hình env đã lưu |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--force`, `-f` | boolean | Buộc thực hiện dọn dẹp mang tính phá huỷ, như `--all` hoặc các thao tác dọn dẹp rủi ro cao khác ở chế độ không tương tác |
| `--verbose` | boolean | Hiển thị output của lệnh stop và cleanup bên dưới |

## Ví dụ

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` chỉ bỏ qua bước xác nhận tương tác khi `--env` được truyền tường minh trỏ tới env khác với env hiện tại. `--force` dùng để thực sự ép thực hiện dọn dẹp mang tính phá huỷ, như `--all` hoặc các thao tác dọn dẹp rủi ro cao khác ở chế độ không tương tác.

## Lệnh liên quan

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
