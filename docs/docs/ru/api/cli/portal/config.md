---
title: "nb portal config"
description: "nb portal config command reference: update source storage and Git source configuration for a Portal."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

Обновляет конфигурацию исходного кода локального рабочего пространства Portal и по возможности синхронизирует её с удалённой записью Portal

## Использование

```bash
nb portal config <portal> [flags]
```

## Параметр

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the Portal slug. |

## Примеры

```bash
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path customer
```

## Примечания

Pass at least one configuration flag. The local workspace must already exist; use `nb portal create` or `nb portal pull` first. If the remote Portal record exists, the configuration is synced to it; otherwise only `portal.config.json` is updated locally.

## Связанные команды

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
