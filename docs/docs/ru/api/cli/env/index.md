---
title: 'nb env'
description: 'Справка по команде nb env: управление env в NocoBase CLI, включая добавление, просмотр current env, проверку состояния, переключение, обновление, генерацию прокси-конфигураций, аутентификацию и удаление.'
keywords: 'nb env,NocoBase CLI,управление окружением,env,current env,proxy,аутентификация,OpenAPI'
---

# nb env

Управляет сохранёнными env в NocoBase CLI. Env сохраняет информацию о подключении и локальном запуске, такую как адрес API, данные аутентификации, путь к локальному приложению и конфигурацию базы данных.

Начиная с этой версии, CLI разделяет два понятия:

- `current env`: env, который сейчас используется текущей оболочкой или agent runtime, по возможности изолируется через `NB_SESSION_ID`
- `last env`: последний env, использованный глобально, применяется как резервное значение, если режим сессии не включён

## Использование

```bash
nb env <command>
```

## Подкоманды

| Команда                          | Описание                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Сохраняет endpoint API NocoBase и переключается на этот env                                                      |
| [`nb env current`](./current.md) | Показать текущий активный env                                                                                    |
| [`nb env update`](./update.md)   | Обновляет конфигурацию сохранённого env и при необходимости автоматически обрабатывает последующую синхронизацию |
| [`nb env list`](./list.md)       | Вывести список настроенных env                                                                                   |
| [`nb env status`](./status.md)   | Показать состояние текущего env, указанного env или всех env                                                     |
| [`nb env info`](./info.md)       | Показать подробную информацию об одном env                                                                       |
| [`nb env proxy`](./proxy.md)   | Генерирует конфигурацию прокси Nginx или Caddy для управляемого env                                             |
| [`nb env remove`](./remove.md)   | Удаляет конфигурацию env после остановки управляемого runtime                                                    |
| [`nb env auth`](./auth.md)       | Выполняет вход OAuth для сохранённого env                                                                        |
| [`nb env use`](./use.md)         | Переключает текущий env                                                                                          |

## Примеры

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

По умолчанию рекомендуется включить session mode. Тогда `current env` в разных терминалах, разных оболочках или разных agent runtime будет изолирован, и они не будут влиять друг на друга при параллельной работе.

Если session mode не включён, `nb env use` обновит глобальный `last env`, и другие сессии без изоляции по сессии также будут затронуты.

Как включить этот режим, смотрите в [`nb session setup`](../session/setup.md).

## Связанные команды

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
