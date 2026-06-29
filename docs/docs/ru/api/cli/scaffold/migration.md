---
title: "nb scaffold migration"
description: "Справочник по команде nb scaffold migration: генерация миграционных скриптов плагина NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,миграционный скрипт,migration"
---

# nb scaffold migration

Генерирует файлы миграционного скрипта плагина.

## Использование

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<name>` | string | Имя миграционного скрипта, обязательный параметр |
| `--pkg` | string | Имя пакета плагина, обязательный параметр |
| `--on` | string | Этап выполнения: `beforeLoad`, `afterSync` или `afterLoad` |

## Примеры

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Связанные команды

- [`nb scaffold plugin`](./plugin.md)
- [Разработка плагинов](../../../plugin-development/index.md)
