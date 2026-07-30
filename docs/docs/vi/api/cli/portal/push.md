---
title: "nb portal push"
description: "nb portal push command reference: push local Portal source changes to source storage."
keywords: "nb portal push,NocoBase CLI,Portal"
---

# nb portal push

Đẩy thay đổi mã nguồn Portal cục bộ lên source storage

## Cách dùng

```bash
nb portal push <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--message`, `-m` | string | Source update message; for Git-managed source, it is used as the Git commit message. |

## Ví dụ

```bash
nb portal push customer
nb portal push customer --env prod --yes
nb portal push customer --message "Update customer portal"
```

## Ghi chú

The command reads `portal.config.json` and syncs that configuration to the remote Portal record first. Git source storage clones the configured repo, copies the local workspace into `--git-path`, commits, and pushes. With default `nocobase` storage, `local`, `docker`, and `http` envs upload a source archive through the API.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
