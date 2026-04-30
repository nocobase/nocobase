---
title: "nb scaffold migration"
description: "Tham khảo lệnh nb scaffold migration: tạo migration script cho Plugin NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,migration script,migration"
---

# nb scaffold migration

Tạo file migration script cho Plugin.

## Cách dùng

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên migration script, bắt buộc |
| `--pkg` | string | Tên gói Plugin chứa migration, bắt buộc |
| `--on` | string | Thời điểm thực thi: `beforeLoad`, `afterSync` hoặc `afterLoad` |

## Ví dụ

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Lệnh liên quan

- [`nb scaffold plugin`](./plugin.md)
- [Phát triển Plugin](../../../plugin-development/index.md)
