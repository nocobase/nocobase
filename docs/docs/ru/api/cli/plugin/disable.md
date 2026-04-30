---
title: "nb plugin disable"
description: "Справочник по команде nb plugin disable: отключение одного или нескольких плагинов в выбранном env NocoBase."
keywords: "nb plugin disable,NocoBase CLI,отключение плагинов"
---

# nb plugin disable

Отключает один или несколько плагинов в выбранном env.

## Использование

```bash
nb plugin disable <packages...> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<packages...>` | string[] | Имена пакетов плагинов, обязательный параметр, поддерживает несколько значений |
| `--env`, `-e` | string | Имя env CLI, при пропуске используется текущий env |

## Примеры

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## Связанные команды

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
