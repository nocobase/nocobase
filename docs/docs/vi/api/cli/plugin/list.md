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

## Ví dụ

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Lệnh liên quan

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
