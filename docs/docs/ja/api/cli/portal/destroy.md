---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a Portal record and its local workspace."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Portal レコードとローカルワークスペースを削除します

## 使い方

```bash
nb portal destroy <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing Portal records or workspace directories. |

## 例

```bash
nb portal destroy customer --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## 補足

This command affects both the remote Portal record and the local workspace. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or local files.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
