---
title: "nb scaffold migration"
description: "Справочник по команде nb scaffold migration: генерация миграционного скрипта плагина NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,миграционный скрипт,migration"
---

# nb scaffold migration

Генерирует файл миграционного скрипта плагина.

## Использование

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<name>` | string | Имя миграционного скрипта, обязательный параметр |
| `--pkg` | string | Имя пакета плагина-владельца, обязательный параметр |
| `--on` | string | Момент выполнения: `beforeLoad`, `afterSync` или `afterLoad` |

## Примеры

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Связанные команды

- [`nb scaffold plugin`](./plugin.md)
- [Разработка плагинов](../../../plugin-development/index.md)
