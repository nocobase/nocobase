---
title: "nb app"
description: "Справочник по команде nb app: управление состоянием приложения NocoBase, включая запуск, остановку, перезапуск, логи, очистку и обновление."
keywords: "nb app,NocoBase CLI,запуск,остановка,перезапуск,логи,обновление"
---

# nb app

Управление состоянием приложения NocoBase. Для env npm/Git команды приложения выполняются в локальном каталоге исходников, а для env Docker — управляются сохранённые контейнеры приложения.

## Использование

```bash
nb app <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb app start`](./start.md) | Запуск приложения или Docker-контейнера |
| [`nb app stop`](./stop.md) | Остановка приложения или Docker-контейнера |
| [`nb app restart`](./restart.md) | Остановка и затем запуск приложения |
| [`nb app logs`](./logs.md) | Просмотр логов приложения |
| [`nb app down`](./down.md) | Остановка и очистка локальных runtime-ресурсов |
| [`nb app upgrade`](./upgrade.md) | Обновление исходников или образа и перезапуск приложения |

## Примеры

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
