---
title: "nb app stop"
description: "Tài liệu lệnh nb app stop: dừng ứng dụng NocoBase hoặc Docker container của env được chỉ định."
keywords: "nb app stop,NocoBase CLI,Dừng ứng dụng,Docker"
---

# nb app stop

Dừng ứng dụng NocoBase của env được chỉ định. Cài đặt npm/Git sẽ dừng tiến trình ứng dụng cục bộ, còn cài đặt Docker sẽ dừng container ứng dụng đã lưu.

## Cách dùng

```bash
nb app stop [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn dừng, bỏ qua thì dùng env hiện tại |
| `--verbose` | boolean | Hiển thị output của lệnh cục bộ hoặc Docker bên dưới |

## Ví dụ

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Lệnh liên quan

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
