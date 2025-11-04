# Environment Variables

## How to Set Environment Variables?

### Git Source or `create-nocobase-app` Installation

Set environment variables in the `.env` file at the project root. After modifying the variables, kill the application process and restart it.

### Docker Installation

Modify the `docker-compose.yml` configuration and set environment variables under the `environment` section. Example:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

You can also use `env_file` to load variables from a `.env` file. Example:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

After changing environment variables, rebuild the `app` container:

```bash
docker-compose up -d app
```

## Global Environment Variables

### TZ

Sets the application's time zone. The default is the operating system's time zone.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Time-related operations are processed according to this time zone. Changing `TZ` may affect date values in the database. For details, see [Date & Time Overview](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Application environment. The default is `development`. Options:

- `production` — production environment
- `development` — development environment

```bash
APP_ENV=production
```

### APP_KEY

The application's secret key used to generate user tokens and other sensitive data. Change it to your own key and ensure it is not exposed.

:::warning
If `APP_KEY` is changed, existing tokens will become invalid.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Application port. Default: `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefix for NocoBase API endpoints. Default: `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Multi-core (cluster) startup mode. If configured, the value is passed to `pm2 start` as the `-i <instances>` argument. Options match PM2’s `-i` parameter (see [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)):

- `max` — use all CPU cores
- `-1` — use (CPU cores - 1)
- `<number>` — specify the number of instances

The default is empty (disabled).

:::warning{title="Attention"}
This mode must be used together with plugins designed for cluster mode; otherwise, application functionality may be affected.
:::

See also: [Cluster Mode](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Plugin package name prefix. Default: `@nocobase/plugin-,@nocobase/preset-`.

For example, adding a `hello` plugin to the `my-nocobase-app` project yields the full package name `@my-nocobase-app/plugin-hello`.

You can configure `PLUGIN_PACKAGE_PREFIX` as:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Name-to-package mappings then become:

- `users` plugin package name is `@nocobase/plugin-users`
- `nocobase` plugin package name is `@nocobase/preset-nocobase`
- `hello` plugin package name is `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Database type. Options:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Database host (required when using MySQL or PostgreSQL). Default: `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Database port (required when using MySQL or PostgreSQL).

- MySQL/MariaDB default: `3306`
- PostgreSQL default: `5432`

```bash
DB_PORT=3306
```

### DB_DATABASE

Database name (required when using MySQL or PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Database user (required when using MySQL or PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Database password (required when using MySQL or PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Table name prefix.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Whether to convert table and field names to snake_case. Default: `false`. If you use MySQL (MariaDB) with `lower_case_table_names=1`, `DB_UNDERSCORED` **must** be `true`.

:::warning
When `DB_UNDERSCORED=true`, actual table and field names differ from those shown in the UI; for example, `orderDetails` becomes `order_details` in the database.
:::

### DB_LOGGING

Database logging switch. Default: `off`. Options:

- `on` — enabled
- `off` — disabled

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maximum number of connections in the pool. Default: `5`.

### DB_POOL_MIN

Minimum number of connections in the pool. Default: `0`.

### DB_POOL_IDLE

Maximum idle time before a connection is released (ms). Default: `10000` (10 seconds).

### DB_POOL_ACQUIRE

Maximum time to acquire a connection before throwing an error (ms). Default: `60000` (60 seconds).

### DB_POOL_EVICT

Interval for removing idle connections (ms). Default: `1000` (1 second).

### DB_POOL_MAX_USES

Number of times a connection can be used before being discarded and replaced. Default: `0` (unlimited).

### LOGGER_TRANSPORT

Log transports (comma-separated). Default: `console` in development; `console,dailyRotateFile` in production.
Options:

- `console` — `console.log`
- `file` — write to file
- `dailyRotateFile` — rotate daily files

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Base path for file logs. Default: `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Log level. Default: `debug` (development), `info` (production). Options:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Database logs use level `debug`, controlled by `DB_LOGGING` and not affected by `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maximum retained log files.

- If `LOGGER_TRANSPORT=file`: default `10`.
- If `LOGGER_TRANSPORT=dailyRotateFile`: use `[n]d` to indicate days. Default `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotate logs by size.

- If `LOGGER_TRANSPORT=file`: bytes; default `20971520 (20 * 1024 * 1024)`.
- If `LOGGER_TRANSPORT=dailyRotateFile`: use `[n]k`, `[n]m`, `[n]g`; no default.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Log format. Default: `console` (development), `json` (production). Options:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

See: [Log Format](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Identifier for the caching method; sets the server’s default cache. Default: `memory`. Built-in options:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maximum number of cached items in memory. Default: `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis connection URL (optional). Example: `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Enable telemetry data collection. Default: `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Enabled metric readers. Default: `console`. Other values depend on collector plugins (e.g., `prometheus`). Use commas to separate multiple values.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Enabled trace processors. Default: `console`. Other values depend on processor plugins. Use commas to separate multiple values.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimental Environment Variables

### APPEND_PRESET_LOCAL_PLUGINS

Append preset (inactive) plugins by package name (`package.json:name`). Separate multiple plugins with commas.

:::info
1. Ensure the plugins are downloaded locally and available under `node_modules`. See [Plugin Organization](/plugin-development/project-structure) for details.  
2. After setting this variable, plugins appear in the Plugin Manager only after an initial install (`nocobase install`) or an upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Append built-in plugins that are installed by default, by package name (`package.json:name`). Separate multiple plugins with commas.

:::info
1. Ensure the plugins are downloaded locally and available under `node_modules`. See [Plugin Organization](/plugin-development/project-structure) for details.  
2. After setting this variable, plugins are automatically installed/upgraded during initial install (`nocobase install`) or upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Temporary Environment Variables

You can assist installation by setting temporary environment variables, for example:

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalent to
yarn nocobase install \
  --lang=en-US \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalent to
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Installation language. Default: `en-US`. Options:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Root user email.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Root user password.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Root user nickname.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```