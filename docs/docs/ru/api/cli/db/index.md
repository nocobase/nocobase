---
title: "nb db"
description: "Справочник по команде nb db: просмотр или управление состоянием среды выполнения встроенной базы данных выбранного окружения."
keywords: "nb db,NocoBase CLI,встроенная база данных,Docker,состояние базы данных"
---

# nb db

Просмотр или управление встроенными базами данных, которыми управляет CLI. Для окружений без контейнера базы данных под управлением CLI команда `nb db ps` также отобразит такие статусы, как `external` или `remote`.

## Использование

```bash
nb db <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb db check`](./check.md) | Проверить доступность подключения к базе данных |
| [`nb db ps`](./ps.md) | Просмотр состояния среды выполнения встроенной базы данных |
| [`nb db start`](./start.md) | Запуск контейнера встроенной базы данных |
| [`nb db stop`](./stop.md) | Остановка контейнера встроенной базы данных |
| [`nb db logs`](./logs.md) | Просмотр логов контейнера встроенной базы данных |

## Примеры

```bash
nb db check --env app1
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
