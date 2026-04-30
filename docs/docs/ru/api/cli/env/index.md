---
title: "nb env"
description: "Справочник по команде nb env: управление env NocoBase CLI, включая добавление, обновление, просмотр, переключение, аутентификацию и удаление."
keywords: "nb env,NocoBase CLI,управление окружениями,env,аутентификация,OpenAPI"
---

# nb env

Управление сохранёнными env NocoBase CLI. env хранит адрес API, данные аутентификации, путь к локальному приложению, конфигурацию базы данных и кэш runtime-команд.

## Использование

```bash
nb env <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb env add`](./add.md) | Сохраняет endpoint API NocoBase и переключается на него как на текущий env |
| [`nb env update`](./update.md) | Обновляет OpenAPI Schema и кэш runtime-команд из приложения |
| [`nb env list`](./list.md) | Перечисляет настроенные env и состояние аутентификации API |
| [`nb env info`](./info.md) | Показывает подробную информацию об одном env |
| [`nb env remove`](./remove.md) | Удаляет конфигурацию env |
| [`nb env auth`](./auth.md) | Выполняет вход через OAuth для сохранённого env |
| [`nb env use`](./use.md) | Переключает текущий env |

## Примеры

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
