# Global Environment Variables

## TZ

Used to set the application's time zone, defaults to the operating system's time zone.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Time-related operations will be processed according to this time zone. Modifying TZ may affect the date values in the database. For details, see '[Date & Time Overview](#)'
:::

## APP_ENV

Application environment, default value is `development`. Options include:

- `production` - Production environment
- `development` - Development environment

```bash
APP_ENV=production
```

## APP_KEY

The application's secret key, used for generating user tokens, etc. Change it to your own application key and ensure it is not disclosed.

:::warning
If APP_KEY is changed, old tokens will become invalid.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Application port, default value is `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API address prefix, default value is `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Multi-core (cluster) startup mode. If this variable is configured, it will be passed through to the `pm2 start` command as the `-i <instances>` parameter. The options are consistent with the pm2 `-i` parameter (see [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), including:

- `max`: use the maximum number of CPU cores
- `-1`: use the maximum number of CPU cores minus 1
- `<number>`: specify the number of cores

The default value is empty, which means it is not enabled.

:::warning{title="Note"}
This mode needs to be used with cluster mode-related plugins, otherwise the application's functionality may be abnormal.
:::

For more information, see: [Cluster Mode](#).

## PLUGIN_PACKAGE_PREFIX

Plugin package name prefix, defaults to: `@nocobase/plugin-,@nocobase/preset-`.

For example, to add the `hello` plugin to the `my-nocobase-app` project, the full package name of the plugin would be `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX can be configured as:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Then the mapping between plugin names and package names is as follows:

- The package name for the `users` plugin is `@nocobase/plugin-users`
- The package name for the `nocobase` plugin is `@nocobase/preset-nocobase`
- The package name for the `hello` plugin is `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Database type, options include:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Database host (required when using MySQL or PostgreSQL database).

Default value is `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Database port (required when using MySQL or PostgreSQL database).

- MySQL, MariaDB default port 3306
- PostgreSQL default port 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Database name (required when using MySQL or PostgreSQL database).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Database user (required when using MySQL or PostgreSQL database).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Database password (required when using MySQL or PostgreSQL database).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Table prefix.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Whether to convert database table names and field names to snake case style, defaults to `false`. If you are using a MySQL (MariaDB) database and `lower_case_table_names=1`, then DB_UNDERSCORED must be `true`.

:::warning
When `DB_UNDERSCORED=true`, the actual table and field names in the database will not be consistent with what is seen in the interface. For example, `orderDetails` in the database will be `order_details`.
:::

## DB_LOGGING

Database logging switch, default value is `off`. Options include:

- `on` - Enabled
- `off` - Disabled

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Log output transport, multiple values are separated by `,`. The default value in development environment is `console`, and in production environment is `console,dailyRotateFile`. Options:

- `console` - `console.log`
- `file` - `File`
- `dailyRotateFile` - `Daily rotating file`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

File-based log storage path, defaults to `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Output log level. The default value in development environment is `debug`, and in production environment is `info`. Options:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

The database log output level is `debug`, and whether it is output is controlled by `DB_LOGGING`, not affected by `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Maximum number of log files to keep.

- When `LOGGER_TRANSPORT` is `file`, the default value is `10`.
- When `LOGGER_TRANSPORT` is `dailyRotateFile`, use `[n]d` to represent days. The default value is `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotate logs by size.

- When `LOGGER_TRANSPORT` is `file`, the unit is `byte`, and the default value is `20971520 (20 * 1024 * 1024)`.
- When `LOGGER_TRANSPORT` is `dailyRotateFile`, you can use `[n]k`, `[n]m`, `[n]g`. Not configured by default.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Log printing format. The default in development environment is `console`, and in production environment is `json`. Options:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

See: [Log Format](#)

## CACHE_DEFAULT_STORE

The unique identifier for the cache store to use, specifying the server-side default cache store. Default value is `memory`. Built-in options:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Maximum number of items in memory cache, default value is `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis connection, optional. Example: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Enable telemetry data collection, defaults to `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Enabled monitoring metric readers, defaults to `console`. Other values should refer to the registered names of the corresponding reader plugins, such as `prometheus`. Multiple values are separated by `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Enabled trace data processors, defaults to `console`. Other values should refer to the registered names of the corresponding processor plugins. Multiple values are separated by `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```