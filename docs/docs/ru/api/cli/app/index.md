---
title: "nb app"
description: "Справочник по команде nb app: управление состоянием приложения NocoBase, включая запуск, остановку, перезапуск, логи, очистку и обновление."
keywords: "nb app,NocoBase CLI,запуск,остановка,перезапуск,логи,обновление"
---

# nb app

Управление состоянием приложения NocoBase. Для env npm/Git команды приложения выполняются в локальном каталоге исходников, а для env Docker контейнеры приложения управляются на основе сохранённой конфигурации env.

## Использование

```bash
nb app <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb app start`](./start.md) | Запуск приложения или пересоздание Docker-контейнера |
| [`nb app stop`](./stop.md) | Остановка приложения или удаление Docker-контейнера |
| [`nb app restart`](./restart.md) | Остановка и затем запуск приложения |
| [`nb app logs`](./logs.md) | Просмотр логов приложения |
| [`nb app down`](./down.md) | Остановка и очистка локальных runtime-ресурсов |
| [`nb app destroy`](./destroy.md) | Удаление управляемых runtime-ресурсов, данных storage и сохранённой конфигурации env |
| [`nb app upgrade`](./upgrade.md) | Остановка приложения, замена исходников или образа и повторный запуск |

## Примеры

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app down --env app1 --all --force
nb app destroy --env app1 --force
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
