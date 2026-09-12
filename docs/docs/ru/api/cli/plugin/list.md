---
title: "nb plugin list"
description: "Справочник по команде nb plugin list: список плагинов выбранного окружения NocoBase."
keywords: "nb plugin list,NocoBase CLI,список плагинов"
---

# nb plugin list

Показывает список установленных плагинов для выбранного окружения.

## Использование

```bash
nb plugin list [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI-окружения; если не указано, используется текущее окружение |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на окружение, отличное от текущего, пропускает интерактивное подтверждение |

## Примеры

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Если вы явно передаёте `--env`, и оно отличается от текущего окружения, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях ИИ агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
