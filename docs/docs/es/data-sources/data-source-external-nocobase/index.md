---
title: 'NocoBase externo'
description: 'Conecta otra aplicación NocoBase como fuente de datos externa y conoce la configuración, las capacidades disponibles y las limitaciones de flujos de trabajo.'
keywords: 'NocoBase externo,fuente de datos NocoBase,gestor de fuentes de datos,flujo de trabajo,NocoBase'
---

# NocoBase externo

## Introducción

La fuente de datos NocoBase externa conecta otra aplicación NocoBase con la aplicación actual y conserva los metadatos de la aplicación remota, incluidas las colecciones, las interfaces de campo, los títulos y los campos de relación.

En comparación con una fuente de datos de base de datos externa, normalmente no es necesario volver a configurar las interfaces de campo ni crear manualmente campos de relación. Además de ver, crear, editar y eliminar registros, también admite carga y vista previa de archivos, importación y exportación, consultas de gráficos y algunos escenarios de flujos de trabajo.

## Añadir Fuente de Datos

Después de activar el plugin, añade una fuente de datos NocoBase externa en el Gestor de fuentes de datos y completa la información de acceso de la aplicación remota.

| Opción | Descripción |
| --- | --- |
| URL de API | La URL completa de API de la aplicación NocoBase remota, por ejemplo `https://example.com/api` |
| Origin | El origen público de la aplicación NocoBase remota, por ejemplo `https://example.com`. Se utiliza principalmente para gestionar direcciones de vista previa de archivos locales en la aplicación remota |
| API key | La credencial que usa la aplicación actual para acceder a la aplicación NocoBase remota |
| Encabezados de solicitud | Encabezados adicionales enviados a la aplicación remota, como información de espacio |
| Tiempo de espera | Tiempo de espera de las solicitudes a la aplicación remota |

Después de habilitar la fuente de datos, el sistema carga las colecciones de la aplicación remota.

![](https://static-docs.nocobase.com/202606101149185.png)

## Permisos

Una fuente de datos NocoBase externa está afectada por los permisos tanto de la aplicación actual como de la aplicación remota.

- En la aplicación actual, puedes configurar permisos de acceso para distintas colecciones y campos igual que con otras fuentes de datos externas.
- En la aplicación remota, los datos se leen y se operan según los permisos de la API key configurada.

Las fuentes de datos NocoBase externas no devuelven metadatos de permisos para controlar de forma precisa la visibilidad de botones en el frontend. Por ello, algunos botones pueden no ocultarse automáticamente por permisos como ocurre con la fuente de datos principal. Independientemente de si un botón se muestra, las operaciones enviadas siguen pasando por la comprobación de permisos del servidor en la aplicación actual, y las operaciones no autorizadas se rechazan.

:::warning{title=Nota}
Prepara una API key dedicada para la fuente de datos NocoBase externa y concede solo los permisos necesarios de colecciones y operaciones. Si un usuario tiene permiso en la aplicación actual pero la operación falla, revisa los permisos de la API key remota.
:::

## Usar Colecciones

Después de cargar correctamente las colecciones, selecciona esta fuente de datos en la configuración de páginas, bloques, gráficos o flujos de trabajo para usar las colecciones de la aplicación remota.

Cuando cambie la estructura de colecciones en la aplicación remota, vuelve a cargar las colecciones en la aplicación actual.

## Funciones

Las fuentes de datos NocoBase externas se usan principalmente para utilizar colecciones y datos de una aplicación remota dentro de la aplicación actual. La estructura de colecciones, la configuración de campos y los datos reales siguen siendo mantenidos por la aplicación remota.

### Colecciones y Campos

La aplicación actual carga metadatos de la aplicación remota, incluidas colecciones, interfaces de campo, títulos y campos de relación. En comparación con una fuente de datos de base de datos externa, normalmente no necesitas volver a configurar interfaces de campo ni crear manualmente campos de relación en la aplicación actual.

La aplicación actual no permite configurar directamente campos de una fuente de datos NocoBase externa. Para añadir campos, ajustar tipos de campo o modificar campos de relación, haz los cambios en la aplicación remota y después vuelve a cargar las colecciones en la aplicación actual.

### Registros y Datos Asociados

Las fuentes de datos NocoBase externas permiten ver, crear, editar y eliminar registros en bloques de página, y también ver y mantener datos asociados. Las operaciones se inician desde la aplicación actual y se envían a la aplicación remota mediante la API key configurada.

### Archivos y Adjuntos

Los archivos se cargan en el almacenamiento utilizado por la aplicación remota. La aplicación actual inicia las solicitudes de carga, vista previa y descarga, pero los archivos no se guardan en la aplicación actual.

Origin se utiliza principalmente para gestionar direcciones de vista previa de archivos almacenados localmente por la aplicación remota. Si la aplicación remota devuelve una ruta relativa, la aplicación actual usa Origin para completar la URL de acceso al archivo. Origin debe ser la dirección pública de acceso de la aplicación NocoBase remota, por ejemplo:

```text
https://example.com
```

No uses la URL de API como Origin.

### Importación y Exportación

Las operaciones de importación y exportación leen o escriben la fuente de datos mediante archivos externos y se proxyan a la aplicación remota para su ejecución. La aplicación actual procesa las operaciones del usuario, reenvía las solicitudes y devuelve los resultados de descarga. La lectura y escritura real de datos se completa en la aplicación remota.

- Importar registros: la aplicación actual recibe el archivo de importación cargado y lo proxy a la aplicación remota para realizar la importación.
- Exportar registros: la aplicación actual proxy la solicitud a la aplicación remota para exportar registros. En modo síncrono, el archivo de registros devuelto por la aplicación remota se transmite al navegador para su descarga. En modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de registros en la aplicación remota, el progreso se sincroniza con la tarea local y el archivo resultante se transmite desde la aplicación remota al descargarlo.
- Exportar adjuntos: la aplicación actual proxy la solicitud a la aplicación remota para exportar adjuntos. En modo síncrono, el paquete de adjuntos devuelto por la aplicación remota se transmite al navegador para su descarga. En modo asíncrono, se crea una tarea asíncrona local, se inicia la exportación de adjuntos en la aplicación remota, el progreso se sincroniza con la tarea local y el paquete de adjuntos se transmite desde la aplicación remota al descargarlo.

### Impresión con Plantillas

La impresión con plantillas puede usar registros de una fuente de datos NocoBase externa. Las plantillas de impresión y la configuración de acciones de impresión se guardan en la aplicación actual. Al imprimir, la aplicación actual lee los registros remotos y los datos asociados, y genera el archivo de impresión en la aplicación actual.

### Gráficos

#### Panel de Consulta

Las fuentes de datos NocoBase externas pueden usarse en el panel de consulta de gráficos. La aplicación actual procesa los parámetros de consulta según los permisos locales configurados para gráficos, fuente de datos, colección y campos, y después solicita los resultados a la aplicación remota.

La API key remota también debe tener acceso a los datos correspondientes; de lo contrario, la consulta fallará.

#### Panel SQL

El panel SQL es el modo de consulta SQL de los gráficos y solo se usa para consultas. La aplicación actual guarda la configuración SQL e inicia la llamada, mientras que el SQL se proxy a la aplicación remota para su ejecución.

Al usar el panel SQL, el usuario local necesita permisos de configuración de UI en la aplicación actual, y la API key remota también necesita permisos de configuración de UI en la aplicación remota. SQL no se descompone por permisos de colección y campo como el panel de consulta. Concede permisos de configuración de UI a los usuarios locales y a la API key correspondiente con precaución.

### Flujos de Trabajo

Las fuentes de datos NocoBase externas pueden implicar flujos de trabajo tanto en la aplicación actual como en la aplicación remota. La aplicación actual responde a eventos en páginas locales, botones y cadenas de solicitudes API. Después de que la aplicación remota recibe solicitudes proxyadas, las procesa según su propia configuración de flujos de trabajo.

La aplicación actual no escucha eventos de creación, actualización o eliminación que ocurren dentro de colecciones remotas. Los eventos de colecciones remotas solo se activan en la aplicación remota.

#### Disparadores

La siguiente tabla describe cómo se comportan los disparadores afectados por fuentes de datos NocoBase externas en la aplicación actual y en la aplicación remota cuando el flujo de trabajo correspondiente está habilitado.

| Disparador | Aplicación actual | Aplicación remota | Descripción |
| --- | --- | --- | --- |
| Evento antes de la acción | Se activa | Solo en modo global | En la aplicación actual se activa el modo global, y el modo local sigue las vinculaciones de botones de la aplicación actual. Cuando la aplicación remota recibe la solicitud proxyada, solo se activa el modo global |
| Evento después de la acción | Se activa | Solo en modo global | En la aplicación actual se activa el modo global, y el modo local sigue las vinculaciones de botones de la aplicación actual. Cuando la aplicación remota recibe la solicitud proxyada, solo se activa el modo global |
| Evento de acción personalizada | Se activa | No se activa | Un botón "Activar flujo de trabajo" vinculado en la aplicación actual activa el flujo local. Las solicitudes CRUD proxyadas no activan eventos de acción personalizada remotos |
| Evento de colección | No se activa | Se activa | Los datos reales cambian en la aplicación remota. La aplicación actual no activa eventos locales de colección; la aplicación remota activa sus propios eventos de colección |
| Disparador programado por campo de fecha | No se activa | Se activa | La aplicación actual no activa flujos basados en campos de colecciones remotas. La aplicación remota se activa según su propia configuración de campos de fecha |

Los disparadores que no dependen de fuentes de datos se activan en la aplicación actual y en la aplicación remota según sus propias configuraciones.

Para orquestar en la aplicación actual flujos que operen datos de NocoBase externa, usa eventos antes de la acción, eventos después de la acción o eventos de acción personalizada. Los flujos existentes en la aplicación remota se ejecutan de forma independiente en la aplicación remota.

#### Nodos

La siguiente tabla solo enumera nodos relacionados con fuentes de datos. Los nodos generales, como condición, cálculo, bucle y procesamiento JSON, no dependen del tipo de fuente de datos y pueden usarse normalmente.

| Nodo | Disponible | Descripción |
| --- | --- | --- |
| Consultar registros | Disponible | Consulta registros en la aplicación remota |
| Crear registro | Disponible | Crea registros en la aplicación remota |
| Actualizar registro | Disponible | Actualiza registros en la aplicación remota |
| Eliminar registro | Disponible | Elimina registros en la aplicación remota |
| Nodo SQL | No disponible | El nodo SQL de flujos de trabajo solo admite fuentes de datos de base de datos |
| Nodo de agregación | No disponible | El nodo de agregación solo admite fuentes de datos de base de datos |

## Preguntas Frecuentes

### No Aparecen las Colecciones

Comprueba si la fuente de datos está habilitada y si la URL de API y la API key son correctas. La aplicación remota también debe permitir que esa API key acceda a las colecciones correspondientes.

### Los Archivos se Cargan Correctamente pero no se Pueden Previsualizar

Si la aplicación actual o la aplicación remota usa almacenamiento local de archivos, comprueba que Origin sea la dirección pública de acceso de la aplicación correspondiente. Origin no debe ser la URL de API.

### La Aplicación Actual Tiene Permiso, pero la Operación Falla

Revisa los permisos de la API key en la aplicación remota. Las fuentes de datos NocoBase externas están afectadas por los permisos tanto de la aplicación actual como de la aplicación remota.

### Las Colecciones no se Pueden Usar Después de un Error del Servicio Remoto

Si la aplicación remota devuelve 502, se reinicia o no está disponible temporalmente, la aplicación actual puede no poder leer temporalmente los metadatos de colecciones remotas. Después de que el servicio remoto se recupere, la aplicación actual recarga automáticamente los metadatos la próxima vez que se acceda a las colecciones de esta fuente de datos.

### Por qué no se Pueden Configurar Campos en la Aplicación Actual

Las fuentes de datos NocoBase externas usan la estructura de colecciones y la configuración de campos de la aplicación remota. Ajusta los campos en la aplicación remota y después vuelve a cargar las colecciones en la aplicación actual.
