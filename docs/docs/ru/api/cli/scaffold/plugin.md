---
title: "nb scaffold plugin"
description: "Справочник по команде nb scaffold plugin: генерация шаблона плагина NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,шаблон плагина"
---

# nb scaffold plugin

Генерирует шаблонный код плагина NocoBase.

## Использование

```bash
nb scaffold plugin <pkg> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<pkg>` | string | Имя пакета плагина, обязательный параметр |
| `--force-recreate`, `-f` | boolean | Принудительно пересоздать шаблон плагина |

## Примеры

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Связанные команды

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
