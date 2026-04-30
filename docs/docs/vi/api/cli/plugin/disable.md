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

## Ví dụ

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## Lệnh liên quan

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
