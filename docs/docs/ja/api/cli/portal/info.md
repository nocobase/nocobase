---
title: "nb portal info"
description: "nb portal info command reference: show Portal record and local workspace details."
keywords: "nb portal info,NocoBase CLI,Portal"
---

# nb portal info

指定した Portal レコードとローカルワークスペースの詳細を表示します

## 使い方

```bash
nb portal info <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `--json`, `-j` | boolean | Print Portal details as JSON. |

## 例

```bash
nb portal info customer
nb portal info customer --env dev --yes
nb portal info customer --json
```

## 補足

Text output includes name, URL, portal type, development path, deployment path, and enabled status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`. You can query by `routeName` or `uid`.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
