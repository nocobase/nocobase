---
title: "nb scaffold"
description: "Справочник по команде nb scaffold: генерация шаблонов плагинов и миграционных скриптов NocoBase."
keywords: "nb scaffold,NocoBase CLI,шаблоны,плагин,migration"
---

# nb scaffold

Генерирует шаблоны для разработки плагинов NocoBase.

## Использование

```bash
nb scaffold <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Генерирует шаблон плагина NocoBase |
| [`nb scaffold migration`](./migration.md) | Генерирует миграционный скрипт плагина |

## Примеры

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Связанные команды

- [`nb plugin`](../plugin/index.md)
- [Разработка плагинов](../../../plugin-development/index.md)
