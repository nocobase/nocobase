---
title: "nb env"
description: "Справка по команде nb env: управлять сохранёнными env в NocoBase CLI, включая добавление, просмотр текущего env, проверку статуса, переключение, обновление, аутентификацию и удаление."
keywords: "nb env,NocoBase CLI,управление окружениями,env,current env,аутентификация,OpenAPI"
---

# nb env

Управляет сохранёнными env в NocoBase CLI. Env хранит сведения о подключении и локальной среде выполнения, такие как адрес API, данные аутентификации, путь к локальному приложению и конфигурация базы данных.

Начиная с этой версии CLI разделяет два понятия:

- `current env`: env, который сейчас использует активная оболочка или runtime агента; по возможности он изолируется через `NB_SESSION_ID`
- `last env`: env, который использовался последним глобально; он применяется как fallback, если mode session не включён

## Использование

```bash
nb env <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb env add`](./add.md) | Сохранить endpoint API NocoBase и переключиться на этот env |
| [`nb env current`](./current.md) | Показать env, который сейчас действует |
| [`nb env update`](./update.md) | Обновить конфигурацию сохранённого env и при необходимости автоматически выполнить последующую синхронизацию |
| [`nb env list`](./list.md) | Показать список настроенных env |
| [`nb env status`](./status.md) | Показать статус текущего env, указанного env или всех env |
| [`nb env info`](./info.md) | Показать подробную информацию об одном env |
| [`nb env remove`](./remove.md) | Удалить конфигурацию env после остановки управляемого runtime |
| [`nb env auth`](./auth.md) | Выполнить OAuth-вход для сохранённого env |
| [`nb env use`](./use.md) | Переключить текущий env |

## Примеры

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Mode session

По умолчанию рекомендуется включить mode session. Это позволяет `current env` в разных терминалах, оболочках или runtime агентов оставаться изолированными и не влиять друг на друга параллельно.

Если mode session не включён, `nb env use` обновляет глобальный `last env`, и другие сессии без session-изоляции тоже будут затронуты.

Как включить этот режим, см. в [`nb session setup`](../session/setup.md).

## Связанные команды

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
