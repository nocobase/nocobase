# Environment Variables

## How to Set Environment Variables?

### Git Source Code or `create-nocobase-app` Installation Method

Set environment variables in the `.env` file in the project's root directory. After modifying the environment variables, kill the application process and restart it.

### Docker Installation Method

Modify the `docker-compose.yml` configuration and set the environment variables in the `environment` parameter. Example:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

You can also use `env_file` to set environment variables in the `.env` file. Example:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

After modifying the environment variables, rebuild the app container:

```yml
docker-compose up -d app
```

## Global Environment Variables

### TZ

Used to set the application's time zone, with the default being the system's time zone.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Time-related operations will be handled according to this time zone. Changing TZ may affect date values in the database. For more details, refer to [Date & Time Overview](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Application environment, default is `development`, options include:

- `production` production environment
- `development` development environment

```bash
APP_ENV=production
```

### APP_KEY

The application's secret key, used for generating user tokens, etc. Change it to your own application key and ensure it is not leaked.

:::warning
If APP_KEY is changed, old tokens will become invalid.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Application port, default is `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API address prefix, default is `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

The multi-core (cluster) mode for starting app. If this variable is configured, it will be passed to the `pm2 start` command as the `-i <instances>` parameter. The options are consistent with the pm2 `-i` parameter (refer to [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), including:

- `max`: Use the maximum number of CPU cores
- `-1`: Use the maximum number of CPU cores minus one
- `<number>`: Specify the number of cores

The default value is empty, meaning it is not enabled.

:::warning{title="Attention"}
This mode requires the use of plugins related to cluster mode. Otherwise, the functionality of the application may encounter unexpected issues.
:::

For more information, see [Cluster Mode](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Plugin package prefix, default is `@nocobase/plugin-,@nocobase/preset-`.

For example, to add the `hello` plugin to the `my-nocobase-app` project, the plugin's full package name would be `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX can be configured as:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

The correspondence between plugin name and package name is as follows:

- `users` plugin package name is `@nocobase/plugin-users`
- `nocobase` plugin package name is `@nocobase/preset-nocobase`
- `hello` plugin package name is `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Database type, options include:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Database host (required when using MySQL or PostgreSQL databases).

Default is `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Database port (required when using MySQL or PostgreSQL databases).

- Default port for MySQL and MariaDB is 3306
- Default port for PostgreSQL is 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Database name (required when using MySQL or PostgreSQL databases).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Database user (required when using MySQL or PostgreSQL databases).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Database password (required when using MySQL or PostgreSQL databases).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Data table prefix.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Whether database table and field names are converted to snake case style. Default is `false`. If using a MySQL (MariaDB) database with `lower_case_table_names=1`, then `DB_UNDERSCORED` must be set to `true`.

:::warning
When `DB_UNDERSCORED=true`, the actual table and field names in the database will not match what is displayed in the UI. For example, `orderDetails` will be stored as `order_details` in the database.
:::

### DB_LOGGING

Database log switch, default is `off`, options include:

- `on` on
- `off` off

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maximum number of connections in the pool. Default is `5`.

### DB_POOL_MIN

Minimum number of connections in the pool. Default is `0`.

### DB_POOL_IDLE

The maximum time, in milliseconds, that a connection can be idle before being released. Default is `10000` (10 seconds).

### DB_POOL_ACQUIRE

The maximum time, in milliseconds, that the pool will try to get a connection before throwing an error. Default is `60000` (60 seconds).

### DB_POOL_EVICT

The time interval, in milliseconds, after which the connection pool will remove idle connections. Default is `1000` (1 second).

### DB_POOL_MAX_USES

The number of times a connection can be used before it is discarded and replaced. Default is `0` (unlimited).

### LOGGER_TRANSPORT

Log output method, multiple values separated by `,`. Default is `console` in development, `console,dailyRotateFile` in production.
Options:

- `console` - `console.log`
- `file` - Output to a file
- `dailyRotateFile` - Output to daily rotating files

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

File-based log storage path, default is `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Output log level. Default is `debug` in development and `info` in production. Options:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

The database log output level is `debug`, controlled by `DB_LOGGING`, and is unaffected by `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maximum number of log files to keep.

- When `LOGGER_TRANSPORT` is `file`: Default is `10`.
- When `LOGGER_TRANSPORT` is `dailyRotateFile`: Use `[n]d` to represent days. Default is `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Log rotation by size.

- When `LOGGER_TRANSPORT` is `file`: Unit is `byte`. Default is `20971520 (20 * 1024 * 1024)`.
- When `LOGGER_TRANSPORT` is `dailyRotateFile`: Use `[n]k`, `[n]m`, `[n]g`. Default is not set.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Log print format. Default is `console` in development and `json` in production. Options:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Reference: [Log Format](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Unique identifier for the caching method, specifying the server's default cache. Default is `memory`. Built-in options include:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maximum number of items in the memory cache. Default is `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis connection URL, optional. Example: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Enable telemetry data collection. Default is `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Enabled monitoring metric collectors. Default is `console`. Other values should refer to the names registered by corresponding collector plugins, such as `prometheus`. Multiple values are separated by `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Enabled trace data processors. Default is `console`. Other values should refer to the names registered by corresponding processor plugins. Multiple values are separated by `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimental Environment Variables

### APPEND_PRESET_LOCAL_PLUGINS

Used to append preset local plugins. The value is the package name (the `name` parameter in `package.json`), with multiple plugins separated by commas.

:::info
1. Ensure the plugin is downloaded locally and can be found in the `node_modules` directory. For more details, see [Plugin Organization](/plugin-development/project-structure).
2. After adding the environment variable, the plugin will appear on the plugin manager page only after an initial installation (`nocobase install`) or upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Used to append built-in plugins that are installed by default. The value is the package name (the `name` parameter in `package.json`), with multiple plugins separated by commas.

:::info
1. Ensure the plugin is downloaded locally and can be found in the `node_modules` directory. For more details, see [Plugin Organization](/plugin-development/project-structure).
2. After adding the environment variable, the plugin will be automatically installed or upgraded during the initial installation (`nocobase install`) or upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Temporary Environment Variables

The installation of NocoBase can be assisted by setting temporary environment variables, such as:

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

Language at the time of installation. Default is `en-US`. Options include:

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

## Other Plugin-Provided Environment Variables

### WORKFLOW_SCRIPT_MODULES

Workflow JavaScript node available modules list. For details, see "[JavaScript Node: Using External Modules](/workflow/nodes/javascript#using-external-modules)".

### WORKFLOW_LOOP_LIMIT

Maximum loop count limit for workflow loop nodes. For details, see "[Loop Node](/workflow/nodes/loop#WORKFLOW_LOOP_LIMIT)".
