---
title: "nb portal config"
description: "nb portal config command reference: update source storage and Git source configuration for a Portal workspace."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

Cập nhật cấu hình mã nguồn của workspace Portal cục bộ và đồng bộ với bản ghi Portal từ xa khi có thể

## Cách dùng

```bash
nb portal config <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the Portal slug. |

## Ví dụ

```bash
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path customer
```

## Ghi chú

Pass at least one configuration flag. The local workspace must already exist; use `nb portal create` or `nb portal pull` first. If the remote Portal record exists, the configuration is synced to it; otherwise only `portal.config.json` is updated locally.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
