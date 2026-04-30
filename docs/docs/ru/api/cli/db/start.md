---
title: "nb db start"
description: "Справочник по команде nb db start: запуск контейнера встроенной базы данных указанного env."
keywords: "nb db start,NocoBase CLI,запуск базы данных,Docker"
---

# nb db start

Запуск контейнера встроенной базы данных указанного env. Эта команда применима только к env, в которых включена встроенная база данных под управлением CLI.

## Использование

```bash
nb db start [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env, для которого запускается встроенная база данных; если не указано, используется текущий env |
| `--verbose` | boolean | Показать вывод низкоуровневых Docker-команд |

## Примеры

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Связанные команды

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
