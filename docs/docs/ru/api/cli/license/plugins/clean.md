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
| `--dry-run` | boolean | Предварительно показать, какие плагины будут удалены, ничего не удаляя |
| `--verbose`, `-V` | boolean | Показывать подробные логи по каждому плагину |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
