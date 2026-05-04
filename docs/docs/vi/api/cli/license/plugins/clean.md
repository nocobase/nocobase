---
title: "nb license plugins clean"
description: "Tài liệu lệnh nb license plugins clean: xóa các plugin thương mại đã tải về cho một env đã chọn."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Xóa các plugin thương mại đã tải về cho env đã chọn mà không thay đổi trạng thái kích hoạt giấy phép.

## Cách dùng

```bash
nb license plugins clean [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--dry-run` | boolean | Xem trước các plugin sẽ bị xóa mà không thực sự xóa gì |
| `--verbose`, `-V` | boolean | Hiển thị log chi tiết cho từng plugin |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Lệnh liên quan

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
