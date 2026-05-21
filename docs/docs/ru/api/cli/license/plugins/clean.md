---
title: "nb license plugins clean"
description: "Справочник по команде nb license plugins clean: удаление загруженных коммерческих плагинов для выбранного env."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Удаляет загруженные коммерческие плагины для выбранного env без изменения статуса активации лицензии.

## Использование

```bash
nb license plugins clean [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--dry-run` | boolean | Предварительно показать, какие плагины будут удалены, ничего не удаляя |
| `--verbose` | boolean | Показывать подробные логи по каждому плагину |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
