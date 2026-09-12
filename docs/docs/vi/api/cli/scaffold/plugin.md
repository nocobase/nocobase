---
title: "nb scaffold plugin"
description: "Tham khảo lệnh nb scaffold plugin: tạo scaffold cho Plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold Plugin"
---

# nb scaffold plugin

Tạo mã scaffold cho Plugin NocoBase.

## Cách dùng

```bash
nb scaffold plugin <pkg> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<pkg>` | string | Tên gói Plugin, bắt buộc |
| `--force-recreate`, `-f` | boolean | Buộc tạo lại scaffold của Plugin |

## Ví dụ

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Lệnh liên quan

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
