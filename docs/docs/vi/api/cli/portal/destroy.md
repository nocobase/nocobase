---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a Portal record and its deployed files."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Xóa bản ghi Portal và thư mục triển khai

## Cách dùng

```bash
nb portal destroy <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing Portal records or deployment directories. |
| `--delete-dev-path`, `-D` | boolean | Delete the Portal development directory in addition to the deployed Portal. |

## Ví dụ

```bash
nb portal destroy customer --yes
nb portal destroy customer --delete-dev-path --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## Ghi chú

This command deletes the remote Portal record and deployed files. The development directory is retained by default; pass `--delete-dev-path` to delete it as well. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or deployment files.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
