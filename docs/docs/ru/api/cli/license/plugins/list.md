---
title: "nb license plugins list"
description: "Справочник по команде nb license plugins list: отображение коммерческих плагинов, связанных с текущей лицензией для выбранного окружения."
keywords: "nb license plugins list,NocoBase CLI,коммерческие плагины"
---

# nb license plugins list

Показывает коммерческие плагины, связанные с сохранённым ключом лицензии для выбранного окружения.

## Использование

```bash
nb license plugins list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI-окружения; если не указано, используется текущее окружение |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на окружение, отличное от текущего, пропускает интерактивное подтверждение |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Если вы явно передаёте `--env`, и оно отличается от текущего окружения, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях ИИ агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
