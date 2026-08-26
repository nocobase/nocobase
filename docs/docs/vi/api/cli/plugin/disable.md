---
title: "nb plugin disable"
description: "Tham khảo lệnh nb plugin disable: tắt một hoặc nhiều Plugin trong env NocoBase đang chọn."
keywords: "nb plugin disable,NocoBase CLI,tắt Plugin"
---

# nb plugin disable

Tắt một hoặc nhiều Plugin trong env đang chọn.

## Cách dùng

```bash
nb plugin disable <packages...> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<packages...>` | string[] | Tên gói Plugin, bắt buộc, hỗ trợ truyền nhiều giá trị |
| `--env`, `-e` | string | Tên env của CLI, bỏ qua sẽ dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |

## Ví dụ

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
