---
title: "nb app start"
description: "Справочник по команде nb app start: запуск приложения NocoBase или Docker-контейнера указанного env."
keywords: "nb app start,NocoBase CLI,запуск приложения,Docker,pm2"
---

# nb app start

Запуск приложения NocoBase указанного env. Установки npm/Git запускают локальные команды приложения, установки Docker запускают сохранённый контейнер приложения.

## Использование

```bash
nb app start [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для запуска; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--quickstart` | boolean | Быстрый запуск приложения |
| `--port`, `-p` | string | Переопределяет `appPort` в конфигурации env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Запускать ли в режиме демона, по умолчанию включено |
| `--instances`, `-i` | integer | Количество запускаемых инстансов |
| `--launch-mode` | string | Способ запуска: `pm2` или `node` |
| `--verbose` | boolean | Показать вывод низкоуровневых локальных или Docker-команд |

## Примеры

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local --verbose
nb app start --env local-docker
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
