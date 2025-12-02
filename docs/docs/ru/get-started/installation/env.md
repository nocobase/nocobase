:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Переменные среды

## Как настроить переменные среды?

### Установка из исходного кода Git или с помощью `create-nocobase-app`

Установите переменные среды в файле `.env` в корневом каталоге проекта. После изменения переменных среды необходимо завершить процесс приложения и перезапустить его.

### Установка с помощью Docker

Измените конфигурацию `docker-compose.yml` и установите переменные среды в параметре `environment`. Пример:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Вы также можете использовать `env_file` для установки переменных среды в файле `.env`. Пример:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

После изменения переменных среды необходимо пересобрать контейнер приложения:

```yml
docker compose up -d app
```

## Глобальные переменные среды

### TZ

Используется для установки часового пояса приложения. По умолчанию используется часовой пояс операционной системы.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Операции, связанные со временем, будут обрабатываться в соответствии с этим часовым поясом. Изменение TZ может повлиять на значения дат в базе данных. Подробнее см. в разделе «[Обзор даты и времени](/data-sources/data-modeling/collection-fields/datetime)».
:::

### APP_ENV

Среда приложения. Значение по умолчанию `development`. Доступные варианты:

- `production` производственная среда
- `development` среда разработки

```bash
APP_ENV=production
```

### APP_KEY

Секретный ключ приложения, используемый для генерации токенов пользователей и т. д. Измените его на свой собственный ключ приложения и убедитесь, что он не будет раскрыт.

:::warning
Если `APP_KEY` будет изменен, старые токены станут недействительными.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Порт приложения. Значение по умолчанию `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Префикс адреса API NocoBase. Значение по умолчанию `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Многоядерный (кластерный) режим запуска. Если эта переменная настроена, она будет передана команде `pm2 start` в качестве параметра `-i <instances>`. Доступные параметры соответствуют параметру `-i` команды `pm2` (см. [PM2: Cluster Mode](https://pm2.keymetrics.com/docs/usage/cluster-mode/)), включая:

- `max`: Использовать максимальное количество ядер ЦП
- `-1`: Использовать максимальное количество ядер ЦП минус один
- `<number>`: Указать количество ядер

Значение по умолчанию пустое, что означает, что режим не включен.

:::warning{title="Внимание"}
Этот режим требует использования плагинов, связанных с кластерным режимом. В противном случае функциональность приложения может работать некорректно.
:::

Подробнее см.: [Кластерный режим](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Префикс имени пакета плагина. По умолчанию: `@nocobase/plugin-,@nocobase/preset-`.

Например, чтобы добавить плагин `hello` в проект `my-nocobase-app`, полное имя пакета плагина будет `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` можно настроить следующим образом:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Соответствие между именем плагина и именем пакета выглядит следующим образом:

- Имя пакета плагина `users`: `@nocobase/plugin-users`
- Имя пакета плагина `nocobase`: `@nocobase/preset-nocobase`
- Имя пакета плагина `hello`: `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Тип базы данных. Доступные варианты:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Хост базы данных (требуется при использовании баз данных MySQL или PostgreSQL).

Значение по умолчанию `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Порт базы данных (требуется при использовании баз данных MySQL или PostgreSQL).

- Порт по умолчанию для MySQL, MariaDB: 3306
- Порт по умолчанию для PostgreSQL: 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Имя базы данных (требуется при использовании баз данных MySQL или PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Пользователь базы данных (требуется при использовании баз данных MySQL или PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Пароль базы данных (требуется при использовании баз данных MySQL или PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Префикс таблицы данных.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Будут ли имена таблиц и полей базы данных преобразованы в стиль snake_case. Значение по умолчанию `false`. Если вы используете базу данных MySQL (MariaDB) с `lower_case_table_names=1`, то `DB_UNDERSCORED` должен быть установлен в `true`.

:::warning
Когда `DB_UNDERSCORED=true`, фактические имена таблиц и полей в базе данных не будут совпадать с тем, что отображается в пользовательском интерфейсе. Например, `orderDetails` будет храниться в базе данных как `order_details`.
:::

### DB_LOGGING

Переключатель логирования базы данных. Значение по умолчанию `off`. Доступные варианты:

- `on` включено
- `off` выключено

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Максимальное количество соединений в пуле базы данных. Значение по умолчанию `5`.

### DB_POOL_MIN

Минимальное количество соединений в пуле базы данных. Значение по умолчанию `0`.

### DB_POOL_IDLE

Максимальное время простоя соединения в пуле базы данных. Значение по умолчанию `10000` (10 секунд).

### DB_POOL_ACQUIRE

Максимальное время ожидания получения соединения из пула базы данных. Значение по умолчанию `60000` (60 секунд).

### DB_POOL_EVICT

Максимальное время жизни соединения в пуле базы данных. Значение по умолчанию `1000` (1 секунда).

### DB_POOL_MAX_USES

Количество раз, которое соединение может быть использовано до того, как оно будет отброшено и заменено. Значение по умолчанию `0` (без ограничений).

### LOGGER_TRANSPORT

Метод вывода логов. Несколько значений разделяются запятыми. Значение по умолчанию в среде разработки `console`, в производственной среде `console,dailyRotateFile`.
Доступные варианты:

- `console` - `console.log`
- `file` - вывод в файл
- `dailyRotateFile` - вывод в файлы с ежедневной ротацией

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Путь для хранения файловых логов. Значение по умолчанию `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Уровень вывода логов. Значение по умолчанию в среде разработки `debug`, в производственной среде `info`. Доступные варианты:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Уровень вывода логов базы данных — `debug`, он контролируется `DB_LOGGING` и не зависит от `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Максимальное количество сохраняемых файлов логов.

- Если `LOGGER_TRANSPORT` установлен в `file`, значение по умолчанию `10`.
- Если `LOGGER_TRANSPORT` установлен в `dailyRotateFile`, используйте `[n]d` для обозначения количества дней. Значение по умолчанию `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Ротация логов по размеру.

- Если `LOGGER_TRANSPORT` установлен в `file`, единица измерения — `байт`, значение по умолчанию `20971520 (20 * 1024 * 1024)`.
- Если `LOGGER_TRANSPORT` установлен в `dailyRotateFile`, можно использовать `[n]k`, `[n]m`, `[n]g`. По умолчанию не настроено.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Формат вывода логов. Значение по умолчанию в среде разработки `console`, в производственной среде `json`. Доступные варианты:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

См. также: [Формат логов](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Уникальный идентификатор для метода кэширования, указывающий метод кэширования по умолчанию на сервере. Значение по умолчанию `memory`. Встроенные варианты:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Максимальное количество элементов в кэше в памяти. Значение по умолчанию `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Подключение к Redis, необязательно. Пример: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Включить сбор телеметрических данных. Значение по умолчанию `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Включенные сборщики метрик мониторинга. Значение по умолчанию `console`. Другие значения должны соответствовать зарегистрированным именам соответствующих плагинов-сборщиков, например `prometheus`. Несколько значений разделяются запятыми.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Включенные обработчики данных трассировки. Значение по умолчанию `console`. Другие значения должны соответствовать зарегистрированным именам соответствующих плагинов-обработчиков. Несколько значений разделяются запятыми.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Экспериментальные переменные среды

### APPEND_PRESET_LOCAL_PLUGINS

Используется для добавления предустановленных неактивных плагинов. Значением является имя пакета плагина (параметр `name` в `package.json`), несколько плагинов разделяются запятыми.

:::info
1. Убедитесь, что плагин загружен локально и его можно найти в каталоге `node_modules`. Подробнее см. [Структура проекта плагинов](/plugin-development/project-structure).
2. После добавления переменной среды плагин появится на странице менеджера плагинов только после первоначальной установки (`nocobase install`) или обновления (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Используется для добавления встроенных плагинов, устанавливаемых по умолчанию. Значением является имя пакета плагина (параметр `name` в `package.json`), несколько плагинов разделяются запятыми.

:::info
1. Убедитесь, что плагин загружен локально и его можно найти в каталоге `node_modules`. Подробнее см. [Структура проекта плагинов](/plugin-development/project-structure).
2. После добавления переменной среды плагин будет автоматически установлен или обновлен во время первоначальной установки (`nocobase install`) или обновления (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Временные переменные среды

При установке NocoBase вы можете использовать временные переменные среды для облегчения процесса, например:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Эквивалентно
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Эквивалентно
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Язык во время установки. Значение по умолчанию `en-US`. Доступные варианты:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Электронная почта пользователя Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Пароль пользователя Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Псевдоним пользователя Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```