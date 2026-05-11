---
title: "nb plugin enable"
description: "Tham khảo lệnh nb plugin enable: bật một hoặc nhiều Plugin trong env NocoBase đang chọn."
keywords: "nb plugin enable,NocoBase CLI,bật Plugin"
---

# nb plugin enable

Bật một hoặc nhiều Plugin trong env đang chọn.

## Cách dùng

```bash
nb plugin enable <packages...> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<packages...>` | string[] | Tên gói Plugin, bắt buộc, hỗ trợ truyền nhiều giá trị |
| `--env`, `-e` | string | Tên env của CLI, bỏ qua sẽ dùng env hiện tại |

## Ví dụ

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Lệnh liên quan

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
