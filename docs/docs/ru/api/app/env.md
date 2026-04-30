---
title: "Глобальные переменные окружения"
description: "Переменные окружения NocoBase: описание параметров TZ, APP_KEY, DB и других."
keywords: "переменные окружения,APP_KEY,TZ,конфигурация,NocoBase"
---

# Глобальные переменные окружения

## TZ

Используется для установки часового пояса приложения. По умолчанию используется часовой пояс операционной системы.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Все операции, связанные со временем, обрабатываются с учётом этого часового пояса. Изменение TZ может повлиять на значения дат в базе данных. Подробнее см. «[Обзор даты и времени](#)».
:::

## APP_ENV

Окружение приложения. Значение по умолчанию `development`. Доступные варианты:

- `production` — продакшн-окружение
- `development` — окружение разработки

```bash
APP_ENV=production
```

## APP_KEY

Секретный ключ приложения, используется для генерации пользовательских токенов и т. п. Замените его на собственный ключ и не передавайте его третьим лицам.

:::warning
Если значение APP_KEY изменено, ранее выпущенные токены становятся недействительными.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Порт приложения. Значение по умолчанию `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Префикс адресов API NocoBase. Значение по умолчанию `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Режим многоядерного (кластерного) запуска. Если переменная задана, её значение передаётся в команду `pm2 start` в качестве параметра `-i <instances>`. Доступные варианты совпадают с параметром `-i` PM2 (см. [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)):

- `max` — использовать максимальное количество ядер CPU
- `-1` — максимальное количество ядер CPU минус 1
- `<number>` — указанное количество ядер

По умолчанию переменная пуста, что означает выключенный режим.

:::warning{title="Внимание"}
Этот режим требует использования соответствующих плагинов кластерного режима, иначе функциональность приложения может работать некорректно.
:::

Подробнее: [Кластерный режим](#).

## PLUGIN_PACKAGE_PREFIX

Префикс имён пакетов плагинов. Значение по умолчанию: `@nocobase/plugin-,@nocobase/preset-`.

Например, при добавлении плагина `hello` в проект `my-nocobase-app` полное имя пакета плагина будет `@my-nocobase-app/plugin-hello`.

Значение PLUGIN_PACKAGE_PREFIX можно настроить так:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

В этом случае соответствие имён плагинов и пакетов будет таким:

- Плагин `users` имеет имя пакета `@nocobase/plugin-users`
- Плагин `nocobase` имеет имя пакета `@nocobase/preset-nocobase`
- Плагин `hello` имеет имя пакета `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Тип базы данных. Доступные варианты:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Хост базы данных (требуется при использовании MySQL или PostgreSQL).

Значение по умолчанию `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Порт базы данных (требуется при использовании MySQL или PostgreSQL).

- Порт по умолчанию для MySQL и MariaDB — 3306
- Порт по умолчанию для PostgreSQL — 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Имя базы данных (требуется при использовании MySQL или PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Пользователь базы данных (требуется при использовании MySQL или PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Пароль базы данных (требуется при использовании MySQL или PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Префикс имён таблиц.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Преобразовывать ли имена таблиц и полей базы данных в стиль snake_case. По умолчанию `false`. Если используется база данных MySQL (MariaDB) с настройкой `lower_case_table_names=1`, значение DB_UNDERSCORED должно быть `true`.

:::warning
Когда `DB_UNDERSCORED=true`, фактические имена таблиц и полей в базе данных не совпадают с теми, которые отображаются в интерфейсе. Например, `orderDetails` в базе хранится как `order_details`.
:::

## DB_LOGGING

Переключатель логирования базы данных. Значение по умолчанию `off`. Доступные варианты:

- `on` — включить
- `off` — выключить

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Способ вывода логов. Несколько значений разделяются `,`. По умолчанию в окружении разработки — `console`, в продакшн-окружении — `console,dailyRotateFile`.
Доступные варианты:

- `console` — `console.log`
- `file` — файл
- `dailyRotateFile` — файл с ежедневной ротацией

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Путь для хранения файловых логов. По умолчанию `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Уровень вывода логов. По умолчанию в окружении разработки — `debug`, в продакшн-окружении — `info`. Доступные варианты:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Уровень логов базы данных — `debug`. Их вывод управляется параметром `DB_LOGGING` и не зависит от `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Максимальное количество сохраняемых лог-файлов.

- Когда `LOGGER_TRANSPORT` равен `file`, значение по умолчанию — `10`.
- Когда `LOGGER_TRANSPORT` равен `dailyRotateFile`, используется формат `[n]d` для указания количества дней. Значение по умолчанию — `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Ротация логов по размеру.

- Когда `LOGGER_TRANSPORT` равен `file`, единица измерения — `byte`. Значение по умолчанию — `20971520 (20 * 1024 * 1024)`.
- Когда `LOGGER_TRANSPORT` равен `dailyRotateFile`, можно использовать `[n]k`, `[n]m`, `[n]g`. По умолчанию не задано.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Формат вывода логов. По умолчанию в окружении разработки — `console`, в продакшн-окружении — `json`. Доступные варианты:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

См.: [Форматы логов](#)

## CACHE_DEFAULT_STORE

Уникальный идентификатор используемого способа кэширования. Задаёт способ кэширования по умолчанию на серверной стороне. Значение по умолчанию `memory`. Встроенные варианты:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Максимальное количество элементов в кэше в памяти. Значение по умолчанию `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Подключение к Redis. Опционально. Пример: `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Включение сбора телеметрических данных. По умолчанию `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Используемые сборщики метрик мониторинга. По умолчанию `console`. Другие значения соответствуют именам, под которыми зарегистрированы плагины-сборщики, например `prometheus`. Несколько значений разделяются `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Используемые обработчики данных трассировки. По умолчанию `console`. Другие значения соответствуют именам, под которыми зарегистрированы плагины-обработчики. Несколько значений разделяются `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
