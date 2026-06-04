---
title: "nb app restart"
description: "Справочник по команде nb app restart: перезапуск приложения NocoBase указанного env и пересоздание контейнера приложения из сохранённой конфигурации для Docker env."
keywords: "nb app restart,NocoBase CLI,перезапуск приложения,Docker"
---

# nb app restart

Остановка и повторный запуск приложения NocoBase указанного env. Локальные env повторно используют поток `nb app stop` и `nb app start`; Docker env сначала удаляют текущий контейнер, а затем пересоздают контейнер приложения на основе сохранённой конфигурации env.

## Использование

```bash
nb app restart [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для перезапуска; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
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
nb app restart --env local --verbose
nb app restart --env local-docker
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

Каждый раз, когда CLI нужно дождаться готовности приложения, она проверяет `__health_check`: сначала выводит одну строку ожидания, а затем одну строку прогресса каждые 10 секунд, пока приложение не станет доступно или не истечёт время ожидания. Если для локального env передать `--no-daemon`, приложение будет работать в foreground, поэтому CLI не продолжит ждать проверку readiness после запуска.

## Связанные команды

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
