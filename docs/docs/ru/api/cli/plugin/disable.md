---
title: "nb plugin disable"
description: "Справочник по команде nb plugin disable: отключение одного или нескольких плагинов в выбранном окружении NocoBase."
keywords: "nb plugin disable,NocoBase CLI,отключение плагинов"
---

# nb plugin disable

Отключает один или несколько плагинов в выбранном окружении.

## Использование

```bash
nb plugin disable <packages...> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<packages...>` | string[] | Имена пакетов плагинов; обязательный параметр, поддерживает несколько значений |
| `--env`, `-e` | string | Имя CLI-окружения; если не указано, используется текущее окружение |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на окружение, отличное от текущего, пропускает интерактивное подтверждение |

## Примеры

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Если вы явно передаёте `--env`, и оно отличается от текущего окружения, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях ИИ агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
