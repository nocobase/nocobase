---
title: "nb env status"
description: "Справочник по команде nb env status: показать статус текущего env, одного env или всех env."
keywords: "nb env status,NocoBase CLI,статус окружения,API Base URL"
---

# nb env status

Показывает статус env. По умолчанию проверяется текущий env. Также можно проверить один указанный env или использовать `--all` для всех env.

Эта команда выводит упрощённую таблицу статуса с `Env`, `Status` и `API Base URL`.

## Использование


nb env status [name] [flags]

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя настроенного env для просмотра; если не указано, используется текущий env и его нельзя использовать вместе с `--all` |
| `--all` | boolean | Показать статус всех настроенных env |
| `--json-output` | boolean | Вывести результат в формате JSON |

`[name]` и `--all` нельзя использовать вместе.

## Status values

`Status` — это результат проверки целевого env со стороны CLI. Типичные значения:

- `ok`: env доступен и успешно аутентифицирован
- `auth failed`: API доступен, но аутентификация не прошла
- `unreachable`: не удалось обратиться к целевому адресу
- `unconfigured`: конфигурация env неполная
- `missing`: управляемое приложение для этого env больше не существует

## Примеры


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Связанные команды

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
