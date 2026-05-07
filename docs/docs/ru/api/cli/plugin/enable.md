---
title: "nb plugin enable"
description: "Справочник по команде nb plugin enable: включение одного или нескольких плагинов в выбранном env NocoBase."
keywords: "nb plugin enable,NocoBase CLI,включение плагинов"
---

# nb plugin enable

Включает один или несколько плагинов в выбранном env.

## Использование

```bash
nb plugin enable <packages...> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<packages...>` | string[] | Имена пакетов плагинов, обязательный параметр, поддерживает несколько значений |
| `--env`, `-e` | string | Имя env CLI, при пропуске используется текущий env |

## Примеры

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Связанные команды

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
