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
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--dry-run` | boolean | Предварительный просмотр изменений без установки, обновления или удаления плагинов |
| `--version` | string | Версия registry или dist-tag для синхронизации; по умолчанию используется текущая версия workspace |
| `--skip-if-no-license` | boolean | Пропустить без ошибки, если у текущего env ещё нет сохранённого лицензионного ключа |
| `--verbose` | boolean | Показывать подробные логи по каждому плагину |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Примечания

Если `--version` не указан, CLI автоматически определяет текущую версию приложения и использует её, чтобы решить, какую версию registry коммерческих плагинов нужно загрузить.

`--skip-if-no-license` игнорирует только один случай: у текущего env ещё нет сохранённого лицензионного ключа. Другие ошибки, например отсутствие учётных данных registry в ключе, сбой входа в registry или ошибка загрузки плагинов, по-прежнему выводятся как обычно.

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
