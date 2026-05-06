---
title: "nb license plugins list"
description: "Справочник по команде nb license plugins list: отображение коммерческих плагинов, связанных с текущей лицензией для выбранного env."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Показывает коммерческие плагины, связанные с сохранённым license key для выбранного env.

## Использование

```bash
nb license plugins list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
