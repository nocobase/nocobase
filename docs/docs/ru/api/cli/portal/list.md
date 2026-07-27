---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Выводит записи Portal и состояние синхронизации локальных рабочих пространств

## Использование

```bash
nb portal list [flags]
```

## Параметр

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## Примеры

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## Примечания

The list shows name, URL, development mode, source storage, local path, enabled status, and local sync status. Only `ai` portals have local workspace sync checks; other Portal types show an empty sync status.

## Связанные команды

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
