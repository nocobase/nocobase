---
title: "nb plugin list"
description: "Справочник по команде nb plugin list: список плагинов выбранного env NocoBase."
keywords: "nb plugin list,NocoBase CLI,список плагинов"
---

# nb plugin list

Перечисляет плагины, установленные в выбранном env.

## Использование

```bash
nb plugin list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя env CLI, при пропуске используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |

## Примеры

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
