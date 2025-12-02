---
pkg: "@nocobase/plugin-logger"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Registros

## Introducción

Los registros son una herramienta importante para localizar problemas en el sistema. Los registros del servidor de NocoBase incluyen principalmente registros de solicitudes de interfaz y registros de operación del sistema, y permiten configurar el nivel de registro, la estrategia de rotación, el tamaño, el formato de impresión y otros parámetros. Este documento presenta el contenido relacionado con los registros del servidor de NocoBase, así como la forma de utilizar las funciones de empaquetado y descarga de registros del servidor que ofrece el plugin de registros.

## Configuración de registros

Puede configurar los parámetros relacionados con los registros, como el nivel de registro, el método de salida y el formato de impresión, a través de las [variables de entorno](/get-started/installation/env.md#logger_transport).

## Formatos de registro

NocoBase permite configurar cuatro formatos de registro diferentes.

### `console`

Formato predeterminado en el entorno de desarrollo, los mensajes se muestran con colores resaltados.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Formato predeterminado en el entorno de producción.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Separado por el delimitador `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Directorio de registros

La estructura principal del directorio de archivos de registro de NocoBase es:

- `storage/logs` - Directorio de salida de registros
  - `main` - Nombre de la aplicación principal
    - `request_YYYY-MM-DD.log` - Registro de solicitudes
    - `system_YYYY-MM-DD.log` - Registro del sistema
    - `system_error_YYYY-MM-DD.log` - Registro de errores del sistema
    - `sql_YYYY-MM-DD.log` - Registro de ejecución de SQL
    - ...
  - `sub-app` - Nombre de la subaplicación
    - `request_YYYY-MM-DD.log`
    - ...

## Archivos de registro

### Registro de solicitudes

`request_YYYY-MM-DD.log`, registros de solicitudes y respuestas de la interfaz.

| Campo         | Descripción                               |
| ------------- | ----------------------------------------- |
| `level`       | Nivel de registro                         |
| `timestamp`   | Hora de impresión del registro `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` o `response`                    |
| `userId`      | Solo en `response`                        |
| `method`      | Método de solicitud                       |
| `path`        | Ruta de solicitud                         |
| `req` / `res` | Contenido de la solicitud/respuesta       |
| `action`      | Recursos y parámetros de la solicitud     |
| `status`      | Código de estado de la respuesta          |
| `cost`        | Duración de la solicitud                  |
| `app`         | Nombre de la aplicación actual            |
| `reqId`       | ID de la solicitud                        |

:::info{title=Nota}
El `reqId` se enviará al frontend a través del encabezado de respuesta `X-Request-Id`.
:::

### Registro del sistema

`system_YYYY-MM-DD.log`, registros de operación del sistema para la aplicación, middleware, plugins y otros componentes. Los registros de nivel `error` se imprimirán por separado en `system_error_YYYY-MM-DD.log`.

| Campo       | Descripción                               |
| ----------- | ----------------------------------------- |
| `level`     | Nivel de registro                         |
| `timestamp` | Hora de impresión del registro `YYYY-MM-DD hh:mm:ss` |
| `message`   | Mensaje de registro                       |
| `module`    | Módulo                                    |
| `submodule` | Submódulo                                 |
| `method`    | Método invocado                           |
| `meta`      | Otra información relacionada, formato JSON |
| `app`       | Nombre de la aplicación actual            |
| `reqId`     | ID de la solicitud                        |

### Registro de ejecución de SQL

`sql_YYYY-MM-DD.log`, registros de ejecución de SQL de la base de datos. Las sentencias `INSERT INTO` se limitan a los primeros 2000 caracteres.

| Campo       | Descripción                               |
| ----------- | ----------------------------------------- |
| `level`     | Nivel de registro                         |
| `timestamp` | Hora de impresión del registro `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Sentencia SQL                             |
| `app`       | Nombre de la aplicación actual            |
| `reqId`     | ID de la solicitud                        |

## Empaquetado y descarga de registros

1. Vaya a la página de gestión de registros.
2. Seleccione los archivos de registro que desea descargar.
3. Haga clic en el botón Descargar (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Documentos relacionados

- [Desarrollo de plugins - Servidor - Registros](/plugin-development/server/logger)
- [Referencia de la API - @nocobase/logger](/api/logger/logger)