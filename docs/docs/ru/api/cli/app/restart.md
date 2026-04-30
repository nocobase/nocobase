---
title: "nb app restart"
description: "Справочник по команде nb app restart: перезапуск приложения NocoBase или Docker-контейнера указанного env."
keywords: "nb app restart,NocoBase CLI,перезапуск приложения,Docker"
---

# nb app restart

Остановка и затем запуск приложения NocoBase указанного env.

## Использование

```bash
nb app restart [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для перезапуска; если не указано, используется текущий env |
| `--quickstart` | boolean | Быстрый запуск приложения после остановки |
| `--port`, `-p` | string | Переопределяет `appPort` в конфигурации env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Запускать ли в режиме демона после остановки, по умолчанию включено |
| `--instances`, `-i` | integer | Количество инстансов после остановки |
| `--launch-mode` | string | Способ запуска: `pm2` или `node` |
| `--verbose` | boolean | Показать вывод низкоуровневых команд остановки и запуска |

## Примеры

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Связанные команды

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
