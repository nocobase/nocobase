---
title: "nb portal config"
description: "nb portal config command reference: update source storage and Git source configuration for a Portal."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

ローカル Portal ワークスペースのソース設定を更新し、可能な場合はリモート Portal レコードへ同期します

## 使い方

```bash
nb portal config <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the repository root (`.`). |

## 例

```bash
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path portals/customer
```

## 補足

Pass at least one configuration flag. The local workspace must already exist; use `nb portal create` or `nb portal pull` first. If the remote Portal record exists, the configuration is synced to it; otherwise only `portal.config.json` is updated locally.

## 関連コマンド

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
