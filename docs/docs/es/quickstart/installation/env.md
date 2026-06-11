# Configuración de la aplicación y `.env`

Esta página solo se aplica a las aplicaciones creadas o alojadas a través de la CLI de NocoBase.

Si acaba de terminar de leer [Instalación mediante CLI (recomendado)] (./cli.md) y ha visto la sección "Directorio de instalación", los problemas más comunes que encontrará suelen ser los siguientes:

- ¿Dónde se coloca el archivo `.env`?
- ¿Qué configuraciones aún son adecuadas para escribirse en `.env`?
- ¿Qué configuraciones son ahora más adecuadas para entregarlas a `nb env update`?

Hablemos primero de la conclusión:

- Para aplicaciones instaladas CLI, `.env` se coloca en `<app-path>/.env` de forma predeterminada
- Este archivo es opcional, no todos los entornos deben crearse manualmente
- Las configuraciones básicas como `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH` y `DB_*` son administradas por `nb env update` de forma predeterminada.
- `.env` se utiliza principalmente para complementar las variables de tiempo de ejecución que la CLI no ha asumido directamente, como almacenamiento, caché, registros, observaciones y algunas variables de extensión de complementos.

## Encuentra `app-path` primero

En [Instalar usando CLI (recomendado)] (./cli.md#Directorio de instalación), la estructura de directorio predeterminada de CLI env es la siguiente:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Si no está seguro de dónde está el `app-path` aplicado actualmente, puede verificar directamente:

```bash
nb env info app1 --field app.appPath
```

Simplemente reemplace `app1` con su nombre de entorno.

Es decir, para una aplicación creada o alojada mediante la CLI, la ubicación más adecuada para el archivo `.env` es:

```text
<app-path>/.env
```

En términos generales, no es necesario colocarlo en `source/.env` y no es necesario buscar `.env` en el directorio raíz del proyecto Docker Compose de acuerdo con el método de instalación anterior.

## ¿Cuándo necesitas crear `.env` tú mismo?

`.env` es opcional.

Si solo desea ejecutar la aplicación primero o simplemente modificar configuraciones básicas como puertos, zonas horarias, conexiones de bases de datos y rutas de acceso público, en muchos casos no es necesario crear `.env` manualmente.

Solo agréguelos a `<app-path>/.env` si necesita agregar algunas variables de tiempo de ejecución que la CLI no ha asumido directamente.

## El valor predeterminado es usar `nb env update` primero

En el nuevo método de instalación CLI, se recomienda que la configuración básica de la aplicación tenga prioridad [`nb env update`](../../api/cli/env/update.md) de forma predeterminada.

Esto tiene dos beneficios:

- La configuración y el entorno en sí se guardan en la misma mente CLI, lo que facilita su verificación y modificación.
- En el futuro, usted, los scripts y los agentes de IA podrán continuar usando el mismo conjunto de comandos para el mantenimiento, por lo que no es fácil tener la situación en la que "se realiza un conjunto de cambios en el archivo, pero se registra otro conjunto en la CLI".

### Estas configuraciones ahora son más adecuadas para entregarlas a `nb env update`

Para los siguientes elementos, es posible que haya estado acostumbrado a escribirlos directamente en `.env` en el pasado. Sin embargo, en el modo de instalación CLI, se recomienda utilizar `nb env update` de forma predeterminada:

| Quiero cambiar... | Cómo cambiar el valor predeterminado |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Tipo de base de datos y parámetros de conexión, como `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| Esquema PostgreSQL, prefijo de tabla, guión bajo que nombra elementos complementarios de la base de datos, como `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Por ejemplo, si deseas cambiar el puerto de la aplicación y la zona horaria, puedes escribir directamente así:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Si desea cambiar los parámetros de conexión de la base de datos, puede escribir así:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Después de realizar los cambios, la CLI normalmente le pedirá que ejecute `nb app restart` más tarde. Para obtener una descripción más completa de los parámetros, consulte [`nb env update`](../../api/cli/env/update.md).

## ¿Qué situaciones son más adecuadas para escribir en `.env`?

Si una variable aún no tiene un parámetro CLI correspondiente, o se parece más a una configuración extendida "pasada directamente al tiempo de ejecución de la aplicación", simplemente continúe escribiendo `<app-path>/.env`.

Generalmente incluyen estas categorías:

- Configuraciones de almacenamiento de archivos y almacenamiento de objetos, como `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Configuración de caché y Redis, como `CACHE_*`, `REDIS_URL`
- Configuraciones de registro y observación, como `LOGGER_*`, `TELEMETRY_*`
- Ciertas variables específicas de complementos o extensiones, como exportación, tareas asincrónicas, flujo de trabajo y variables relacionadas con la extensión AI.

Por ejemplo:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Este tipo de variable es esencialmente una configuración de tiempo de ejecución de la aplicación y actualmente la CLI no se hace cargo de ella elemento por elemento. Lo más natural es colocarlo en `.env`.

## Cómo dividir el trabajo entre `.env` y `nb env update`

Si no estás seguro de dónde debe ir una determinada configuración, simplemente sigue esta regla de forma predeterminada:

- Si `nb env update` ya tiene un parámetro correspondiente, se usará primero de forma predeterminada.
- Si no hay ningún parámetro correspondiente, o si obviamente pertenece a la configuración de la extensión de tiempo de ejecución, como complementos, almacenamiento, caché y registros, colóquelo en `<app-path>/.env`

En la mayoría de los escenarios, esta división del trabajo es suficiente.

### Un malentendido común

No mantenga dos copias de la misma configuración al mismo tiempo.

Por ejemplo, si ha guardado elementos básicos como `APP_PORT`, `TZ`, `APP_PUBLIC_PATH` y `DB_HOST` con `nb env update`, normalmente no necesita escribirlos nuevamente en `.env`. De lo contrario, cuando solucionemos problemas más adelante, será fácil no saber qué capa es el valor que realmente desea que surta efecto.

## Un ejemplo mínimo de `.env`

Si su configuración básica se guardó a través de la CLI, entonces `.env` probablemente solo necesite conservar algunas variables de extensión, como:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

Esta es también la mentalidad que esta página más quiere ayudarte a construir:

`.env` sigue siendo útil, pero en el nuevo método de instalación CLI, se trata más de complementar la configuración de la extensión del tiempo de ejecución en lugar de continuar asumiendo todos los parámetros básicos de instalación.

## Dónde buscar a continuación

- Si no ha confirmado la estructura del directorio de la aplicación, primero regrese a [Instalar usando CLI (recomendado)] (./cli.md#Directorio de instalación)
- Si desea modificar configuraciones básicas como puertos, zonas horarias, conexiones de bases de datos y rutas de acceso público, continúe viendo [`nb env update`](../../api/cli/env/update.md)
- Si desea iniciar, reiniciar o ver los registros de la aplicación, continúe para ver [Administrar aplicación] (../operaciones/manage-app.md)
