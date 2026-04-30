---
title: "nb db stop"
description: "Справочник по команде nb db stop: остановка контейнера встроенной базы данных указанного env."
keywords: "nb db stop,NocoBase CLI,остановка базы данных,Docker"
---

# nb db stop

Остановка контейнера встроенной базы данных указанного env. Эта команда применима только к env, в которых включена встроенная база данных под управлением CLI.

## Использование

```bash
nb db stop [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env, для которого останавливается встроенная база данных; если не указано, используется текущий env |
| `--verbose` | boolean | Показать вывод низкоуровневых Docker-команд |

## Примеры

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Связанные команды

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
