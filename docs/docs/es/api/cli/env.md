:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Variables de Entorno Globales

## TZ

Se utiliza para configurar la zona horaria de la aplicación. Por defecto, toma la zona horaria del sistema operativo.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Las operaciones relacionadas con el tiempo se procesarán según esta zona horaria. Modificar `TZ` podría afectar los valores de fecha en la base de datos. Para más detalles, consulte '[Introducción a Fecha y Hora](#)'.
:::

## APP_ENV

Entorno de la aplicación. El valor predeterminado es `development`. Las opciones disponibles son:

- `production` - Entorno de producción
- `development` - Entorno de desarrollo

```bash
APP_ENV=production
```

## APP_KEY

La clave secreta de la aplicación, utilizada para generar tokens de usuario, entre otras cosas. Cámbiela por su propia clave de aplicación y asegúrese de que no se divulgue.

:::warning
Si se modifica `APP_KEY`, los tokens antiguos dejarán de ser válidos.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Puerto de la aplicación. El valor predeterminado es `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefijo de la dirección de la API de NocoBase. El valor predeterminado es `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Modo de inicio multinúcleo (clúster). Si configura esta variable, se pasará al comando `pm2 start` como el parámetro `-i <instances>`. Las opciones son las mismas que las del parámetro `-i` de pm2 (consulte [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), e incluyen:

- `max`: utiliza el número máximo de núcleos de CPU
- `-1`: utiliza el número máximo de núcleos de CPU menos 1
- `<number>`: especifica el número de núcleos

El valor predeterminado está vacío, lo que significa que no está habilitado.

:::warning{title="Atención"}
Este modo debe utilizarse junto con los **plugins** relacionados con el modo clúster; de lo contrario, la funcionalidad de la aplicación podría presentar anomalías.
:::

Para más información, consulte: [Modo Clúster](#).

## PLUGIN_PACKAGE_PREFIX

Prefijo del nombre del paquete del **plugin**. Por defecto es: `@nocobase/plugin-,@nocobase/preset-`.

Por ejemplo, para añadir el **plugin** `hello` al proyecto `my-nocobase-app`, el nombre completo del paquete del **plugin** sería `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` se puede configurar de la siguiente manera:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La correspondencia entre los nombres de los **plugins** y los nombres de los paquetes es la siguiente:

- El nombre del paquete para el **plugin** `users` es `@nocobase/plugin-users`
- El nombre del paquete para el **plugin** `nocobase` es `@nocobase/preset-nocobase`
- El nombre del paquete para el **plugin** `hello` es `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipo de base de datos. Las opciones disponibles son:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

El valor predeterminado es `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Puerto de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

- Puerto predeterminado de MySQL y MariaDB: 3306
- Puerto predeterminado de PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nombre de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Usuario de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Contraseña de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefijo de las tablas de la base de datos.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Indica si los nombres de las tablas y campos de la base de datos deben convertirse al estilo `snake_case`. El valor predeterminado es `false`. Si utiliza una base de datos MySQL (MariaDB) y `lower_case_table_names=1`, entonces `DB_UNDERSCORED` debe ser `true`.

:::warning
Cuando `DB_UNDERSCORED=true`, los nombres reales de las tablas y campos en la base de datos no coincidirán con lo que se ve en la interfaz. Por ejemplo, `orderDetails` en la base de datos será `order_details`.
:::

## DB_LOGGING

Interruptor para el registro de la base de datos. El valor predeterminado es `off`. Las opciones disponibles son:

- `on` - Habilitado
- `off` - Deshabilitado

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Método de transporte para la salida de registros (logs). Múltiples valores se separan con comas `,`. El valor predeterminado en el entorno de desarrollo es `console`, y en el entorno de producción es `console,dailyRotateFile`. Opciones:

- `console` - `console.log`
- `file` - Archivo
- `dailyRotateFile` - Archivo rotatorio diario

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Ruta de almacenamiento de los registros (logs) basados en archivos. El valor predeterminado es `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Nivel de salida de los registros (logs). El valor predeterminado en el entorno de desarrollo es `debug`, y en el entorno de producción es `info`. Opciones:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

El nivel de salida de los registros de la base de datos es `debug`, y su emisión está controlada por `DB_LOGGING`, no por `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Número máximo de archivos de registro (logs) a conservar.

- Cuando `LOGGER_TRANSPORT` es `file`, el valor predeterminado es `10`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`, use `[n]d` para representar los días. El valor predeterminado es `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotación de registros (logs) por tamaño.

- Cuando `LOGGER_TRANSPORT` es `file`, la unidad es `byte`, y el valor predeterminado es `20971520 (20 * 1024 * 1024)`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`, puede usar `[n]k`, `[n]m`, `[n]g`. No está configurado por defecto.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formato de impresión de registros (logs). El valor predeterminado en el entorno de desarrollo es `console`, y en el entorno de producción es `json`. Opciones:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Consulte: [Formato de Registros](#)

## CACHE_DEFAULT_STORE

Identificador único para el método de almacenamiento en caché a utilizar, especificando el método de caché predeterminado del servidor. El valor predeterminado es `memory`. Las opciones integradas son:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Número máximo de elementos en la caché en memoria. El valor predeterminado es `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Conexión a Redis, opcional. Ejemplo: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Habilita la recopilación de datos de telemetría. Por defecto es `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Lectores de métricas de monitoreo habilitados. Por defecto es `console`. Otros valores deben referirse a los nombres registrados de los **plugins** de lector correspondientes, como `prometheus`. Múltiples valores se separan con comas `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Procesadores de datos de rastreo (trace) habilitados. Por defecto es `console`. Otros valores deben referirse a los nombres registrados de los **plugins** de procesador correspondientes. Múltiples valores se separan con comas `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```