---
title: "nb portal info"
description: "nb portal info command reference: show Portal record and local workspace details."
keywords: "nb portal info,NocoBase CLI,Portal"
---

# nb portal info

Hiển thị chi tiết bản ghi Portal và workspace cục bộ đã chỉ định

## Cách dùng

```bash
nb portal info <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal details as JSON. |

## Ví dụ

```bash
nb portal info customer
nb portal info customer --env dev --yes
nb portal info customer --json-output
```

## Ghi chú

Text output includes name, URL, portal type, development path, deployment path, and enabled status. `--json-output` prints `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`. You can query by `routeName` or `uid`.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
