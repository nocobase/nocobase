---
title: "nb env update"
description: "Справочник по команде nb env update: обновление сохранённой конфигурации API, аутентификации, исходного кода, приложения и базы данных."
keywords: "nb env update,NocoBase CLI,конфигурация окружения,аутентификация,база данных,исходный код"
---

# nb env update

`nb env update` обновляет конфигурацию сохранённого окружения. С его помощью можно изменить адрес API, способ аутентификации, источник исходного кода, локальный путь приложения, публичный путь, порт, параметры базы данных и многое другое. После завершения обновления CLI автоматически выполнит необходимые последующие действия в зависимости от изменений.

Если вы не передадите никаких параметров конфигурации, CLI всё равно выполнит повторную синхронизацию на основе текущего состояния окружения.

## Использование

```bash
nb env update [name] [flags]
```

## Общие параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя настроенного окружения, которое нужно обновить; если не указано, используется текущее окружение |
| `--verbose` | boolean | Показывать подробный прогресс |

## Параметры API и аутентификации

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL API NocoBase, включая префикс `/api` |
| `--auth-type` | string | Способ аутентификации: `basic`, `token` или `oauth` |
| `--access-token`, `--token`, `-t` | string | API key или access token для аутентификации `token`. При сохранении тип аутентификации также переключается на `token` |
| `--username` | string | Имя пользователя, сохраняемое для аутентификации `basic`. Используйте его только если текущее окружение уже использует `basic`, или вместе с `--auth-type basic` |

## Параметры источника и загрузки

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--source` | string | Сохранённый источник приложения: `docker`, `git`, `local`, `npm` |
| `--download-version`, `--version` | string | Сохранённый селектор версии: Docker tag, версия npm-пакета или Git ref |
| `--docker-registry` | string | Имя реестра Docker-образов без тега |
| `--docker-platform` | string | Платформа Docker-образа: `auto`, `linux/amd64` или `linux/arm64` |
| `--git-url` | string | URL Git-репозитория |
| `--npm-registry` | string | Реестр, используемый для npm- или Git-загрузок и установки зависимостей |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Нужно ли устанавливать `devDependencies` для npm- или Git-источников |
| `--build` / `--no-build` | boolean | Нужно ли автоматически запускать сборку после npm- или Git-загрузки |
| `--build-dts` / `--no-build-dts` | boolean | Нужно ли генерировать TypeScript declaration files во время сборки |

## Параметры приложения

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--app-path` | string | Каталог приложения. Сейчас это рекомендуемый способ управления локальным путём приложения |
| `--app-public-path` | string | Публичный путь приложения (`APP_PUBLIC_PATH`), например `/` или `/nocobase/` |
| `--app-port` | string | HTTP-порт приложения |
| `--cdn-base-url` | string | Базовый URL CDN для статических клиентских ресурсов (`CDN_BASE_URL`) |
| `--app-key` | string | Ключ приложения (`APP_KEY`) |
| `--timezone` | string | Часовой пояс приложения (`TZ`) |

## Параметры базы данных

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Использовать ли встроенную базу данных, управляемую CLI |
| `--db-dialect` | string | Тип базы данных: `postgres`, `mysql`, `mariadb` или `kingbase` |
| `--builtin-db-image` | string | Образ контейнера для встроенной базы данных |
| `--db-host` | string | Хост базы данных |
| `--db-port` | string | Порт базы данных |
| `--db-database` | string | Имя базы данных |
| `--db-user` | string | Имя пользователя базы данных |
| `--db-password` | string | Пароль базы данных |
| `--db-schema` | string | Схема базы данных. Обычно используется только для PostgreSQL |
| `--db-table-prefix` | string | Префикс таблиц |
| `--db-underscored` / `--no-db-underscored` | boolean | Использовать ли стиль с подчёркиваниями в именах таблиц и полей |

## Очистка конфигурации

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--unset` | string[] | Очистить одно или несколько сохранённых полей по имени флага. Можно повторять параметр или передавать список через запятую, например `--unset git-url,username` |

## Примечания

:::tip

Если вам нужно только повторно синхронизировать CLI по последнему состоянию текущего окружения, просто выполните `nb env update` или `nb env update <name>` без дополнительных параметров.

:::

- После завершения обновления CLI автоматически выполнит всю необходимую последующую синхронизацию на основе внесённых на этот раз изменений
- Остальные параметры обновляют только сохранённую конфигурацию окружения; они не перезапускают приложение автоматически и не заменяют локальный исходный код или Docker-образы
- После изменения параметров вроде `app-path`, `app-port`, `timezone` или `db-*` CLI обычно предложит выполнить `nb app restart --env <name>`; если изменение связано со встроенной базой данных, управляемой CLI, будет предложено использовать `nb app restart --env <name> --with-db`
- После изменения параметров вроде `app-port`, `app-public-path` или `cdn-base-url`, которые влияют на вывод обратного прокси, повторно выполните `nb proxy nginx generate` или `nb proxy caddy generate`, если вы уже используете сгенерированную конфигурацию прокси
- При обновлении параметров источника, таких как `source`, `download-version`, `docker-registry`, `git-url` или `npm-registry`, меняются только сохранённые значения. Уже существующие локальный исходный код, зависимости и образы автоматически не заменяются
- `--access-token` нельзя использовать вместе с `--auth-type basic` или `--auth-type oauth`
- Одно и то же поле нельзя использовать одновременно с `--unset` и с явным значением. Например, не используйте `--unset git-url` вместе с `--git-url ...`
- Если вы переключаете способ аутентификации на `basic` или `oauth`, либо очищаете token, обычно после этого нужно выполнить `nb env auth <name>`

## Примеры

```bash
# Повторно синхронизировать текущее окружение по последнему сохранённому состоянию
nb env update

# Повторно синхронизировать конкретное окружение
nb env update prod

# Обновить URL API
nb env update prod --api-base-url http://localhost:13000/api

# Обновить token и переключить тип аутентификации на token
nb env update prod --access-token <token>

# Переключиться на basic-аутентификацию, сохранить имя пользователя и позже выполнить nb env auth
nb env update prod --auth-type basic --username admin

# Обновить сохранённый источник и версию, пока не заменяя локальный код
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Изменить порт приложения и часовой пояс, а затем перезапустить позже
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Изменить публичный путь и при необходимости затем пересоздать прокси
nb env update local --app-public-path /nocobase/

# Сохранить базовый CDN URL для клиентских ресурсов
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Очистить сохранённые поля
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Связанные команды

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
