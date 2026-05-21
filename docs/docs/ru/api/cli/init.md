---
title: "nb init"
description: "Справочник по команде nb init: инициализация NocoBase, подключение существующего приложения или установка нового, сохранение в качестве CLI env."
keywords: "nb init,NocoBase CLI,инициализация,env,Docker,npm,Git"
---

# nb init

Инициализация текущей рабочей области, чтобы coding agent мог подключаться к NocoBase и использовать его. `nb init` может подключаться к существующему приложению, а также устанавливать новое приложение через Docker, npm или Git.

## Использование

```bash
nb init [flags]
```

## Описание

`nb init` поддерживает три режима подсказок:

- Режим по умолчанию: пошаговое заполнение в терминале.
- `--ui`: открытие формы в локальном браузере для прохождения мастера.
- `--yes`: пропуск подсказок и использование значений по умолчанию. В этом режиме обязательно передавать `--env <envName>`, при этом будет создано новое локальное приложение.

По умолчанию `nb init` устанавливает или обновляет NocoBase AI coding skills во время инициализации или её возобновления. Если Вы управляете skills самостоятельно или работаете в CI или офлайн-окружении, используйте `--skip-skills`, чтобы пропустить этот шаг.

Если инициализация была прервана после сохранения конфигурации env, можно продолжить её с помощью `--resume`:

```bash
nb init --env app1 --resume
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Пропустить подсказки и использовать flags и значения по умолчанию |
| `--env`, `-e` | string | Имя env для текущей инициализации, обязательно в режимах `--yes` и `--resume` |
| `--ui` | boolean | Открыть визуальный мастер в браузере, нельзя использовать одновременно с `--yes` |
| `--verbose` | boolean | Показать подробный вывод команд |
| `--skip-skills` | boolean | Пропустить установку или обновление NocoBase AI coding skills во время инициализации |
| `--ui-host` | string | Адрес привязки локального сервиса `--ui`, по умолчанию `127.0.0.1` |
| `--ui-port` | integer | Порт локального сервиса `--ui`, `0` означает автоматическое назначение |
| `--locale` | string | Язык подсказок CLI и UI: `en-US` или `zh-CN` |
| `--api-base-url`, `-u` | string | Адрес API NocoBase, включая префикс `/api` |
| `--auth-type`, `-a` | string | Способ аутентификации: `token` или `oauth` |
| `--access-token`, `-t` | string | API key или access token для способа аутентификации `token` |
| `--resume` | boolean | Продолжить инициализацию, повторно используя сохранённую конфигурацию env рабочей области |
| `--lang`, `-l` | string | Язык приложения NocoBase после установки |
| `--force`, `-f` | boolean | Перенастроить существующий env и при необходимости заменить конфликтующие runtime-ресурсы |
| `--app-root-path` | string | Каталог исходников локального npm/Git приложения, по умолчанию `./<envName>/source/` |
| `--app-port` | string | Порт локального приложения, по умолчанию `13000`, в режиме `--yes` автоматически выбирается доступный порт |
| `--storage-path` | string | Каталог загруженных файлов и данных управляемой базы данных, по умолчанию `./<envName>/storage/` |
| `--root-username` | string | Имя начального администратора |
| `--root-email` | string | Email начального администратора |
| `--root-password` | string | Пароль начального администратора |
| `--root-nickname` | string | Псевдоним начального администратора |
| `--builtin-db`, `--no-builtin-db` | boolean | Создавать ли встроенную базу данных, управляемую CLI |
| `--db-dialect` | string | Тип базы данных: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Образ контейнера встроенной базы данных |
| `--db-host` | string | Адрес базы данных |
| `--db-port` | string | Порт базы данных |
| `--db-database` | string | Имя базы данных |
| `--db-user` | string | Пользователь базы данных |
| `--db-password` | string | Пароль базы данных |
| `--fetch-source` | boolean | Загружать ли файлы приложения или образы Docker перед установкой |
| `--source`, `-s` | string | Способ получения NocoBase: `docker`, `npm` или `git` |
| `--version`, `-v` | string | Параметр версии: версия npm, тег образа Docker или ref Git |
| `--replace`, `-r` | boolean | Заменить целевой каталог, если он уже существует |
| `--dev-dependencies`, `-D` | boolean | Устанавливать ли devDependencies при установке npm/Git |
| `--output-dir`, `-o` | string | Целевой каталог загрузки или каталог сохранения Docker tarball |
| `--git-url` | string | Адрес Git-репозитория |
| `--docker-registry` | string | Имя реестра Docker-образов, без тега |
| `--docker-platform` | string | Платформа Docker-образа: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Сохранять ли Docker-образ в виде tarball после загрузки |
| `--npm-registry` | string | Реестр, используемый для загрузки npm/Git и установки зависимостей |
| `--build`, `--no-build` | boolean | Выполнять ли сборку после установки зависимостей npm/Git |
| `--build-dts` | boolean | Генерировать ли файлы объявлений TypeScript при сборке npm/Git |

## Примеры

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Связанные команды

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
