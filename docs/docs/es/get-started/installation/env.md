:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Variables de Entorno

## ¿Cómo configurar las variables de entorno?

### Método de instalación con código fuente de Git o `create-nocobase-app`

Configure las variables de entorno en el archivo `.env` ubicado en el directorio raíz de su proyecto. Después de modificar estas variables, es necesario detener el proceso de la aplicación y reiniciarla.

### Método de instalación con Docker

Modifique la configuración de `docker-compose.yml` y establezca las variables de entorno en el parámetro `environment`. Por ejemplo:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

También puede usar `env_file` para configurar las variables de entorno directamente en un archivo `.env`. Por ejemplo:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Después de modificar las variables de entorno, deberá reconstruir el contenedor de la aplicación:

```yml
docker compose up -d app
```

## Variables de Entorno Globales

### TZ

Se utiliza para configurar la zona horaria de la aplicación. Por defecto, se usa la zona horaria del sistema operativo.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Las operaciones relacionadas con el tiempo se procesarán según esta zona horaria. Modificar `TZ` podría afectar los valores de fecha en la base de datos. Para más detalles, consulte la sección "[Descripción general de Fecha y Hora](/data-sources/data-modeling/collection-fields/datetime)".
:::

### APP_ENV

Entorno de la aplicación. El valor predeterminado es `development`. Las opciones disponibles son:

- `production`: Entorno de producción
- `development`: Entorno de desarrollo

```bash
APP_ENV=production
```

### APP_KEY

La clave secreta de la aplicación, utilizada para generar tokens de usuario, entre otras cosas. Cámbiela por su propia clave de aplicación y asegúrese de que no se filtre.

:::warning
Si se modifica `APP_KEY`, los tokens antiguos dejarán de ser válidos.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Puerto de la aplicación. El valor predeterminado es `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefijo de la dirección de la API de NocoBase. El valor predeterminado es `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Este es el modo de inicio multi-núcleo (clúster) para la aplicación. Si configura esta variable, se pasará al comando `pm2 start` como el parámetro `-i <instances>`. Las opciones son las mismas que las del parámetro `-i` de pm2 (consulte [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), e incluyen:

- `max`: Utiliza el número máximo de núcleos de CPU.
- `-1`: Utiliza el número máximo de núcleos de CPU menos uno.
- `<number>`: Especifica un número concreto de núcleos.

El valor predeterminado está vacío, lo que significa que no está habilitado.

:::warning{title="Atención"}
Este modo requiere el uso de **plugins** relacionados con el modo clúster. De lo contrario, la funcionalidad de la aplicación podría presentar problemas inesperados.
:::

Para más información, consulte: [Modo Clúster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefijo del nombre del paquete del **plugin**. El valor predeterminado es: `@nocobase/plugin-,@nocobase/preset-`.

Por ejemplo, si desea añadir el **plugin** `hello` al proyecto `my-nocobase-app`, el nombre completo del paquete del **plugin** sería `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` se puede configurar de la siguiente manera:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La correspondencia entre el nombre del **plugin** y el nombre del paquete es la siguiente:

- El nombre del paquete del **plugin** `users` es `@nocobase/plugin-users`.
- El nombre del paquete del **plugin** `nocobase` es `@nocobase/preset-nocobase`.
- El nombre del paquete del **plugin** `hello` es `@my-nocobase-app/plugin-hello`.

### DB_DIALECT

Tipo de base de datos. Las opciones disponibles son:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

El valor predeterminado es `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Puerto de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

- El puerto predeterminado para MySQL y MariaDB es 3306.
- El puerto predeterminado para PostgreSQL es 5432.

```bash
DB_PORT=3306
```

### DB_DATABASE

Nombre de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Usuario de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Contraseña de la base de datos (requerido al usar bases de datos MySQL o PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefijo de las tablas de datos.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Indica si los nombres de las tablas y campos de la base de datos se convertirán al estilo `snake_case`. El valor predeterminado es `false`. Si utiliza una base de datos MySQL (MariaDB) y `lower_case_table_names=1`, entonces `DB_UNDERSCORED` debe establecerse en `true`.

:::warning
Cuando `DB_UNDERSCORED=true`, los nombres reales de las tablas y campos en la base de datos no coincidirán con lo que se muestra en la interfaz de usuario. Por ejemplo, `orderDetails` se almacenará como `order_details` en la base de datos.
:::

### DB_LOGGING

Interruptor para los registros de la base de datos. El valor predeterminado es `off`. Las opciones disponibles son:

- `on`: Activar
- `off`: Desactivar

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Número máximo de conexiones en el pool de la base de datos. El valor predeterminado es `5`.

### DB_POOL_MIN

Número mínimo de conexiones en el pool de la base de datos. El valor predeterminado es `0`.

### DB_POOL_IDLE

Tiempo máximo, en milisegundos, que una conexión puede permanecer inactiva antes de ser liberada del pool. El valor predeterminado es `10000` (10 segundos).

### DB_POOL_ACQUIRE

Tiempo máximo, en milisegundos, que el pool esperará para obtener una conexión antes de lanzar un error. El valor predeterminado es `60000` (60 segundos).

### DB_POOL_EVICT

Intervalo de tiempo, en milisegundos, después del cual el pool de conexiones eliminará las conexiones inactivas. El valor predeterminado es `1000` (1 segundo).

### DB_POOL_MAX_USES

Número de veces que se puede utilizar una conexión antes de que sea descartada y reemplazada. El valor predeterminado es `0` (ilimitado).

### LOGGER_TRANSPORT

Método de salida de los registros (logs). Si hay varios, sepárelos con comas (`,`). El valor predeterminado es `console` en el entorno de desarrollo y `console,dailyRotateFile` en producción.
Opciones:

- `console`: Salida a `console.log`
- `file`: Salida a un archivo
- `dailyRotateFile`: Salida a archivos rotativos diarios

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Ruta de almacenamiento de los registros basados en archivos. El valor predeterminado es `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Nivel de salida de los registros. El valor predeterminado es `debug` en el entorno de desarrollo y `info` en producción. Opciones:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

El nivel de salida de los registros de la base de datos es `debug`, se controla mediante `DB_LOGGING` y no se ve afectado por `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Número máximo de archivos de registro a conservar.

- Cuando `LOGGER_TRANSPORT` es `file`: El valor predeterminado es `10`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`: Utilice `[n]d` para representar el número de días. El valor predeterminado es `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotación de registros por tamaño.

- Cuando `LOGGER_TRANSPORT` es `file`: La unidad es `byte`. El valor predeterminado es `20971520 (20 * 1024 * 1024)`.
- Cuando `LOGGER_TRANSPORT` es `dailyRotateFile`: Puede usar `[n]k`, `[n]m`, `[n]g`. Por defecto, no está configurado.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Formato de impresión de los registros. El valor predeterminado es `console` en el entorno de desarrollo y `json` en producción. Opciones:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referencia: [Formato de Registros](/log-and-monitor/logger/index.md#日志格式)

### CACHE_DEFAULT_STORE

Identificador único para el método de caché, que especifica el método de caché predeterminado del servidor. El valor predeterminado es `memory`. Las opciones integradas incluyen:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Número máximo de elementos en la caché de memoria. El valor predeterminado es `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL de conexión a Redis, opcional. Ejemplo: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Habilita la recopilación de datos de telemetría. El valor predeterminado es `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Recolectores de métricas de monitoreo habilitados. El valor predeterminado es `console`. Otros valores deben hacer referencia a los nombres registrados por los **plugins** recolectores correspondientes, como `prometheus`. Si hay varios, sepárelos con comas (`,`).

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Procesadores de datos de rastreo habilitados. El valor predeterminado es `console`. Otros valores deben hacer referencia a los nombres registrados por los **plugins** procesadores correspondientes. Si hay varios, sepárelos con comas (`,`).

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Variables de Entorno Experimentales

### APPEND_PRESET_LOCAL_PLUGINS

Se utiliza para añadir **plugins** locales preestablecidos no activados. El valor es el nombre del paquete del **plugin** (el parámetro `name` en `package.json`), y si hay varios **plugins**, sepárelos con comas.

:::info

1.  Asegúrese de que el **plugin** esté descargado localmente y pueda encontrarse en el directorio `node_modules`. Para más detalles, consulte [Estructura del proyecto de **plugins**](/plugin-development/project-structure).
2.  Después de añadir la variable de entorno, el **plugin** solo aparecerá en la página del gestor de **plugins** tras una instalación inicial (`nocobase install`) o una actualización (`nocobase upgrade`).
    :::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Se utiliza para añadir **plugins** integrados que se instalan por defecto. El valor es el nombre del paquete del **plugin** (el parámetro `name` en `package.json`), y si hay varios **plugins**, sepárelos con comas.

:::info

1.  Asegúrese de que el **plugin** esté descargado localmente y pueda encontrarse en el directorio `node_modules`. Para más detalles, consulte [Estructura del proyecto de **plugins**](/plugin-development/project-structure).
2.  Después de añadir la variable de entorno, el **plugin** se instalará o actualizará automáticamente durante la instalación inicial (`nocobase install`) o la actualización (`nocobase upgrade`).
    :::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Variables de Entorno Temporales

Al instalar NocoBase, puede facilitar el proceso configurando variables de entorno temporales, por ejemplo:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalente a
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalente a
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Idioma durante la instalación. El valor predeterminado es `en-US`. Las opciones disponibles son:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Correo electrónico del usuario Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Contraseña del usuario Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Apodo del usuario Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```