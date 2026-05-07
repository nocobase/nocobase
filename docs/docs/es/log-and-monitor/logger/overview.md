:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/log-and-monitor/logger/overview).
:::

# Registros del servidor, registros de auditoría e historial de registros

## Registros del servidor

### Registros de ejecución del sistema

> Consulte [Registros del sistema](./index.md#registros-del-sistema)

- Registran la información de ejecución del sistema de aplicaciones, rastrean la cadena de ejecución de la lógica del código y permiten localizar errores de ejecución u otras anomalías.
- Los registros están clasificados por niveles de severidad y por módulos funcionales.
- Se emiten a través de la terminal o se almacenan en forma de archivos.
- Se utilizan principalmente para investigar y resolver situaciones anómalas que ocurren durante el funcionamiento del sistema.

### Registros de solicitudes

> Consulte [Registros de solicitudes](./index.md#registros-de-solicitudes)

- Registran información detallada de las solicitudes y respuestas de la API HTTP, centrándose en el ID de la solicitud, la ruta de la API, los encabezados, el código de estado de la respuesta y el tiempo de ejecución.
- Se emiten a través de la terminal o se almacenan en forma de archivos.
- Se utilizan principalmente para rastrear las llamadas a la API y su rendimiento de ejecución.

## Registros de auditoría

> Consulte [Registros de auditoría](/security/audit-logger/index.md)

- Registran las acciones de los usuarios (o de la API) sobre los recursos del sistema, centrándose en el tipo de recurso, el objeto del recurso, el tipo de operación, la información del usuario y el estado de la operación.
- Para rastrear mejor el contenido y los resultados específicos de las operaciones del usuario, los parámetros y las respuestas de la solicitud se registran como metadatos. Esta información se solapa parcialmente con los registros de solicitudes, pero no es idéntica; por ejemplo, los registros de solicitudes habituales no suelen incluir el cuerpo completo de la solicitud.
- Los parámetros y las respuestas de la solicitud **no equivalen** a una instantánea (snapshot) del recurso. A través de los parámetros y la lógica del código se puede conocer qué tipo de modificaciones se produjeron, pero no es posible saber con exactitud cuál era el contenido del registro antes de la modificación. Por lo tanto, no pueden utilizarse para el control de versiones ni para la recuperación de datos tras una operación errónea.
- Se almacenan tanto en archivos como en tablas de la base de datos.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historial de registros

> Consulte [Historial de registros](/record-history/index.md)

- Registra el **historial de cambios** del contenido de los datos.
- El contenido principal registrado incluye el tipo de recurso, el objeto del recurso, el tipo de operación, los campos modificados y los valores antes y después del cambio.
- Puede utilizarse para la comparación de datos y auditoría de cambios.
- Se almacena en forma de tablas de datos.

![](https://static-docs.nocobase.com/202511011338499.png)