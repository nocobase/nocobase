---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Liệt kê bản ghi Portal và trạng thái đồng bộ workspace cục bộ

## Cách dùng

```bash
nb portal list [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## Ví dụ

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## Ghi chú

The list shows name, URL, portal type, source storage, local path, enabled status, and local sync status. Only `ai` portals have local workspace sync checks; other Portal types show an empty sync status.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
