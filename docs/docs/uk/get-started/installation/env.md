:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Змінні середовища

## Як налаштувати змінні середовища?

### Спосіб встановлення з вихідного коду Git або за допомогою `create-nocobase-app`

Налаштуйте змінні середовища у файлі `.env` в кореневому каталозі проєкту. Після зміни змінних середовища необхідно завершити процес застосунку та перезапустити його.

### Спосіб встановлення за допомогою Docker

Змініть конфігурацію `docker-compose.yml` та налаштуйте змінні середовища в параметрі `environment`. Приклад:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Ви також можете використовувати `env_file`, щоб налаштувати змінні середовища у файлі `.env`. Приклад:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Після зміни змінних середовища необхідно перестворити контейнер застосунку:

```yml
docker compose up -d app
```

## Глобальні змінні середовища

### TZ

Використовується для встановлення часового поясу застосунку. За замовчуванням використовується часовий пояс операційної системи.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Операції, пов'язані з часом, оброблятимуться відповідно до цього часового поясу. Зміна `TZ` може вплинути на значення дати в базі даних. Для отримання додаткової інформації дивіться «[Огляд дати та часу](/data-sources/data-modeling/collection-fields/datetime)».
:::

### APP_ENV

Середовище застосунку. Значення за замовчуванням — `development`. Доступні варіанти:

- `production` виробниче середовище
- `development` середовище розробки

```bash
APP_ENV=production
```

### APP_KEY

Секретний ключ застосунку, що використовується для генерації токенів користувачів тощо. Змініть його на власний ключ застосунку та переконайтеся, що він не буде розголошений.

:::warning
Якщо `APP_KEY` буде змінено, старі токени стануть недійсними.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Порт застосунку. Значення за замовчуванням — `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Префікс адреси API NocoBase. Значення за замовчуванням — `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Багатоядерний (кластерний) режим запуску застосунку. Якщо цю змінну налаштовано, вона буде передана команді `pm2 start` як параметр `-i <instances>`. Доступні варіанти відповідають параметру `-i` у pm2 (дивіться [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), зокрема:

- `max`: використовувати максимальну кількість ядер процесора
- `-1`: використовувати максимальну кількість ядер процесора мінус один
- `<number>`: вказати кількість ядер

Значення за замовчуванням порожнє, що означає, що режим не ввімкнено.

:::warning{title="Увага"}
Цей режим вимагає використання плагінів, пов'язаних із кластерним режимом. В іншому випадку функціональність застосунку може працювати некоректно.
:::

Додаткову інформацію дивіться: [Кластерний режим](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Префікс назви пакета плагіна. За замовчуванням: `@nocobase/plugin-,@nocobase/preset-`.

Наприклад, щоб додати плагін `hello` до проєкту `my-nocobase-app`, повна назва пакета плагіна буде `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` можна налаштувати так:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Тоді відповідність між назвою плагіна та назвою пакета буде такою:

- Назва пакета плагіна `users`: `@nocobase/plugin-users`
- Назва пакета плагіна `nocobase`: `@nocobase/preset-nocobase`
- Назва пакета плагіна `hello`: `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Тип бази даних. Доступні варіанти:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Хост бази даних (обов'язково для налаштування при використанні баз даних MySQL або PostgreSQL).

Значення за замовчуванням — `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Порт бази даних (обов'язково для налаштування при використанні баз даних MySQL або PostgreSQL).

- Порт за замовчуванням для MySQL та MariaDB: `3306`
- Порт за замовчуванням для PostgreSQL: `5432`

```bash
DB_PORT=3306
```

### DB_DATABASE

Назва бази даних (обов'язково для налаштування при використанні баз даних MySQL або PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Користувач бази даних (обов'язково для налаштування при використанні баз даних MySQL або PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Пароль бази даних (обов'язково для налаштування при використанні баз даних MySQL або PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Префікс таблиць даних.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Чи перетворювати назви таблиць і полів бази даних у стиль `snake_case`. За замовчуванням — `false`. Якщо ви використовуєте базу даних MySQL (MariaDB) з `lower_case_table_names=1`, то `DB_UNDERSCORED` має бути встановлено на `true`.

:::warning
Коли `DB_UNDERSCORED=true`, фактичні назви таблиць і полів у базі даних не збігатимуться з тим, що відображається в інтерфейсі користувача. Наприклад, `orderDetails` буде зберігатися в базі даних як `order_details`.
:::

### DB_LOGGING

Перемикач журналювання бази даних. Значення за замовчуванням — `off`. Доступні варіанти:

- `on` увімкнути
- `off` вимкнути

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Максимальна кількість з'єднань у пулі бази даних. Значення за замовчуванням — `5`.

### DB_POOL_MIN

Мінімальна кількість з'єднань у пулі бази даних. Значення за замовчуванням — `0`.

### DB_POOL_IDLE

Максимальний час простою з'єднання в пулі бази даних, після якого воно буде звільнено. Значення за замовчуванням — `10000` (10 секунд).

### DB_POOL_ACQUIRE

Максимальний час очікування (у мілісекундах) для отримання з'єднання з пулу бази даних, перш ніж буде видано помилку. Значення за замовчуванням — `60000` (60 секунд).

### DB_POOL_EVICT

Інтервал часу (у мілісекундах), після якого пул з'єднань видалятиме неактивні з'єднання. Значення за замовчуванням — `1000` (1 секунда).

### DB_POOL_MAX_USES

Кількість разів, яку можна використовувати з'єднання, перш ніж воно буде відкинуто та замінено. Значення за замовчуванням — `0` (без обмежень).

### LOGGER_TRANSPORT

Метод виведення журналів. Кілька значень розділяються комами `,`. За замовчуванням у середовищі розробки — `console`, у виробничому середовищі — `console,dailyRotateFile`.
Доступні варіанти:

- `console` - `console.log`
- `file` - виведення у файл
- `dailyRotateFile` - виведення у файли, що ротуються щодня

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Шлях для зберігання файлів журналів. За замовчуванням — `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Рівень виведення журналів. За замовчуванням у середовищі розробки — `debug`, у виробничому середовищі — `info`. Доступні варіанти:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Рівень виведення журналів бази даних — `debug`. Він контролюється змінною `DB_LOGGING` і не залежить від `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Максимальна кількість файлів журналів для зберігання.

- Якщо `LOGGER_TRANSPORT` встановлено на `file`: значення за замовчуванням — `10`.
- Якщо `LOGGER_TRANSPORT` встановлено на `dailyRotateFile`: використовуйте `[n]d` для позначення кількості днів. Значення за замовчуванням — `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Ротація журналів за розміром.

- Якщо `LOGGER_TRANSPORT` встановлено на `file`: одиниця виміру — `байт`. Значення за замовчуванням — `20971520 (20 * 1024 * 1024)`.
- Якщо `LOGGER_TRANSPORT` встановлено на `dailyRotateFile`: можна використовувати `[n]k`, `[n]m`, `[n]g`. За замовчуванням не налаштовано.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Формат виведення журналів. За замовчуванням у середовищі розробки — `console`, у виробничому середовищі — `json`. Доступні варіанти:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Довідка: [Формат журналів](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Унікальний ідентифікатор для методу кешування, що визначає кеш за замовчуванням на сервері. Значення за замовчуванням — `memory`. Вбудовані варіанти:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Максимальна кількість елементів у кеші пам'яті. Значення за замовчуванням — `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL-адреса для підключення до Redis, необов'язково. Приклад: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Увімкнути збір телеметричних даних. За замовчуванням — `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Увімкнені збирачі метрик моніторингу. За замовчуванням — `console`. Інші значення повинні відповідати іменам, зареєстрованим відповідними плагінами-збирачами, наприклад, `prometheus`. Кілька значень розділяються комами `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Увімкнені обробники даних трасування. За замовчуванням — `console`. Інші значення повинні відповідати іменам, зареєстрованим відповідними плагінами-обробниками. Кілька значень розділяються комами `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Експериментальні змінні середовища

### APPEND_PRESET_LOCAL_PLUGINS

Використовується для додавання попередньо налаштованих локальних плагінів, які не активовані. Значенням є назва пакета плагіна (параметр `name` у `package.json`), кілька плагінів розділяються комами.

:::info
1. Переконайтеся, що плагін завантажено локально і його можна знайти в каталозі `node_modules`. Докладніше дивіться у розділі [Структура проєкту плагінів](/plugin-development/project-structure).
2. Після додавання змінної середовища плагін з'явиться на сторінці менеджера плагінів лише після початкової інсталяції (`nocobase install`) або оновлення (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Використовується для додавання вбудованих плагінів, які встановлюються за замовчуванням. Значенням є назва пакета плагіна (параметр `name` у `package.json`), кілька плагінів розділяються комами.

:::info
1. Переконайтеся, що плагін завантажено локально і його можна знайти в каталозі `node_modules`. Докладніше дивіться у розділі [Структура проєкту плагінів](/plugin-development/project-structure).
2. Після додавання змінної середовища плагін буде автоматично встановлено або оновлено під час початкової інсталяції (`nocobase install`) або оновлення (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Тимчасові змінні середовища

Під час встановлення NocoBase можна використовувати тимчасові змінні середовища для спрощення процесу, наприклад:

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Еквівалентно
yarn nocobase install \
  --lang=en-US \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Еквівалентно
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Мова під час встановлення. Значення за замовчуванням — `en-US`. Доступні варіанти:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Електронна пошта користувача Root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Пароль користувача Root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Нікнейм користувача Root.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```