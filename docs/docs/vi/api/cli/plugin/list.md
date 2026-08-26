---
title: "nb plugin list"
description: "Tài liệu lệnh nb plugin list: liệt kê plugin của env NocoBase đã chọn."
keywords: "nb plugin list,NocoBase CLI,Danh sách plugin"
---

# nb plugin list

Liệt kê plugin đã cài trong env đã chọn.

## Cách dùng

```bash
nb plugin list [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env, bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |

## Ví dụ

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
