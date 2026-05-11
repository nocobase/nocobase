---
title: "nb license plugins list"
description: "Tài liệu lệnh nb license plugins list: hiển thị các plugin thương mại gắn với giấy phép hiện tại cho một env đã chọn."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Hiển thị các plugin thương mại gắn với license key đã lưu cho env đã chọn.

## Cách dùng

```bash
nb license plugins list [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Lệnh liên quan

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
