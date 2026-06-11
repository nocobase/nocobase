---
title: "nb license plugins list"
description: "Справочник по команде nb license plugins list: отображение коммерческих плагинов, связанных с текущей лицензией для выбранного env."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Показывает коммерческие плагины, связанные с сохранённым license key для выбранного env.

## Использование

```bash
nb license plugins list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
