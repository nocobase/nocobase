---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a Portal record and its deployed files."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Portal レコードとデプロイディレクトリを削除します

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
| `--force` | boolean | Ignore missing Portal records or deployment directories. |
| `--delete-dev-path`, `-D` | boolean | Delete the Portal development directory in addition to the deployed Portal. |

## 例

```bash
nb portal destroy customer --yes
nb portal destroy customer --delete-dev-path --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## 補足

This command deletes the remote Portal record and deployed files. The development directory is retained by default; pass `--delete-dev-path` to delete it as well. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or deployment files.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
