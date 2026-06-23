---
title: 'nb init'
description: 'Справка по команде nb init: новая установка, подключение уже существующего локального приложения или соединение с удалённым приложением и сохранение как CLI env.'
keywords: 'nb init,NocoBase CLI,инициализация,env,Docker,npm,Git,удалённое подключение'
---

# nb init

Инициализирует текущее рабочее пространство, чтобы coding agent мог подключаться к NocoBase и использовать его.

`nb init` может установить новое локальное приложение NocoBase, а также сохранить параметры подключения уже существующего приложения.

Кроме того, `nb init` по умолчанию синхронизирует NocoBase AI coding skills. Добавлять `--skip-skills` нужно только если вы уже самостоятельно управляете skills либо запускаете команду в CI или офлайн-среде.

## Использование

```bash
nb init [flags]
```

## Интерактивные режимы

`nb init` поддерживает три интерактивных режима:

- `nb init`：пошаговое выполнение мастера в терминале
- `nb init --ui`：открывает форму в локальном браузере и завершает setup через визуальный мастер
- `nb init --yes --env app1`：пропускает подсказки и сразу использует flags; параметры, не переданные явно, обрабатываются со значениями по умолчанию

Режим `--yes` подходит для скриптов, CI/CD и других неинтерактивных сценариев. В этом режиме `--env <envName>` обязателен. Как правило, по умолчанию будет установлено новое локальное приложение; если вы не укажете `--source`, источником установки по умолчанию будет `docker`.

## Возобновление прерванной инициализации

Для сценариев установки env-конфигурация сначала сохраняется, а затем выполняются загрузка, настройка базы данных и установка приложения. Если процесс прервался, можно продолжить:

```bash
nb init --env app1 --resume
```

`--resume` применим только к процессам инициализации, где env-конфигурация уже была сохранена, и требует явной передачи `--env`.

## Сначала подготовить env, а приложение установить позже

`--prepare-only` предназначен для сценариев, где сначала нужно подготовить env, затем активировать лицензию, и только после этого установить и запустить приложение.

Если вы хотите сначала сохранить конфигурацию env и подготовить базу данных, но отложить скачивание зависимостей, фактическую установку приложения и первый запуск, можно использовать:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Этот режим доступен для сценариев локальной установки, включая мастер `--ui`. Он недоступен для сценариев удалённого подключения. CLI сохранит текущий env в состоянии prepared, поэтому позже вы сможете продолжить с помощью такого сценария:

```bash
nb license activate --env app1
nb app start --env app1
```

После этого `nb app start` завершит первую установку и переведёт env из состояния prepared в обычное состояние installed.

## О каталоге установки

Полный путь можно посмотреть через `nb env info app1 --field app.appPath`.

По умолчанию CLI организует локальные файлы в `app-path` по следующему соглашению:

```text
<app-path>/
├── .nb/      # Метаданные CLI для этого env, например hooks.mjs
├── source/   # Каталог по умолчанию для исходников приложения или загруженного содержимого
├── storage/  # Каталог данных времени выполнения
└── .env      # Необязательный файл переменных окружения приложения
```

Обычно:

- `.nb/` хранит метаданные, управляемые CLI. Скрипт, переданный через `--hook-script`, копируется в `<app-path>/.nb/hooks.mjs`, чтобы последующие `nb app upgrade` и локальное восстановление source могли использовать его повторно
- `source/` в основном соответствует локальному каталогу приложения для env типа npm / Git. Для Docker env CLI тоже сохраняет эту схему путей по умолчанию, но в большинстве случаев вам не нужно заботиться об этом вручную. При обновлении обратите особое внимание: каталог `source/` будет удален и загружен заново, поэтому не храните здесь файлы, которые нужно сохранить
- `storage/` используется для данных времени выполнения, например встроенной базы данных, плагинов, логов и т. д.
- `.env` — необязательный файл переменных окружения приложения. Добавлять его в `<app-path>/.env` нужно только если вы хотите настроить свои переменные окружения; если файл существует, источники установки Docker, npm и Git по умолчанию будут его читать

Это соглашение CLI о каталогах по умолчанию. Для разных источников установки, плагинов и этапов выполнения фактически создаваемое содержимое каталогов может отличаться.

## Примечания

:::warning Внимание

- `--ui` нельзя использовать вместе с `--yes`
- `--ui` также нельзя использовать вместе с `--resume`
- `--ui-host` и `--ui-port` можно использовать только вместе с `--ui`
- `--skip-auth` нельзя использовать вместе с `--access-token` или `--token`

:::

## Быстрая навигация по Steps

В разных путях setup отображаются разные Steps. Например, при подключении к существующему приложению обычно используются только `Getting started` и `Remote connection`.

Если вы проходите локальный UI-мастер шаг за шагом, можете сначала воспользоваться таблицей ниже для быстрой навигации:

| Step                      | Параметры, на которые стоит обратить внимание                                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts`、`--hook-script` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Параметры

Параметров довольно много, поэтому понятнее рассматривать их по сценариям использования.

Под “значением по умолчанию” ниже имеется в виду значение или поведение, которое `nb init` обычно использует, если параметр опущен.

### Базовые и интерактивные

| Параметр        | Тип     | Значение по умолчанию                                                                     | Описание                                                                                                      |
| --------------- | ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                                   | Пропустить подсказки и использовать flags и значения по умолчанию                                             |
| `--env`, `-e`   | string  | Нет                                                                                       | Имя env, сохраняемого при этой инициализации; обязательно в режимах `--yes` и `--resume`                      |
| `--ui`          | boolean | `false`                                                                                   | Открыть мастер в локальном браузере; нельзя использовать вместе с `--yes` и `--resume`                        |
| `--verbose`     | boolean | `false`                                                                                   | Показывать подробный вывод команд                                                                             |
| `--skip-skills` | boolean | `false`                                                                                   | Пропустить синхронизацию NocoBase AI coding skills                                                            |
| `--ui-host`     | string  | `127.0.0.1`                                                                               | Адрес привязки локального сервиса `--ui`                                                                      |
| `--ui-port`     | integer | `0`                                                                                       | Порт локального сервиса `--ui`; `0` означает автоматическое назначение                                        |
| `--locale`      | string  | Следует `NB_LOCALE`, настройке CLI или системной locale; окончательный fallback — `en-US` | Язык подсказок CLI и локального UI setup: `en-US` или `zh-CN`                                                 |
| `--resume`      | boolean | `false`                                                                                   | Продолжить предыдущую незавершённую инициализацию с повторным использованием сохранённой workspace env config |
| `--prepare-only` | boolean | `false`                                                                                  | Сохранить и подготовить env для локальной установки, включая сценарии `--ui`, но пока не устанавливать и не запускать приложение |

### Подключение существующего приложения

| Параметр               | Тип     | Значение по умолчанию | Описание                                                                                                                                                |
| ---------------------- | ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Нет                   | Корневой адрес API, обязательно должен содержать префикс `/api`                                                                                         |
| `--auth-type`, `-a`    | string  | `oauth`               | Способ аутентификации: `basic`, `token` или `oauth`. Обычно подходит `oauth` по умолчанию; в некоторых сценариях CI/CD также можно использовать `basic` |
| `--access-token`, `-t` | string  | Нет                   | API key или access token для аутентификации `token`                                                                                                     |
| `--username`           | string  | Нет                   | Имя пользователя для аутентификации `basic`                                                                                                             |
| `--password`           | string  | Нет                   | Пароль для аутентификации `basic`                                                                                                                       |
| `--skip-auth`          | boolean | `false`               | Сначала сохранить env и способ аутентификации, а затем завершить вход через `nb env auth` позже                                                         |

### Базовые параметры локальной установки

| Параметр          | Тип     | Значение по умолчанию                    | Описание                                                                                                  |
| ----------------- | ------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                                  | Язык интерфейса нового установленного приложения                                                          |
| `--force`, `-f`   | boolean | `false`                                  | Повторно настроить существующий env и при необходимости заменить конфликтующие ресурсы времени выполнения |
| `--app-path`      | string  | `./<envName>/`                           | Каталог локального приложения npm/Git                                                                     |
| `--app-port`      | string  | `13000`                                  | HTTP-порт локального приложения; в режиме `--yes` автоматически выбирается свободный порт                 |
| `--root-username` | string  | `nocobase`（в режиме `--yes`）           | Имя начального администратора                                                                             |
| `--root-email`    | string  | `admin@nocobase.com`（в режиме `--yes`） | Email начального администратора                                                                           |
| `--root-password` | string  | `admin123`（в режиме `--yes`）           | Пароль начального администратора                                                                          |
| `--root-nickname` | string  | `Super Admin`（в режиме `--yes`）        | Отображаемое имя начального администратора                                                                |

### Параметры базы данных

| Параметр                                   | Тип     | Значение по умолчанию                                              | Описание                                                          |
| ------------------------------------------ | ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                             | Создавать и подключать ли встроенную базу данных, управляемую CLI |
| `--db-dialect`                             | string  | `postgres`                                                         | Тип базы данных: `postgres`、`mysql`、`mariadb`、`kingbase`       |
| `--builtin-db-image`                       | string  | Следует `--db-dialect` и locale                                    | Образ контейнера встроенной базы данных                           |
| `--db-host`                                | string  | Для встроенной базы данных — `postgres`; для внешней — `127.0.0.1` | Адрес хоста базы данных                                           |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`    | Порт базы данных                                                  |
| `--db-database`                            | string  | `nocobase`; для KingbaseES — `kingbase`                            | Имя базы данных                                                   |
| `--db-user`                                | string  | `nocobase`                                                         | Имя пользователя базы данных                                      |
| `--db-password`                            | string  | `nocobase`                                                         | Пароль базы данных                                                |
| `--db-schema`                              | string  | Нет                                                                | Schema базы данных; используется только в PostgreSQL              |
| `--db-table-prefix`                        | string  | Нет                                                                | Префикс таблиц базы данных                                        |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                            | Использовать ли стиль с подчёркиваниями для имён таблиц и полей   |

### Параметры загрузки и исходного кода

| Параметр                                             | Тип     | Значение по умолчанию                                                                           | Описание                                                                                      |
| ---------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                         | Пропустить загрузку и использовать существующий локальный каталог приложения или Docker-образ |
| `--source`, `-s`                                     | string  | `docker`                                                                                        | Способ получения NocoBase: `docker`、`npm` или `git`                                          |
| `--version`, `-v`                                    | string  | `beta`                                                                                          | Параметр версии: версия npm-пакета, tag Docker-образа или Git ref                             |
| `--replace`, `-r`                                    | boolean | `false`                                                                                         | Заменить, если целевой каталог уже существует                                                 |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                         | Устанавливать ли devDependencies при установке через npm/Git                                  |
| `--output-dir`, `-o`                                 | string  | Для npm/Git выводится из `--app-path`; для Docker + `--docker-save` — `./nocobase-<version>`    | Целевой каталог загрузки или каталог сохранения tarball при включённом `--docker-save`        |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                      | Адрес Git-репозитория                                                                         |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; для locale `zh-CN` — `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Имя репозитория Docker-образа без tag                                                         |
| `--docker-platform`                                  | string  | `auto`                                                                                          | Платформа Docker-образа: `auto`、`linux/amd64`、`linux/arm64`                                 |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                         | Сохранять ли Docker-образ дополнительно как tarball после загрузки                            |
| `--npm-registry`                                     | string  | Пусто                                                                                           | Registry для загрузки npm/Git и установки зависимостей                                        |
| `--build` / `--no-build`                             | boolean | `true`                                                                                          | Выполнять ли сборку после установки зависимостей npm/Git                                      |
| `--build-dts`                                        | boolean | `false`                                                                                         | Генерировать ли объявления TypeScript при сборке npm/Git                                      |
| `--hook-script`                                      | string  | Нет                                                                                             | Копирует указанный hook-модуль в `<app-path>/.nb/hooks.mjs` и сохраняет его в env config; поддерживает lifecycle hooks `beforeDependencyInstall`, `beforeAppInstall` и `afterAppStart` |

## Примеры

Ниже приведены несколько самых распространённых вариантов использования.

### Пошаговое выполнение мастера в терминале

```bash
nb init
```

### Открытие мастера в локальном браузере

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Сначала подготовить, затем активировать лицензию и запустить позже

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Неинтерактивная установка нового локального приложения

Если не указывать `--source`, обычно в качестве источника установки используется Docker.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Расширение установки с помощью hook-скрипта

Если во время установки нужно подготовить дополнительные файлы, передайте локальный ESM-модуль через `--hook-script`:

```bash
nb init --env app1 --yes --source git --hook-script ./hooks.mjs
```

CLI копирует этот файл в `<app-path>/.nb/hooks.mjs` и сохраняет `hookScript: ".nb/hooks.mjs"` в env config. Последующие `nb app start`, `nb app restart` и `nb app upgrade` используют его из этого места.

Файл hook должен экспортировать объект по умолчанию. Реализуйте только нужные методы:

```js
export default {
  beforeDependencyInstall: async (context) => {
    // Runs after git clone / npm scaffold and before yarn install.
  },
  beforeAppInstall: async (context) => {
    // Runs before the app-level install or upgrade command.
  },
  afterAppStart: async (context) => {
    // Runs after the app actually starts and passes the health check.
  },
};
```

- `beforeDependencyInstall` применяется только к source npm/Git и запускается прямо перед настоящим `yarn install`; Docker source его не запускает
- `beforeAppInstall` запускается перед командами install или upgrade уровня приложения и применяется к source npm/Git/Docker
- `afterAppStart` запускается после фактического старта приложения и успешного `__health_check`; его могут вызвать `nb app start`, `nb app restart` и `nb app upgrade`

`--prepare-only` только сохраняет env config и копирует файл hook. Hooks при этом не выполняются. Когда позже вы впервые запустите `nb app start`, CLI выполнит hooks первой установки с `context.phase` равным `init` и `context.command` равным `app:start`.

`context` содержит lifecycle-информацию, например `phase`, `command`, `source`, `version`, `appPath`, `sourcePath`, `storagePath`, `hookScript` и `envConfig`. Если hook выбросит ошибку, текущая CLI-команда завершится с ошибкой. Так как `afterAppStart` может выполняться повторно при start, restart и upgrade, сделайте его идемпотентным.

### Быстрая установка и использование аутентификации basic

Если вы хотите в неинтерактивном режиме быстро установить локальное приложение и сразу после установки сохранить аутентификацию `basic`, можно написать так. Тогда не нужно будет открывать браузер для завершения OAuth.

Если использовать стандартную учётную запись администратора из режима `--yes`, самый короткий вариант такой.

Если не указано, имя администратора по умолчанию — `nocobase`, а пароль по умолчанию — `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Если вы хотите одновременно настроить собственную учётную запись администратора, можно написать так:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Подключение существующего приложения

Обычно достаточно OAuth по умолчанию. Если в некоторых сценариях CI/CD неудобно открывать браузер, можно сразу сохранить аутентификацию `basic`; если у вас уже есть API token, можно сразу сохранить аутентификацию `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Настройка именования базы данных

Если вам нужно указать schema PostgreSQL, префикс таблиц или стиль именования с подчёркиваниями, можно передать параметры так:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Продолжение предыдущей прерванной инициализации

```bash
nb init --env app1 --resume
```

### Подробные логи для устранения неполадок

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Связанные команды

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
