---
title: "nb scaffold"
description: "Tham khảo lệnh nb scaffold: tạo scaffold cho Plugin NocoBase và migration script."
keywords: "nb scaffold,NocoBase CLI,scaffold,Plugin,migration"
---

# nb scaffold

Tạo scaffold liên quan đến phát triển Plugin NocoBase.

## Cách dùng

```bash
nb scaffold <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Tạo scaffold Plugin NocoBase |
| [`nb scaffold migration`](./migration.md) | Tạo migration script cho Plugin |

## Ví dụ

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Lệnh liên quan

- [`nb plugin`](../plugin/index.md)
- [Phát triển Plugin](../../../plugin-development/index.md)
