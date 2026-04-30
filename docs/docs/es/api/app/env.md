---
title: "Variables de entorno globales"
description: "Variables de entorno de NocoBase: descripción de los parámetros de configuración TZ, APP_KEY, DB, etc."
keywords: "variables de entorno,APP_KEY,TZ,configuración,NocoBase"
---

# Variables de entorno globales

## TZ

Se utiliza para establecer la zona horaria de la aplicación; por defecto es la zona horaria del sistema operativo.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Las operaciones relacionadas con el tiempo se procesan según esta zona horaria. Modificar TZ puede afectar los valores de fecha en la base de datos. Para más detalles, consulte «[Resumen de fecha y hora](#)».
:::

## APP_ENV

Entorno de la aplicación; valor por defecto `development`. Las opciones disponibles incluyen:

- `production` entorno de producción
- `development` entorno de desarrollo

```bash
APP_ENV=production
```

## APP_KEY

Clave secreta de la aplicación, utilizada para generar tokens de usuario, etc. Modifíquela por su propia clave de aplicación y asegúrese de no divulgarla.

:::warning
Si se modifica APP_KEY, los tokens antiguos también dejarán de ser válidos.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Puerto de la aplicación; valor por defecto `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefijo de la dirección de la API de NocoBase; valor por defecto `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Modo de inicio multinúcleo (cluster). Si se configura esta variable, se transmitirá al comando `pm2 start` como argumento de `-i <instances>`. Las opciones son las mismas que el parámetro `-i` de pm2 (consulte [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), incluyendo:

- `max`: utilizar el número máximo de núcleos de CPU
- `-1`: utilizar el número máximo de núcleos de CPU menos 1
- `<number>`: especificar el número de núcleos

El valor por defecto está vacío, lo que significa que no está activado.

:::warning{title="Atención"}
Este modo requiere el uso de Plugins relacionados con el modo cluster; de lo contrario, las funciones de la aplicación pueden presentar anomalías.
:::

Para más información, consulte: [Modo cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefijo del nombre del paquete de Plugin; por defecto: `@nocobase/plugin-,@nocobase/preset-`.

Por ejemplo, al añadir el Plugin `hello` al proyecto `my-nocobase-app`, el nombre completo del paquete del Plugin será `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX puede configurarse como:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Entonces, la correspondencia entre el nombre del Plugin y el nombre del paquete sería la siguiente:

- El nombre del paquete del Plugin `users` es `@nocobase/plugin-users`
- El nombre del paquete del Plugin `nocobase` es `@nocobase/preset-nocobase`
- El nombre del paquete del Plugin `hello` es `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipo de base de datos. Las opciones disponibles incluyen:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host de la base de datos (debe configurarse al usar bases de datos MySQL o PostgreSQL).

Valor por defecto: `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Puerto de la base de datos (debe configurarse al usar bases de datos MySQL o PostgreSQL).

- Puerto por defecto de MySQL y MariaDB: 3306
- Puerto por defecto de PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nombre de la base de datos (debe configurarse al usar bases de datos MySQL o PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Usuario de la base de datos (debe configurarse al usar bases de datos MySQL o PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Contraseña de la base de datos (debe configurarse al usar bases de datos MySQL o PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefijo de las tablas de la base de datos.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Indica si los nombres de tablas y campos de la base de datos se convierten al estilo snake case; valor por defecto `false`. Si utiliza la base de datos MySQL (MariaDB) y `lower_case_table_names=1`, entonces DB_UNDERSCORED debe ser `true`.

:::warning
Cuando `DB_UNDERSCORED=true`, los nombres reales de tablas y campos en la base de datos no coinciden con los que se ven en la interfaz; por ejemplo, `orderDetails` en la base de datos es `order_details`.
:::

## DB_LOGGING

Interruptor de registro de la base de datos; valor por defecto `off`. Las opciones disponibles incluyen:

- `on` activado
- `off` desactivado

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Modo de salida de logs, separados por `,` cuando hay varios. Valor por defecto en entorno de desarrollo `console`; en entorno de producción `console,dailyRotateFile`.
Opciones disponibles:

- `console` - `console.log`
- `file` - `archivo`
- `dailyRotateFile` - `archivo rotado por día`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Ruta de almacenamiento de logs basada en archivos; por defecto `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Nivel de salida de logs; valor por defecto en entorno de desarrollo `debug`, en entorno de producción `info`. Opciones disponibles:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

El nivel de salida de logs de la base de datos es `debug`, controlado por `DB_LOGGING` para determinar si se emite, sin estar afectado por `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Número máximo de archivos de log que se conservan.

- Cuando `LOGGER_TRANSPORT` es `file`, el valor por defecto es `10`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`, se utiliza `[n]d` para representar los días. El valor por defecto es `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotación de logs por tamaño.

- Cuando `LOGGER_TRANSPORT` es `file`, la unidad es `byte`, valor por defecto `20971520 (20 * 1024 * 1024)`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`, se puede usar `[n]k`, `[n]m`, `[n]g`. Por defecto no está configurado.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formato de impresión de logs; por defecto en entorno de desarrollo `console`, en entorno de producción `json`. Opciones disponibles:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referencia: [Formato de logs](#)

## CACHE_DEFAULT_STORE

Identificador único del modo de caché utilizado, especifica el modo de caché por defecto del lado del servidor. Valor por defecto `memory`. Opciones integradas:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Número máximo de elementos en la caché en memoria; valor por defecto `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Conexión Redis, opcional. Ejemplo: `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Activa la recopilación de datos de telemetría; por defecto `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Recolector de métricas de monitoreo activado; por defecto `console`. Otros valores deben referirse al nombre registrado por el Plugin del recolector correspondiente, por ejemplo `prometheus`. Cuando hay varios, se separan con `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Procesador de datos de trazas activado; por defecto `console`. Otros valores deben referirse al nombre registrado por el Plugin del procesador correspondiente. Cuando hay varios, se separan con `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
