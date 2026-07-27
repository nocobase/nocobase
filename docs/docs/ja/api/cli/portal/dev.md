---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal workspace in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

指定した Portal ワークスペースの開発モードを起動します

## 使い方

```bash
nb portal dev <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## 例

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## 補足

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
