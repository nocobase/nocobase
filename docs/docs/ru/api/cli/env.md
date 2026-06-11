#  Глобальные переменные окружения

## TZ

Используется для установки часового пояса приложения; по умолчанию используется часовой пояс операционной системы.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Операции, связанные со временем, будут выполняться согласно этому часовому поясу. Изменение TZ может повлиять на значения дат в базе данных. Подробности см. в разделе '[Обзор даты и времени](#)'.
:::

## APP_ENV

Окружение приложения, значение по умолчанию — `development`. Возможные варианты:

- `production` — среда эксплуатации
- `development` — среда разработки

```bash
APP_ENV=production
```

## APP_KEY

Секретный ключ приложения, используется для генерации пользовательских токенов и т. д. Замените его на свой ключ приложения и убедитесь, что он не раскрывается.

:::warning
Если APP_KEY будет изменен, старые токены станут недействительными.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Порт приложения, значение по умолчанию — `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Префикс адреса API NocoBase, значение по умолчанию — `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Режим запуска в многопроцессорном кластере (cluster). Если задана эта переменная, она будет передана в команду `pm2 start` как параметр `-i <instances>`. Варианты совпадают с параметром `-i` в pm2 (см. [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), включая:

- `max`: использовать максимальное количество ядер CPU
- `-1`: использовать максимальное количество ядер CPU минус 1
- `<number>`: указать количество ядер

Значение по умолчанию — пустое (режим отключен).

:::warning{title="Примечание (Note)"}
Этот режим должен использоваться вместе с плагинами, связанными с cluster mode, иначе работа приложения может быть некорректной.
:::

Подробности см. в: [Cluster Mode](#).

## PLUGIN_PACKAGE_PREFIX

Префикс имени пакета плагина, по умолчанию: `@nocobase/plugin-,@nocobase/preset-`.

Например, чтобы добавить плагин `hello` в проект `my-nocobase-app`, полное имя пакета плагина будет `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX можно настроить так:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Тогда соответствие между именами плагинов и именами пакетов будет следующим:

- Имя пакета для плагина `users`: `@nocobase/plugin-users`
- Имя пакета для плагина `nocobase`: `@nocobase/preset-nocobase`
- Имя пакета для плагина `hello`: `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Тип базы данных. Возможные варианты:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Хост базы данных (обязательно при использовании MySQL или PostgreSQL).

Значение по умолчанию — `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Порт базы данных (обязательно при использовании MySQL или PostgreSQL).

- Порт по умолчанию для MySQL, MariaDB: 3306
- Порт по умолчанию для PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Имя базы данных (обязательно при использовании MySQL или PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Пользователь базы данных (обязательно при использовании MySQL или PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Пароль базы данных (обязательно при использовании MySQL или PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Префикс таблиц.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Нужно ли преобразовывать имена таблиц и полей базы данных в snake_case; по умолчанию `false`. Если вы используете MySQL (MariaDB) и `lower_case_table_names=1`, тогда DB_UNDERSCORED должен быть `true`.

:::warning
Когда `DB_UNDERSCORED=true`, фактические имена таблиц и полей в базе данных не будут совпадать с тем, что отображается в интерфейсе. Например, `orderDetails` в базе данных будет `order_details`.
:::

## DB_LOGGING

Переключатель логирования базы данных, по умолчанию `off`. Возможные варианты:

- `on` - Enabled
- `off` - Disabled

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Транспорт вывода логов, несколько значений разделяются `,`. По умолчанию в окружении разработки используется `console`, а в production — `console,dailyRotateFile`. Варианты:

- `console` - `console.log`
- `file` - `File`
- `dailyRotateFile` - `Daily rotating file`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Путь хранения логов в файлах, по умолчанию `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Уровень выводимых логов. По умолчанию в окружении разработки — `debug`, в production — `info`. Варианты:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Уровень вывода логов базы данных — `debug`; то, выводятся они или нет, управляется `DB_LOGGING` и не зависит от `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Максимальное количество сохраняемых лог-файлов.

- Когда `LOGGER_TRANSPORT` = `file`, значение по умолчанию — `10`.
- Когда `LOGGER_TRANSPORT` = `dailyRotateFile`, используется формат `[n]d` (дни). Значение по умолчанию — `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Ротация логов по размеру.

- Когда `LOGGER_TRANSPORT` = `file`, единица измерения — `byte`, значение по умолчанию — `20971520 (20 * 1024 * 1024)`.
- Когда `LOGGER_TRANSPORT` = `dailyRotateFile`, можно использовать `[n]k`, `[n]m`, `[n]g`. По умолчанию не настроено.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Формат печати логов. По умолчанию в окружении разработки — `console`, в production — `json`. Варианты:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

См.: [Log Format](#)

## CACHE_DEFAULT_STORE

Уникальный идентификатор используемого cache store, задает серверный cache store по умолчанию. Значение по умолчанию — `memory`. Встроенные варианты:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Максимальное количество элементов в memory cache, значение по умолчанию — `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Подключение Redis, необязательно. Пример: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Включение сбора телеметрии, по умолчанию `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Включенные ридеры метрик мониторинга, по умолчанию `console`. Для других значений указывайте зарегистрированные имена соответствующих reader-плагинов, например `prometheus`. Несколько значений разделяются `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Включенные процессоры trace-данных, по умолчанию `console`. Для других значений указывайте зарегистрированные имена соответствующих processor-плагинов. Несколько значений разделяются `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
