---
title: "nb plugin list"
description: "Справочник по команде nb plugin list: список плагинов выбранного env NocoBase."
keywords: "nb plugin list,NocoBase CLI,список плагинов"
---

# nb plugin list

Перечисляет плагины, установленные в выбранном env.

## Использование

```bash
nb plugin list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя env CLI, при пропуске используется текущий env |

## Примеры

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Связанные команды

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
