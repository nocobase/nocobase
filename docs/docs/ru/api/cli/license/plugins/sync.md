---
title: "nb license plugins sync"
description: "Справочник по команде nb license plugins sync: синхронизация коммерческих плагинов, разрешённых текущей лицензией для выбранного env."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Синхронизирует коммерческие плагины, разрешённые текущей лицензией.

## Использование

```bash
nb license plugins sync [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--dry-run` | boolean | Предварительный просмотр изменений без установки, обновления или удаления плагинов |
| `--version` | string | Версия registry или dist-tag для синхронизации; по умолчанию используется текущая версия workspace |
| `--verbose`, `-V` | boolean | Показывать подробные логи по каждому плагину |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Примечания

Если `--version` не указан, CLI автоматически определяет текущую версию приложения и использует её, чтобы решить, какую версию registry коммерческих плагинов нужно загрузить.

## Связанные команды

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
