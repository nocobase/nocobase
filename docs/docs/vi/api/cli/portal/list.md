---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
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
| `--json-output`, `--json`, `-j` | boolean | Print Portal records as JSON. |

## Ví dụ

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json
```

## Ghi chú

The list shows name, URL, portal type, source storage, development path, and enabled status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
