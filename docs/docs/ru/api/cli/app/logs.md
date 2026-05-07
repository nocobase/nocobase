---
title: "nb app logs"
description: "Справочник по команде nb app logs: просмотр логов приложения NocoBase указанного env."
keywords: "nb app logs,NocoBase CLI,логи приложения,Docker logs,pm2 logs"
---

# nb app logs

Просмотр логов приложения. Для установок npm/Git читаются логи pm2, для установок Docker — логи Docker-контейнера.

## Использование

```bash
nb app logs [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для просмотра логов; если не указано, используется текущий env |
| `--tail` | integer | Количество последних строк логов, отображаемых перед началом отслеживания, по умолчанию `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Отслеживать ли новые логи в реальном времени |

## Примеры

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Связанные команды

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
