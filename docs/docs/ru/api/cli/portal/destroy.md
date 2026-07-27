---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a Portal record and its local workspace."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Удаляет запись Portal и локальное рабочее пространство

## Использование

```bash
nb portal destroy <portal> [flags]
```

## Параметр

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing Portal records or workspace directories. |

## Примеры

```bash
nb portal destroy customer --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## Примечания

This command affects both the remote Portal record and the local workspace. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or local files.

## Связанные команды

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
