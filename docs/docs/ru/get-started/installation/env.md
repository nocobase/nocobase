# Переменные окружения

## Как задать переменные окружения?

### Метод установки из исходного кода Git или `create-nocobase-app`

Задайте переменные окружения в файле `.env` в корневом каталоге проекта. После изменения переменных окружения остановите процесс приложения и перезапустите его.

### Метод установки через Docker

Измените конфигурацию `docker-compose.yml` и задайте переменные окружения в параметре `environment`. Пример:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Также можно использовать `env_file`, чтобы задавать переменные окружения в файле `.env`. Пример:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

После изменения переменных окружения пересоберите контейнер приложения:

```yml
docker-compose up -d app
```

## Глобальные переменные окружения

### TZ

Используется для задания часового пояса приложения; по умолчанию используется часовой пояс системы.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Операции, связанные со временем, будут выполняться в соответствии с этим часовым поясом. Изменение TZ может повлиять на значения дат в базе данных. Для получения подробностей см. [Обзор даты и времени](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Среда приложения; по умолчанию — `development`. Доступные варианты:

- `production` производственная среда
- `development` среда разработки

```bash
APP_ENV=production
```

### APP_KEY

Секретный ключ приложения, используемый для генерации токенов пользователей и т.д. Замените его на ваш собственный ключ приложения и убедитесь, что он не раскрыт.

:::warning
Если `APP_KEY` будет изменен, старые токены станут недействительными.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Порт приложения; по умолчанию — `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Префикс адреса API NocoBase; по умолчанию — `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

Базовый URL, который фронтенд использует для доступа к API NocoBase. По умолчанию пустой, что означает использование same-origin `${APP_PUBLIC_PATH}api/`.

```bash
API_BASE_URL=
```

Указывайте полный адрес API только тогда, когда страницы и сервис API находятся на разных origin (отличается протокол, домен или порт):

```bash
API_BASE_URL=https://api.example.com/api/
```

:::warning{title="Кросс-origin развёртывания"}
NocoBase использует cookies для сохранения состояния входа и авторизации доступа к [stable file URL](../../file-manager/stable-url.md). Когда `API_BASE_URL` указывает на origin, отличный от origin страниц:

- Origin страницы должен быть добавлен в [`CORS_ORIGIN_WHITELIST`](#cors_origin_whitelist). Иначе браузер проигнорирует `Set-Cookie` в ответах API, cookie входа не будет сохранена, а функции, зависящие от cookies, например предпросмотр и скачивание файлов, будут завершаться `403`.
- Cookies хранятся по `hostname`. Если страницы и API используют полностью разные домены, запросы к stable URL в `/files/` с домена страницы не отправят cookie входа, сохранённую для домена API, поэтому доступ к файлу всё равно не сработает.

Поэтому рекомендуется отдавать страницы и API с одного origin через обратный прокси и оставлять `API_BASE_URL` пустым.
:::

### CORS_ORIGIN_WHITELIST

Белый список origin, которым разрешён кросс-origin доступ к API с учётными данными (cookies). Несколько origin указываются через запятую. По умолчанию пусто.

```bash
CORS_ORIGIN_WHITELIST=https://www.example.com,https://admin.example.com
```

- Если список не настроен, доверенными считаются только same-origin запросы; кросс-origin запросы всё ещё могут анонимно вызывать API, но браузеру не разрешается читать или записывать для них cookies.
- Если список настроен, origin из белого списка получают точный `Access-Control-Allow-Origin` и `Access-Control-Allow-Credentials: true`, что позволяет браузеру отправлять и сохранять cookies входа в кросс-origin запросах.
- API входа проверяет `Origin` / `Referer` запроса; кросс-origin запросы на вход с origin вне белого списка отклоняются с `403`.

### CLUSTER_MODE

> `v1.6.0+`

Режим запуска приложения с несколькими ядрами (кластерный режим). Если эта переменная задана, она будет передана в команду `pm2 start` как параметр `-i <instances>`. Варианты соответствуют параметру pm2 `-i` (см. [PM2: Кластерный режим](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), включая:

- `max`: Использовать максимальное количество ядер CPU
- `-1`: Использовать максимальное количество ядер CPU минус один
- `<number>`: Указать количество ядер

Значение по умолчанию пустое, то есть режим не включен.

:::warning{title="Внимание"}
Для этого режима требуются плагины, связанные с кластерным режимом. В противном случае функциональность приложения может столкнуться с неожиданными проблемами.
:::

Для получения дополнительной информации см. [Кластерный режим](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Префикс пакета плагинов; по умолчанию: `@nocobase/plugin-,@nocobase/preset-`.

Например, чтобы добавить плагин `hello` в проект `my-nocobase-app`, полное имя пакета плагина будет `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX можно настроить так:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Соответствие между именем плагина и именем пакета следующее:

- `users` — имя пакета плагина: `@nocobase/plugin-users`
- `nocobase` — имя пакета плагина: `@nocobase/preset-nocobase`
- `hello` — имя пакета плагина: `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Тип базы данных; доступны варианты:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Хост базы данных (обязателен при использовании баз MySQL или PostgreSQL).

По умолчанию — `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Порт базы данных (обязателен при использовании MySQL или PostgreSQL).

- Порт по умолчанию для MySQL и MariaDB — 3306
- Порт по умолчанию для PostgreSQL — 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Имя базы данных (обязательно при использовании MySQL или PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Пользователь базы данных (обязателен при использовании MySQL или PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Пароль базы данных (обязателен при использовании MySQL или PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Префикс таблиц данных.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Определяет, будут ли имена таблиц и полей в базе данных преобразовываться в формат snake_case. По умолчанию — `false`. Если используется база MySQL (MariaDB) с `lower_case_table_names=1`, то `DB_UNDERSCORED` необходимо установить в `true`.

:::warning
Когда `DB_UNDERSCORED=true`, фактические имена таблиц и полей в базе данных не будут совпадать с тем, что отображается в пользовательском интерфейсе. Например, `orderDetails` будет храниться как `order_details` в базе данных.
:::

### DB_LOGGING

Переключатель логгирования базы данных; по умолчанию — `off`. Доступные варианты:

- `on` — включено
- `off` — выключено

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Максимальное число соединений в пуле. По умолчанию — `5`.

### DB_POOL_MIN

Минимальное число соединений в пуле. По умолчанию — `0`.

### DB_POOL_IDLE

Максимальное время в миллисекундах, в течение которого соединение может простаивать перед освобождением. По умолчанию — `10000` (10 секунд).

### DB_POOL_ACQUIRE

Максимальное время в миллисекундах, в течение которого пул будет пытаться получить соединение перед тем, как выбросить ошибку. По умолчанию — `60000` (60 секунд).

### DB_POOL_EVICT

Интервал времени в миллисекундах, по истечении которого пул соединений удаляет простаивающие соединения. По умолчанию — `1000` (1 секунда).

### DB_POOL_MAX_USES

Количество раз, когда соединение может быть использовано, прежде чем оно будет отброшено и заменено. По умолчанию — `0` (без ограничений).

### LOGGER_TRANSPORT

Метод вывода логов; несколько значений разделяются `,`. По умолчанию: `console` в режиме разработки и `console,dailyRotateFile` в производственной среде.
Доступные варианты:

- `console` — `console.log`
- `file` — вывод в файл
- `dailyRotateFile` — вывод в файлы, которые ротируются раз в день

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Путь хранения логов в файловой системе; по умолчанию — `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Уровень логгирования. По умолчанию — `debug` в режиме разработки и `info` в производственной среде. Доступные варианты:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Уровень вывода логов базы данных всегда — `debug`, он контролируется параметром `DB_LOGGING` и не зависит от `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Максимальное количество файлов логов для хранения.

- Когда `LOGGER_TRANSPORT` равно `file`: по умолчанию — `10`.
- Когда `LOGGER_TRANSPORT` равно `dailyRotateFile`: используйте `[n]d` для обозначения дней. По умолчанию — `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Ротация логов по размеру.

- Когда `LOGGER_TRANSPORT` равно `file`: единица измерения — `byte`. По умолчанию — `20971520 (20 * 1024 * 1024)`.
- Когда `LOGGER_TRANSPORT` равно `dailyRotateFile`: используйте `[n]k`, `[n]m`, `[n]g`. По умолчанию не задано.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Формат вывода логов. По умолчанию — `console` в режиме разработки и `json` в производственной среде. Доступные варианты:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Справка: [Формат логов](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Уникальный идентификатор метода кэширования, определяющий кэш по умолчанию на сервере. По умолчанию — `memory`. Встроенные варианты:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Максимальное количество элементов в кэш-памяти. По умолчанию — `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL подключения к Redis (необязательно). Пример: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Включить сбор телеметрических данных. По умолчанию — `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Включенные коллекторы метрик мониторинга. По умолчанию — `console`. Остальные значения должны ссылаться на имена, зарегистрированные соответствующими плагинами коллекторов, например `prometheus`. Несколько значений разделяются `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Включенные процессоры данных трассировки. По умолчанию — `console`. Остальные значения должны указывать на имена, зарегистрированные соответствующими плагинами процессоров. Несколько значений разделяются `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

### SERVER_REQUEST_WHITELIST

Белый список разрешённых адресатов для исходящих HTTP-запросов, инициируемых сервером NocoBase. Принимает список через запятую: точные IP-адреса, диапазоны CIDR, точные имена хостов и одноуровневые поддомены с подстановочным символом.

```bash
SERVER_REQUEST_WHITELIST=api.example.com,*.trusted.com,10.0.0.0/8,127.0.0.1
```

**Применяется к**: узлам «HTTP-запрос» в рабочих процессах, кнопкам действий «Пользовательский запрос», AI-сервисам и другим серверным запросам. Запросы с относительным путём (вызовы собственного API NocoBase) не затрагиваются.

**Не задано**: все исходящие запросы по `http` / `https` остаются разрешёнными для совместимости. Однако если цель является loopback-, private-, link-local- или metadata-адресом либо домен разрешается в один из таких адресов, сервер запишет warning в лог.

**Задано**: исходный запрос и каждый адрес перенаправления должны соответствовать белому списку. При отсутствии совпадения NocoBase вернёт ошибку до отправки следующего запроса. В будущих версиях поведение по умолчанию может постепенно стать строже. Если вашей установке нужен доступ к внутренним сервисам, заранее настройте явный белый список.

Поддерживаемые форматы:

| Формат | Пример | Соответствует |
| --- | --- | --- |
| Точный IPv4 | `1.2.3.4` | Только этот IP |
| IPv4 CIDR | `10.0.0.0/8` | Все IP в подсети |
| Точный IPv6 | `::1` | Только этот IP |
| IPv6 CIDR | `fc00::/7` | Все IP в подсети |
| Точное имя хоста | `api.example.com` | Только это имя хоста |
| Поддомен с подстановочным символом | `*.example.com` | Один уровень поддомена, напр. `foo.example.com`; **не** совпадает с `example.com` или `a.b.example.com` |

:::warning Примечание

Если домен настроен в белом списке, проверка использует host из URL запроса. Иными словами, после настройки `internal.example.com` он считается явно разрешённой целью, даже если домен разрешается в `127.0.0.1` или private-адрес.

:::

## Экспериментальные переменные окружения

### APPEND_PRESET_LOCAL_PLUGINS

Используется для добавления заранее заданных локальных плагинов. Значение — это имя пакета (параметр `name` в `package.json`), при этом несколько плагинов разделяются запятыми.

:::info

1. Убедитесь, что плагин загружен локально и доступен в каталоге `node_modules`. Подробнее см. [Организация плагинов (Plugin Organization)](/plugin-development/project-structure).
2. После добавления переменной окружения плагин появится на странице менеджера плагинов только после начальной установки (`nocobase install`) или обновления (`nocobase upgrade`).

:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Используется для добавления встроенных плагинов, которые устанавливаются по умолчанию. Значение — это имя пакета (параметр `name` в `package.json`), при этом несколько плагинов разделяются запятыми.

:::info
1. Убедитесь, что плагин загружен локально и доступен в каталоге `node_modules`. Подробнее см. [Организация плагинов](/plugin-development/project-structure).
2. После добавления переменной окружения плагин будет автоматически установлен или обновлен во время начальной установки (`nocobase install`) или обновления (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Временные переменные окружения

Процесс установки NocoBase можно дополнить настройкой временных переменных окружения, например:

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Эквивалентно:
yarn nocobase install \
  --lang=en-US \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Эквивалентно:
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Язык на момент установки. По умолчанию — `en-US`. Доступные варианты:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Email пользователя root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Пароль пользователя root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Никнейм пользователя root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```
