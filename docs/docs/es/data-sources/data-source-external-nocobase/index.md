---
title: 'NocoBase externo'
description: 'Conecta otra aplicación NocoBase como fuente de datos externa a la aplicación actual y conoce su configuración, capacidades disponibles y limitaciones de uso en los flujos de trabajo.'
keywords: 'NocoBase externo,fuente de datos NocoBase,gestión de fuentes de datos,flujo de trabajo,NocoBase'
---

# NocoBase externo

## Introducción

La fuente de datos de NocoBase externo permite conectar otra aplicación NocoBase a la aplicación actual y conservar los metadatos configurados en la aplicación remota, como las tablas de datos, las interfaces de campos, los títulos y los campos de relación.

En comparación con una fuente de datos de base de datos externa, al conectar NocoBase externo normalmente no es necesario volver a configurar las interfaces de campos ni crear manualmente los campos de relación. Además de consultar, crear, editar y eliminar registros, también admite la carga y vista previa de archivos, la importación y exportación, las consultas de gráficos y algunos escenarios de flujos de trabajo.

## Agregar una fuente de datos

Después de activar el plugin, agrega una fuente de datos de NocoBase externo en «Gestión de fuentes de datos» e introduce la información de acceso de la aplicación remota.

| Elemento de configuración | Descripción                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Dirección de la API      | Dirección completa de la API de la aplicación NocoBase remota, por ejemplo, `https://example.com/api` |
| Origin                   | Origen de acceso de la aplicación NocoBase remota, por ejemplo, `https://example.com`; se utiliza principalmente para gestionar las direcciones de vista previa de archivos locales de la aplicación remota |
| API key                  | Credencial utilizada por la aplicación actual para acceder a NocoBase remoto                  |
| Encabezados de solicitud | Encabezados que deben enviarse adicionalmente a la aplicación remota, como la información del espacio |
| Tiempo de espera         | Tiempo de espera de las solicitudes a la aplicación remota                                |

Después de activar la fuente de datos, el sistema cargará las tablas de datos de la aplicación remota.

![](https://static-docs.nocobase.com/202606101149185.png)

## Permisos

La fuente de datos de NocoBase externo está sujeta tanto a los permisos de la aplicación actual como a los de la aplicación remota.

- La aplicación actual puede configurar los permisos de acceso de distintas tablas y campos como con cualquier otra fuente de datos externa;
- la aplicación remota lee y opera los datos correspondientes según los permisos de la API key configurada.

La fuente de datos de NocoBase externo no devuelve metadatos de permisos para controlar con precisión desde el frontend el estado de visibilidad de los botones, por lo que algunos botones podrían no ocultarse automáticamente según los permisos, como ocurre con la fuente de datos principal. Independientemente de si el botón se muestra o no, al enviar la operación esta seguirá pasando por la validación de permisos del servidor de la aplicación actual, y las operaciones no autorizadas serán rechazadas.

:::warning{title=Nota}
Se recomienda preparar una API key exclusiva para la fuente de datos de NocoBase externo y conceder únicamente los permisos necesarios sobre las tablas y operaciones. Si la aplicación actual tiene permisos, pero la operación falla, comprueba los permisos de la API key remota.
:::

## Usar tablas de datos

Después de cargar correctamente las tablas de datos, selecciona esta fuente de datos en la configuración de páginas, bloques, gráficos o flujos de trabajo para utilizar las tablas de datos de la aplicación remota.

Si cambia la estructura de las tablas de datos de la aplicación remota, es necesario volver a cargar las tablas de datos en la aplicación actual.

## Descripción de las funciones

La fuente de datos de NocoBase externo se utiliza principalmente para usar en la aplicación actual las tablas y los datos de la aplicación remota. La estructura de las tablas, la configuración de los campos y los datos reales siguen siendo administrados por la aplicación remota.

### Tablas y campos

La aplicación actual cargará los metadatos de la aplicación remota, como las tablas de datos, las interfaces de campos, los títulos y los campos de relación. En comparación con una fuente de datos de base de datos externa, normalmente no es necesario volver a configurar las interfaces de campos ni crear manualmente los campos de relación en la aplicación actual.

La aplicación actual no admite la configuración directa de los campos de una fuente de datos de NocoBase externo. Para agregar campos, ajustar sus tipos o modificar campos de relación, hazlo en la aplicación remota y vuelve a cargar las tablas de datos en la aplicación actual.

### Registros y datos relacionados

La fuente de datos de NocoBase externo permite consultar, crear, editar y eliminar registros en los bloques de página, así como consultar y mantener datos relacionados. Las operaciones se inician desde la aplicación actual y solicitan datos a la aplicación remota mediante la API key configurada.

### Archivos y adjuntos

Los archivos se cargarán en el almacenamiento utilizado por la aplicación remota. La aplicación actual se encarga de iniciar las solicitudes de carga, vista previa y descarga; los archivos no se guardan en la aplicación actual.

Origin se utiliza principalmente para gestionar las direcciones de vista previa de los archivos almacenados localmente en la aplicación remota. Si la respuesta remota contiene una ruta relativa, la aplicación actual utilizará Origin para completar la dirección de acceso al archivo. Origin debe ser la dirección pública de acceso de la aplicación NocoBase remota, por ejemplo:

```text
https://example.com
```

No introduzcas la dirección de la API en Origin.

### Importación y exportación

La importación y la exportación son operaciones de lectura y escritura de datos mediante archivos externos, y ambas se ejecutan como solicitudes proxy a la aplicación remota. La aplicación actual se encarga de recibir la operación del usuario, reenviar la solicitud y devolver el resultado de la descarga; la lectura y escritura real de los datos la realiza la aplicación remota.

- Importar registros: la aplicación actual recibe el archivo de importación cargado y lo reenvía a la aplicación remota para ejecutar la importación;
- Exportar registros: la aplicación actual reenvía la solicitud de exportación de registros a la aplicación remota. En el modo síncrono, el flujo de archivos de registros devuelto por la aplicación remota se envía directamente al navegador para su descarga; en el modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de registros en la aplicación remota y se sincroniza el progreso. Al descargar el resultado, el archivo de registros se obtiene de la aplicación remota mediante un flujo.
- Exportar adjuntos: la aplicación actual reenvía la solicitud de exportación de adjuntos a la aplicación remota. En el modo síncrono, el paquete de adjuntos devuelto por la aplicación remota se envía directamente al navegador para su descarga; en el modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de adjuntos en la aplicación remota y se sincroniza el progreso. Al descargar el resultado, el paquete de adjuntos se obtiene de la aplicación remota mediante un flujo.

### Impresión de plantillas

La impresión de plantillas puede utilizar registros de una fuente de datos de NocoBase externo. La plantilla de impresión y la configuración de la acción de impresión se guardan en la aplicación actual. Durante la impresión, la aplicación actual lee los registros remotos y los datos relacionados, y genera el archivo de impresión en la aplicación actual.

### Gráficos

#### Panel de consultas

La fuente de datos de NocoBase externo puede utilizarse en los paneles de consultas de gráficos. La aplicación actual procesa los parámetros de consulta según los gráficos, la fuente de datos, las tablas de datos y los permisos de campos configurados localmente, y después solicita los resultados a la aplicación remota.

La API key remota también debe tener permisos de acceso a los datos correspondientes; de lo contrario, la consulta fallará.

#### Panel SQL

El panel SQL es un modo de consulta SQL de los gráficos y solo se utiliza para realizar consultas. La aplicación actual se encarga de guardar la configuración SQL e iniciar la llamada; la consulta SQL se reenvía a la aplicación remota para su ejecución.

Al utilizar el panel SQL, el usuario local debe tener permisos de configuración de la interfaz de usuario en la aplicación actual, y la API key remota también debe tener permisos de configuración de la interfaz de usuario en la aplicación remota. A diferencia del panel de consultas, SQL no descompone los parámetros de consulta según los permisos de tablas y campos. Concede con precaución permisos de configuración de la interfaz de usuario al usuario local y a la API key correspondiente.

### Flujos de trabajo

La fuente de datos de NocoBase externo puede implicar dos conjuntos de flujos de trabajo: los de la aplicación actual y los de la aplicación remota. La aplicación actual responde a los eventos de las páginas locales, los botones y las solicitudes de API; cuando la aplicación remota recibe una solicitud reenviada, la procesa según su propia configuración de flujos de trabajo.

Ten en cuenta que la aplicación actual no supervisa los eventos de creación, actualización o eliminación que se producen internamente en las tablas de datos remotas. Los eventos de las tablas de datos remotas solo se activan en la aplicación remota.

#### Disparadores

La siguiente tabla describe cuándo se activan, en la aplicación actual y en la remota, los disparadores afectados por la fuente de datos de NocoBase externo cuando el flujo de trabajo correspondiente está habilitado.

| Disparador                         | Aplicación actual | Aplicación remota       | Descripción                                                                                  |
| ---------------------------------- | ----------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Evento previo a la solicitud       | Se activa         | Solo en modo global     | En la aplicación actual se activa en modo global; en modo local, según la vinculación con el botón de la aplicación actual. En la aplicación remota, tras recibir la solicitud reenviada, solo se activa en modo global |
| Evento posterior a la solicitud    | Se activa         | Solo en modo global     | En la aplicación actual se activa en modo global; en modo local, según la vinculación con el botón de la aplicación actual. En la aplicación remota, tras recibir la solicitud reenviada, solo se activa en modo global |
| Evento de operación personalizada  | Se activa         | No se activa            | El botón «Activar flujo de trabajo» vinculado en la aplicación actual activa el flujo local; las solicitudes CRUD reenviadas no activan el evento de operación personalizada remoto |
| Evento de tabla de datos           | No se activa      | Se activa                | Los datos reales cambian en la aplicación remota, por lo que la aplicación actual no activa el evento de tabla de datos local; la aplicación remota activa su propio evento de tabla de datos |
| Activación programada por campo de fecha | No se activa | Se activa                | La aplicación actual no activa el flujo según los campos de las tablas de datos remotas; la aplicación remota lo activa según su propia configuración de campos de fecha |

Los disparadores que no dependen de una fuente de datos se activan en la aplicación actual y en la remota según sus respectivas configuraciones.

Si necesitas orquestar en la aplicación actual un proceso que opere sobre datos de NocoBase externo, se recomienda utilizar eventos previos a la solicitud, eventos posteriores a la solicitud o eventos de operaciones personalizadas. Los flujos de trabajo existentes en la aplicación remota se ejecutan de forma independiente en dicha aplicación.

#### Nodos

La siguiente tabla solo enumera los nodos relacionados con fuentes de datos. Los nodos comunes, como los de condición, cálculo, bucle y procesamiento de JSON, no dependen del tipo de fuente de datos y pueden utilizarse como en cualquier flujo de trabajo normal.

| Nodo              | Disponible | Descripción                              |
| ----------------- | ---------- | ---------------------------------------- |
| Consultar registros | Sí       | Consulta registros en la aplicación remota |
| Crear registros    | Sí         | Crea registros en la aplicación remota    |
| Actualizar registros | Sí       | Actualiza registros en la aplicación remota |
| Eliminar registros | Sí         | Elimina registros en la aplicación remota |
| Nodo SQL           | No         | El nodo SQL de los flujos de trabajo solo admite fuentes de datos de bases de datos |
| Nodo de agregación | No         | El nodo de agregación solo admite fuentes de datos de bases de datos |

## Preguntas frecuentes

### La tabla de datos no aparece

Comprueba que la fuente de datos esté habilitada y que la dirección de la API y la API key sean correctas. La aplicación remota también debe permitir que dicha API key acceda a la tabla de datos correspondiente.

### La carga del archivo se realizó correctamente, pero no se puede obtener una vista previa

Si la aplicación actual o la remota utiliza almacenamiento de archivos local, comprueba que Origin esté configurado con la dirección pública de acceso de la aplicación correspondiente. Origin no debe configurarse con la dirección de la API.

### La aplicación actual tiene permisos, pero la operación falla

Comprueba los permisos de la API key de la aplicación remota. La fuente de datos de NocoBase externo está sujeta simultáneamente a los permisos de la aplicación actual y a los de la aplicación remota.

### La tabla de datos no se puede utilizar después de un error del servicio remoto

Si la aplicación remota devuelve un error 502, se reinicia o deja de estar disponible temporalmente, es posible que la aplicación actual no pueda leer temporalmente los metadatos de las tablas de datos remotas. Cuando el servicio remoto se recupere, la aplicación actual volverá a cargar automáticamente los metadatos la próxima vez que acceda a las tablas de datos de esta fuente.

### ¿Por qué no se pueden configurar los campos en la aplicación actual?

La fuente de datos de NocoBase externo utiliza la estructura de las tablas de datos y la configuración de campos de la aplicación remota. Ajusta los campos en la aplicación remota y vuelve a cargar las tablas de datos en la aplicación actual.