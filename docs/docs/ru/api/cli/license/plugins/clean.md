---
title: "nb license plugins clean"
description: "Справочник по команде nb license plugins clean: удаление загруженных коммерческих плагинов для выбранного окружения."
keywords: "nb license plugins clean,NocoBase CLI,коммерческие плагины"
---

# nb license plugins clean

Удаляет загруженные коммерческие плагины для выбранного окружения без изменения активации лицензии.

## Использование

```bash
nb license plugins clean [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI-окружения; если не указано, используется текущее окружение |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на окружение, отличное от текущего, пропускает интерактивное подтверждение |
| `--dry-run` | boolean | Предварительно показать, какие плагины будут удалены, ничего не удаляя |
| `--verbose` | boolean | Показывать подробные логи очистки по каждому плагину |
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

Если вы явно передаёте `--env`, и оно отличается от текущего окружения, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях ИИ агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
