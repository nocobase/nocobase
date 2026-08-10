---
title: 'NocoBase externo'
description: 'Conecta otra aplicación NocoBase como fuente de datos externa a la aplicación actual y conoce su configuración, funciones disponibles y limitaciones de uso en los flujos de trabajo.'
keywords: 'NocoBase externo,fuente de datos NocoBase,gestión de fuentes de datos,flujo de trabajo,NocoBase'
---

# NocoBase externo

## Introducción

Una fuente de datos NocoBase externa permite conectar otra aplicación NocoBase a la aplicación actual y conservar los metadatos configurados en la aplicación remota, como las tablas de datos, las interfaces de campos, los títulos y los campos de relación.

En comparación con una fuente de datos de base de datos externa, al conectar una aplicación NocoBase externa normalmente no es necesario volver a configurar las interfaces de los campos ni crear manualmente los campos de relación. Además de consultar, crear, editar y eliminar registros, también se admiten la carga y vista previa de archivos, la importación y exportación, las consultas de gráficos y algunos escenarios de flujos de trabajo.

## Añadir una fuente de datos

Después de activar el plugin, añade una fuente de datos NocoBase externa en «Gestión de fuentes de datos» y completa la información de acceso de la aplicación remota.

| Elemento de configuración | Descripción                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dirección de la API       | Dirección completa de la API de la aplicación NocoBase remota, por ejemplo, `https://example.com/api` |
| Origin                    | Origen de acceso de la aplicación NocoBase remota, por ejemplo, `https://example.com`, utilizado principalmente para gestionar las direcciones de vista previa de archivos locales de la aplicación remota |
| API key                   | Credencial utilizada por la aplicación actual para acceder a la aplicación NocoBase remota            |
| Encabezados de solicitud  | Encabezados de solicitud adicionales que deben enviarse a la aplicación remota, como la información del espacio |
| Tiempo de espera          | Tiempo de espera de las solicitudes de acceso a la aplicación remota                                  |

Después de activar la fuente de datos, el sistema cargará las tablas de datos de la aplicación remota.

![](https://static-docs.nocobase.com/202606101149185.png)

## Descripción de los permisos

Las fuentes de datos NocoBase externas están sujetas tanto a los permisos de la aplicación actual como a los de la aplicación remota.

- La aplicación actual puede configurar los permisos de acceso a distintas tablas y campos, como con cualquier otra fuente de datos externa;
- la aplicación remota leerá y operará sobre los datos correspondientes según los permisos de la API key configurada.

Las fuentes de datos NocoBase externas no devuelven los metadatos de permisos utilizados para controlar detalladamente desde el frontend el estado de visibilidad de los botones. Por ello, algunos botones podrían no ocultarse automáticamente según los permisos, como ocurre con la fuente de datos principal. Independientemente de que el botón sea visible o no, la operación se someterá a la verificación de permisos del servidor de la aplicación actual al enviarse, y las operaciones no autorizadas serán rechazadas.

:::warning{title=Nota}
Se recomienda preparar una API key independiente para la fuente de datos NocoBase externa y concederle únicamente los permisos necesarios sobre las tablas y operaciones. Si el usuario tiene permisos en la aplicación actual pero la operación falla, comprueba los permisos de la API key remota.
:::

## Uso de las tablas de datos

Después de cargar correctamente las tablas de datos, selecciona esta fuente de datos en la configuración de páginas, bloques, gráficos o flujos de trabajo para utilizar las tablas de datos de la aplicación remota.

Cuando cambie la estructura de las tablas de datos de la aplicación remota, será necesario volver a cargar las tablas en la aplicación actual.

## Descripción de las funciones

Las fuentes de datos NocoBase externas se utilizan principalmente para trabajar con las tablas de datos y los datos de la aplicación remota desde la aplicación actual. La estructura de las tablas, la configuración de los campos y los datos reales siguen siendo gestionados por la aplicación remota.

### Tablas de datos y campos

La aplicación actual cargará los metadatos de la aplicación remota, como las tablas de datos, las interfaces de los campos, los títulos y los campos de relación. En comparación con una fuente de datos de base de datos externa, normalmente no es necesario volver a configurar las interfaces de los campos ni crear manualmente los campos de relación en la aplicación actual.

La aplicación actual no admite la configuración directa de los campos de una fuente de datos NocoBase externa. Para añadir campos, ajustar sus tipos o modificar campos de relación, hazlo en la aplicación remota y vuelve a cargar las tablas de datos en la aplicación actual.

### Registros y datos relacionados

Las fuentes de datos NocoBase externas permiten consultar, crear, editar y eliminar registros en los bloques de las páginas, así como consultar y gestionar datos relacionados. Las operaciones se inician desde la aplicación actual y solicitan los datos a la aplicación remota mediante la API key configurada.

### Archivos y adjuntos

Los archivos se cargarán en el almacenamiento utilizado por la aplicación remota. La aplicación actual se encarga de iniciar las solicitudes de carga, vista previa y descarga; los archivos no se guardan en la aplicación actual.

Origin se utiliza principalmente para gestionar las direcciones de vista previa de los archivos almacenados localmente en la aplicación remota. Si la aplicación remota devuelve una ruta relativa, la aplicación actual utilizará Origin para completar la dirección de acceso al archivo. Origin debe establecerse como la dirección pública de acceso de la aplicación NocoBase remota, por ejemplo:

```text
https://example.com
```

No establezcas la dirección de la API como Origin.

### Importación y exportación

La importación y la exportación son operaciones de lectura y escritura de la fuente de datos mediante archivos externos, y ambas se ejecutan mediante un proxy en la aplicación remota. La aplicación actual se encarga de recibir la operación del usuario, reenviar la solicitud y devolver el resultado de la descarga; la lectura y escritura real de los datos se realiza en la aplicación remota.

- Importar registros: la aplicación actual recibe el archivo de importación cargado y lo reenvía a la aplicación remota para ejecutar la importación;
- Exportar registros: la aplicación actual reenvía la solicitud de exportación de registros a la aplicación remota. En el modo síncrono, el flujo de archivos de registros devuelto por la aplicación remota se envía directamente al navegador para su descarga; en el modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de registros en la aplicación remota y se sincroniza el progreso. Al descargar el resultado, el flujo de archivos de registros se obtiene de la aplicación remota.
- Exportar adjuntos: la aplicación actual reenvía la solicitud de exportación de adjuntos a la aplicación remota. En el modo síncrono, el paquete de adjuntos devuelto por la aplicación remota se envía directamente al navegador para su descarga; en el modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de adjuntos en la aplicación remota y se sincroniza el progreso. Al descargar el resultado, el paquete de adjuntos se obtiene mediante un flujo desde la aplicación remota.

### Impresión de plantillas

La impresión de plantillas puede utilizar registros de una fuente de datos NocoBase externa. Las plantillas de impresión y la configuración de las acciones de impresión se guardan en la aplicación actual. Durante la impresión, la aplicación actual lee los registros y los datos relacionados de la aplicación remota y genera el archivo de impresión en la aplicación actual.

### Gráficos

#### Panel de consultas

Las fuentes de datos NocoBase externas pueden utilizarse en los paneles de consultas de gráficos. La aplicación actual procesa los parámetros de consulta según los gráficos, las fuentes de datos, las tablas de datos y los permisos de campos configurados localmente, y después solicita los resultados a la aplicación remota.

La API key remota también debe tener permisos de acceso a los datos correspondientes; de lo contrario, la consulta fallará.

#### Panel SQL

El panel SQL es un modo de consulta SQL de los gráficos y solo se utiliza para realizar consultas. La aplicación actual se encarga de guardar la configuración SQL e iniciar la llamada; la consulta SQL se reenvía a la aplicación remota para su ejecución.

Al utilizar el panel SQL, el usuario local debe tener permisos de configuración de la interfaz de usuario en la aplicación actual, y la API key remota también debe tener permisos de configuración de la interfaz de usuario en la aplicación remota. A diferencia del panel de consultas, SQL no descompone los parámetros de consulta según los permisos de tablas y campos. Concede con precaución los permisos de configuración de la interfaz de usuario a los usuarios locales y a la API key correspondiente.

### Flujos de trabajo

Una fuente de datos NocoBase externa puede implicar dos conjuntos de flujos de trabajo: los de la aplicación actual y los de la aplicación remota. La aplicación actual responde a los eventos de las páginas, los botones y las solicitudes de API locales; después de recibir una solicitud reenviada, la aplicación remota la procesa según su propia configuración de flujos de trabajo.

Ten en cuenta que la aplicación actual no supervisa los eventos de creación, actualización o eliminación que se producen dentro de las tablas de datos remotas. Los eventos de las tablas de datos remotas solo se activan en la aplicación remota.

#### Disparadores

La siguiente tabla describe cuándo se activan en la aplicación actual y en la aplicación remota los disparadores afectados por una fuente de datos NocoBase externa, cuando el flujo de trabajo correspondiente está habilitado.

| Disparador                     | Aplicación actual | Aplicación remota       | Descripción                                                                                         |
| ------------------------------ | ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| Evento previo a la solicitud   | Se activa         | Solo en modo global     | En la aplicación actual se activa en modo global y, en modo local, según la vinculación con el botón de la aplicación actual; después de recibir una solicitud reenviada, la aplicación remota solo lo activa en modo global |
| Evento posterior a la solicitud | Se activa         | Solo en modo global     | En la aplicación actual se activa en modo global y, en modo local, según la vinculación con el botón de la aplicación actual; después de recibir una solicitud reenviada, la aplicación remota solo lo activa en modo global |
| Evento de operación personalizada | Se activa      | No se activa            | El botón «Activar flujo de trabajo» vinculado en la aplicación actual activa el flujo local; las solicitudes CRUD reenviadas no activan el evento de operación personalizada remoto |
| Evento de tabla de datos        | No se activa      | Se activa                | Los datos cambian realmente en la aplicación remota, por lo que la aplicación actual no activa eventos locales de tabla de datos; la aplicación remota activa sus propios eventos de tabla de datos |
| Activación programada por campo de fecha | No se activa | Se activa            | La aplicación actual no activa el flujo basándose en los campos de las tablas remotas; la aplicación remota lo activa según su propia configuración de campos de fecha |

Los disparadores que no dependen de la fuente de datos se activan en la aplicación actual y en la aplicación remota según la configuración de cada una.

Si necesitas orquestar en la aplicación actual un flujo que opere sobre datos de NocoBase externa, se recomienda utilizar un evento previo a la solicitud, un evento posterior a la solicitud o un evento de operación personalizada. Los flujos de trabajo existentes en la aplicación remota se ejecutan de forma independiente en ella.

#### Nodos

La siguiente tabla solo incluye los nodos relacionados con fuentes de datos. Los nodos generales, como los de condición, cálculo, bucle y procesamiento JSON, no dependen del tipo de fuente de datos y pueden utilizarse como en cualquier flujo de trabajo normal.

| Nodo          | Disponible | Descripción                         |
| ------------- | ---------- | ----------------------------------- |
| Consultar registros | Disponible | Consulta registros en la aplicación remota |
| Crear registros     | Disponible | Crea registros en la aplicación remota    |
| Actualizar registros | Disponible | Actualiza registros en la aplicación remota |
| Eliminar registros  | Disponible | Elimina registros en la aplicación remota |
| Nodo SQL             | No disponible | El nodo SQL de los flujos de trabajo solo admite fuentes de datos de bases de datos |
| Nodo de agregación   | No disponible | El nodo de agregación solo admite fuentes de datos de bases de datos |

## Preguntas frecuentes

### No aparece la tabla de datos

Comprueba que la fuente de datos esté habilitada y que la dirección de la API y la API key sean correctas. La aplicación remota también debe permitir que la API key acceda a la tabla de datos correspondiente.

### La carga del archivo se realiza correctamente, pero no se puede previsualizar

Si la aplicación actual o la aplicación remota utiliza almacenamiento de archivos local, comprueba que Origin esté establecido como la dirección pública de acceso de la aplicación correspondiente. Origin no debe establecerse como la dirección de la API.

### Tengo permisos en la aplicación actual, pero la operación falla

Comprueba los permisos de la API key de la aplicación remota. Las fuentes de datos NocoBase externas están sujetas tanto a los permisos de la aplicación actual como a los de la aplicación remota.

### La tabla de datos no se puede utilizar después de una anomalía del servicio remoto

Si la aplicación remota devuelve un error 502, se reinicia o deja de estar disponible temporalmente, es posible que la aplicación actual no pueda leer temporalmente los metadatos de las tablas de datos remotas. Cuando el servicio remoto se recupere, la aplicación actual volverá a cargar automáticamente los metadatos la próxima vez que acceda a las tablas de datos de esta fuente.

### Por qué no puedo configurar los campos en la aplicación actual

Las fuentes de datos NocoBase externas utilizan la estructura de tablas y la configuración de campos de la aplicación remota. Ajusta los campos en la aplicación remota y vuelve a cargar las tablas de datos en la aplicación actual.
