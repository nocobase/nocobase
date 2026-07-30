---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Portal レコードとローカルワークスペースの同期状態を一覧表示します

## 使い方

```bash
nb portal list [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `--dir` | string | Portal workspace used for local sync status. Default: the current directory. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## 例

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## 補足

The list shows name, URL, portal type, source storage, local path, enabled status, and local sync status. Only `ai` portals have local workspace sync checks; other Portal types show an empty sync status.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
