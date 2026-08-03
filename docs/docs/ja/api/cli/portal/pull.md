---
title: "nb portal pull"
description: "nb portal pull command reference: pull Portal source into the local workspace."
keywords: "nb portal pull,NocoBase CLI,Portal"
---

# nb portal pull

source storage から Portal ソースをローカルワークスペースへ取得します

## 使い方

```bash
nb portal pull <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--force` | boolean | Delete the existing local workspace and pull it again. |
| `--path` | string | Portal workspace directory. Defaults to the saved path, then `./<portal>`. |
| `--install` / `--no-install` | boolean | Run `pnpm install` after pulling source. Enabled by default. |

## 例

```bash
nb portal pull customer
nb portal pull customer --env prod --yes
nb portal pull customer --path ./portals/customer
nb portal pull customer --force
nb portal pull customer --no-install
```

## 補足

When the pulled workspace contains `package.json`, `pnpm install` runs by default. Use `--no-install` to skip it. Git source storage clones the configured repo and branch, then copies `--git-path`. With default `nocobase` storage, `pull` downloads a source archive through the API and writes it to the development workspace.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
