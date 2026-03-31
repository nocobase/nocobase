:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Registros del Servidor, Registros de Auditoría e Historial de Registros

## Registros del Servidor

### Registros del Sistema

> Consulte [Registros del Sistema](#)

- Registran la información de ejecución del sistema de la aplicación, rastrean las cadenas de ejecución del código y permiten identificar excepciones o errores en tiempo de ejecución.
- Se clasifican por niveles de gravedad y módulos funcionales.
- Se muestran por terminal o se almacenan como archivos.
- Se utilizan principalmente para diagnosticar y solucionar problemas del sistema durante su funcionamiento.

### Registros de Solicitudes

> Consulte [Registros de Solicitudes](#)

- Registran los detalles de las solicitudes y respuestas de la API HTTP, centrándose en el ID de la solicitud, la ruta de la API, los encabezados, el código de estado de la respuesta y la duración.
- Se muestran por terminal o se almacenan como archivos.
- Se utilizan principalmente para rastrear las invocaciones de la API y el rendimiento de su ejecución.

## Registros de Auditoría

> Consulte [Registros de Auditoría](/security/audit-logger/index.md)

- Registran las acciones de los usuarios (o de la API) sobre los recursos del sistema, centrándose en el tipo de recurso, el objeto de destino, el tipo de operación, la información del usuario y el estado de la operación.
- Para rastrear mejor lo que hicieron los usuarios y los resultados producidos, los parámetros de la solicitud y las respuestas se almacenan como metadatos. Esto se superpone parcialmente con los registros de solicitudes, pero no es idéntico; por ejemplo, los registros de solicitudes normalmente no incluyen cuerpos de solicitud completos.
- Los parámetros de la solicitud y las respuestas **no equivalen** a instantáneas de los datos. Pueden revelar qué tipo de operaciones ocurrieron, pero no los datos exactos antes de la modificación, por lo que no pueden utilizarse para el control de versiones o la restauración de datos después de operaciones erróneas.
- Se almacenan como archivos y tablas de base de datos.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historial de Registros

> Consulte [Historial de Registros](/record-history/index.md)

- Registra el **historial de cambios** del contenido de los datos.
- Rastrea el tipo de recurso, el objeto del recurso, el tipo de operación, los campos modificados y los valores anteriores/posteriores.
- Útil para la **comparación y auditoría de datos**.
- Se almacena en tablas de base de datos.

![](https://static-docs.nocobase.com/202511011338499.png)