---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
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

The list shows name, URL, portal type, source storage, development path, and enabled status. `--json-output` prints `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`.

## Связанные команды

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
