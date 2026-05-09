---
title: "nb env"
description: "Справочник по команде nb env: управление env NocoBase CLI, включая добавление, просмотр текущего env, проверку статуса, переключение, аутентификацию и удаление."
keywords: "nb env,NocoBase CLI,управление окружениями,env,текущий env,аутентификация,OpenAPI"
---

# nb env

Управление сохранёнными env NocoBase CLI. env хранит адрес API, данные аутентификации, пути к локальному приложению, конфигурацию базы данных и кэш runtime-команд.

В текущей модели CLI разделяет два понятия:

- `current env`: env, используемый активной shell или runtime агента; по возможности изолируется через `NB_SESSION_ID`
- `last env`: глобально последний использованный env; используется как fallback, когда session mode не включён

## Использование


nb env <command>

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb env add`](./add.md) | Сохраняет endpoint API NocoBase и переключает на этот env |
| [`nb env current`](./current.md) | Показывает фактически используемый env |
| [`nb env update`](./update.md) | Обновляет OpenAPI Schema и кэш runtime-команд из приложения |
| [`nb env list`](./list.md) | Показывает настроенные env |
| [`nb env status`](./status.md) | Показывает статус текущего env, одного env или всех env |
| [`nb env info`](./info.md) | Показывает подробную информацию об одном env |
| [`nb env remove`](./remove.md) | Удаляет конфигурацию env |
| [`nb env auth`](./auth.md) | Выполняет вход через OAuth для сохранённого env |
| [`nb env use`](./use.md) | Переключает текущий env |

## Примеры


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode рекомендуется по умолчанию. Он изолирует `current env` между разными терминалами, shell и runtime агентов, чтобы параллельная работа не влияла друг на друга.

Если session mode не включён, `nb env use` обновляет глобальный `last env`, и другие не изолированные сессии тоже могут быть затронуты.

Включите его с помощью [`nb session setup`](../session/setup.md).

## Связанные команды

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
