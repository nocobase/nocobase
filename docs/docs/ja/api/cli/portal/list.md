---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
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
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `--json`, `-j` | boolean | Print Portal records as JSON. |

## 例

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json
```

## 補足

The list shows name, URL, portal type, source storage, development path, enabled status, and default status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, `isDefault`, and `sourceStorage`.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
