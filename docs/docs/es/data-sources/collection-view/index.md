---
pkg: "@nocobase/plugin-data-source-main"
title: "Vistas de base de datos"
description: "Conecta vistas ya existentes en la base de datos como fuentes de datos y configura sus campos y visualización en NocoBase, adecuado para gestionar visualmente resultados de consultas complejas."
keywords: "Vista de base de datos,Collection View,vista"
---
# Conectar una vista de base de datos

## Introducción

Conecta vistas de la base de datos, como vistas de informes financieros mantenidas por el DBA, vistas de clientes filtradas o vistas agregadas sincronizadas entre distintos sistemas. Es adecuada para reutilizar la lógica de consulta ya definida en la base de datos.

:::tip Consejo

Se admiten vistas normales dentro del ámbito de los propietarios de la cuenta de conexión de la base de datos principal; no se admiten vistas materializadas. Aunque la cuenta tenga permiso de consulta sobre vistas de otros propietarios, estas no aparecerán en la lista de vistas disponibles para conectar. Antes de conectarlas, confirma que los campos de la vista tengan nombres de columna estables y que sus tipos puedan ser reconocidos por NocoBase.

:::

## Conectar una vista de base de datos

1. Haz clic en el menú de fuentes de datos dentro de las funciones del sistema para acceder a la página principal de fuentes de datos.
2. Selecciona la fuente de datos **Main** en la lista de fuentes de datos y haz clic en «Configure» para acceder a la base de datos principal.
3. En la administración de la base de datos principal, haz clic en «Create collection» y selecciona «Connect to database view»

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que se muestra la vista de base de datos en la interfaz, por ejemplo, «Vista de informes financieros» o «Vista de estadísticas de clientes». Se recomienda usar un nombre que indique claramente la finalidad de la vista. |
| Collection name | Nombre identificador de la vista de base de datos en NocoBase, utilizado para las referencias internas de la API, los campos de relación, los permisos, los flujos de trabajo, etc. Se genera automáticamente, pero también puede modificarse manualmente; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Database view | Selecciona la vista de base de datos que deseas conectar. Lee de la vista la estructura de los campos y los resultados de las consultas. Al editarla, puedes consultar la vista conectada actualmente, pero no cambiarla por otra. |
| Categories | Categoría de la tabla de datos. Solo afecta a la organización de la interfaz de administración de tablas de datos y no modifica la vista de la base de datos. |
| Description | Descripción de la tabla de datos. Se recomienda indicar claramente quién mantiene esta vista, qué datos consulta y en qué páginas o informes se utiliza. |
| Use simple pagination mode | Modo de paginación simple. Al activarlo, la paginación de los bloques de tabla omite el recuento del total de registros. Es adecuado para vistas con grandes volúmenes de datos y puede reducir la carga de las consultas. |
| Record unique key | Identificador único del registro. Las vistas de base de datos normalmente no tienen una clave principal, por lo que debes seleccionar un campo que permita localizar cada registro de forma única; de lo contrario, es posible que los registros no se visualicen o editen correctamente en los bloques. |
| Source collections | Origen de los campos de la vista de base de datos. Permite asociar los campos de la vista con campos de tablas de datos existentes para ayudar a NocoBase a identificar sus tipos y tipos de interfaz. |
| Fields | Configuración del mapeo de campos. Se utiliza para confirmar el nombre, título, tipo de datos y tipo de interfaz de cada campo de la vista. |
| Preview | Vista previa de los resultados de la vista de base de datos. Antes de enviar la configuración, puedes confirmar que el mapeo de campos y la visualización sean los esperados. |
| Allow add new, update and delete actions | Indica si se permiten acciones de creación, actualización y eliminación sobre la vista de base de datos. Al activarlo, NocoBase mostrará las entradas correspondientes en la página; que la escritura se complete correctamente dependerá de si la propia vista es editable y de si la cuenta de la base de datos tiene permisos de insert, update y delete. |

:::tip Consejo

`Source collections` son las tablas de datos de origen inferidas a partir de la vista de base de datos. Permite identificar de qué tablas existentes proceden principalmente los campos de la vista y limita las opciones disponibles de `Field source` durante el mapeo de campos.

El resultado de la inferencia sirve de ayuda para agilizar la configuración. Si la vista contiene renombrados, cálculos, agregaciones o joins complejos, el resultado puede no ser completamente preciso o no poder inferirse; en ese caso, debes confirmarlo manualmente en `Fields`.

:::

### Mapeo de campos

El mapeo de campos es una configuración que debes confirmar después de conectar una vista de base de datos. Tras conectar la vista, NocoBase infiere primero el origen y el tipo de base de datos de cada campo: cuando puede inferir el campo de origen, obtiene automáticamente el Field type, el Field interface y el Field display name del campo existente; cuando no puede hacerlo, proporciona un Field type inicial según el tipo de campo de la base de datos, por lo que debes confirmar manualmente el tipo de campo y la configuración de la interfaz.
[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Configuración | Descripción |
| --- | --- |
| Field source | Selecciona de qué tabla de datos y campo existentes procede el campo de la vista. Tras seleccionar el origen, NocoBase puede reutilizar el Field type y el Field interface del campo original. |
| Field type | Si el campo de la vista no tiene un origen claro, debes confirmar manualmente su tipo de datos. |
| Field interface | Confirma cómo se mostrará y se introducirá el campo en la página, por ejemplo, texto de una sola línea, número, fecha u opciones desplegables. |
| Field display name | Nombre con el que se muestra el campo en la interfaz. Se recomienda usar un nombre que el personal de negocio pueda entender. |

Por ejemplo, si la vista devuelve `customer_name` y este procede del campo «Nombre del cliente» de la tabla de clientes, puedes mapearlo al campo correspondiente de la tabla de clientes. De este modo, NocoBase puede reutilizar el título, el tipo y la configuración de interfaz del campo original.

Si el campo de la vista procede de un resultado agregado o calculado, como `count(*) as total` o `sum(amount) as amount_total`, normalmente tendrás que seleccionar manualmente el Field type y un Field interface adecuado.

:::tip Consejo

`Field source` procede de la inferencia que NocoBase realiza sobre la vista de base de datos e indica a qué campo existente podría corresponder un campo de la vista. Cuando un campo incluye `Field source`, NocoBase dará prioridad a la reutilización del Field type y el Field interface del campo de origen.

Si no se puede inferir el campo de origen o el resultado no corresponde al significado del negocio, debes eliminar `Field source` y seleccionar manualmente `Field type`, `Field interface` y `Field display name`.

:::

### Identificador único del registro

Las vistas de base de datos deben tener configurado un Record unique key; de lo contrario, no se podrán crear bloques en las páginas ni visualizar o editar correctamente los registros. Puedes seleccionar un campo o una combinación de varios campos como identificador único. Los campos adecuados como Record unique key suelen cumplir estas condiciones:

- El valor del campo es único
- El valor del campo es estable y no cambia debido al ordenamiento, la paginación o las variaciones en los criterios estadísticos
- El campo no está vacío
- El campo siempre se devuelve en la vista

Si la vista procede de una consulta sobre una sola tabla, se recomienda devolver primero la clave principal de la tabla original. Si procede de un join entre varias tablas o de una agregación, puedes conservar en la vista de base de datos un ID de negocio estable o generar un campo único estable desde la base de datos.

### Permitir operaciones de creación, actualización y eliminación

Si la vista de base de datos admite escritura, puedes activar «Allow add new, update and delete actions». NocoBase permitirá realizar operaciones de creación, actualización y eliminación sobre esta vista desde la página.

Las vistas de base de datos son más adecuadas como resultados de consultas y, de forma predeterminada, se tratan como tablas de datos de solo lectura. Solo se recomienda activar esta opción cuando hayas confirmado que la vista admite las operaciones de escritura correspondientes y que los permisos de la base de datos también permiten escribir.

### Vista previa de los resultados de la vista

Antes de enviar la configuración, usa Preview para consultar los resultados de la vista. Durante la vista previa, confirma especialmente:

- Que la view se pueda consultar correctamente
- Que los campos estén completos
- Que los tipos de campo y de interfaz correspondan al significado del negocio
- Que Record unique key exista y que sus datos sean únicos
- Si es necesario ajustar en la base de datos los tipos de campo no compatibles

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Configurar campos

Después de crear la vista de base de datos, haz clic en «Configure fields» a la derecha de la vista en la lista de tablas de datos para acceder a la página de configuración de campos. Esta configuración permite mantener los campos de la vista, definir cómo se muestran en la interfaz y establecer cómo se mapean los campos de la view a los Field type y Field interface de NocoBase.

Los campos normales de una vista de base de datos proceden de la view. NocoBase no añade, modifica ni elimina directamente columnas reales en la view. En la página de configuración de campos, solo se pueden añadir campos de relación de muchos a uno para complementar las relaciones de negocio en NocoBase. Las vistas de base de datos no pueden utilizarse como tablas de destino de campos de relación y normalmente no es necesario configurar un campo de título.

[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Añadir un campo de relación

En las vistas de base de datos solo se pueden añadir campos de relación de muchos a uno. Estos campos permiten mapear un campo existente de la view a la clave principal o a un campo único de la tabla de datos de destino para mostrar registros relacionados en la página, pero no crean campos reales ni restricciones de clave externa en la view.

Haz clic en «Add field» para añadir un campo de relación de muchos a uno.

[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Configuración | Descripción |
| --- | --- |
| Field display name | Nombre con el que se muestra el campo de relación de muchos a uno en la interfaz. Se recomienda usar un nombre que el personal de negocio pueda entender, por ejemplo, «Cliente asociado» o «Pedido relacionado». |
| Field name | Nombre identificador con el que se guarda el campo de relación de muchos a uno en NocoBase, utilizado para las referencias internas de la API, los permisos, los flujos de trabajo, etc. |
| Source collection | Tabla de datos de origen, es decir, la tabla de datos de la vista de base de datos actual. Determina de qué campo de la tabla de datos se selecciona `Foreign key`; al añadir un campo de relación de muchos a uno a una vista de base de datos, normalmente se mantiene la view actual. |
| Target collection | Tabla de datos de destino que se asociará. Normalmente se seleccionan tablas de datos reales, como tablas normales o tablas de bases de datos externas; no se puede seleccionar una vista de base de datos. |
| Foreign key | Campo de la vista de base de datos actual que almacena el identificador del registro de destino. Este campo debe devolverse de forma estable en los resultados de la consulta de la view. |
| Target key | Campo de la tabla de datos de destino con el que se compara `Foreign key`; normalmente se selecciona la clave principal o un campo único. |
| Description | Descripción del campo. Puede incluir el significado de la relación, el origen de los datos, la forma de mantenimiento o cualquier observación importante. |

### Mapeo de campos

Después de conectar la vista de base de datos, NocoBase infiere el Field type a partir de los campos de la view y de sus campos de origen, y asigna un Field interface predeterminado. Si el origen del campo, su forma de visualización o su significado de negocio no son los esperados, puedes ajustar el mapeo en la configuración del campo.

[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Consejo

- Field interface (tipo de interfaz / tipo de UI): determina cómo se muestra e interactúa con el campo en el frontend. Por ejemplo, «texto de una sola línea», «número», «menú desplegable» o «fecha y hora». Es la clasificación del campo desde la perspectiva del usuario.
- Field type (tipo de datos): determina cómo identifica NocoBase el tipo de datos del campo. Los campos de la view que no tienen un campo de origen normalmente se infieren a partir del tipo de campo de la base de datos, por ejemplo, `string`, `integer`, `decimal`, `boolean`, `datetime`, etc.

:::

:::warning Atención

Ajustar Field source, Field type o Field interface no equivale a modificar el tipo de campo de la view en la base de datos. Principalmente afecta a la forma de visualización en la página, las reglas de validación y el modo en que NocoBase identifica el campo.

:::

### Sincronizar desde la base de datos

Si se modifica la estructura de los campos de la view en la base de datos, accede a «Configure fields» y haz clic en «Sync from database» para volver a leerla. Tras la sincronización, NocoBase actualizará los campos: añadirá los nuevos campos presentes en la view, eliminará los campos que ya no existan en ella y volverá a confirmar los tipos y orígenes de los campos.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Atención

Al sincronizar, el renombrado de un campo normalmente se interpreta como «eliminar el campo antiguo + añadir el nuevo». Antes de sincronizar, confirma si el campo antiguo está siendo utilizado por páginas, permisos, flujos de trabajo o API externas para evitar que la configuración deje de funcionar. Después de sincronizar, también debes volver a comprobar el Field type y el Field interface.

:::

### Editar campos

Haz clic en «Edit» a la derecha de un campo para editar su configuración. Editar un campo resulta útil para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, las reglas de validación o la configuración específica del campo.
[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Atención

Editar la configuración de un campo no modifica el nombre real de la columna, el tipo de campo, la expresión SQL ni los índices de la view en la base de datos. Si necesitas ajustar la estructura real de la view, modifícala primero en la base de datos y después sincronízala mediante «Sync from database».

:::

### Eliminar campos

Haz clic en «Delete» a la derecha de un campo para eliminarlo. Eliminar un campo solo lo quita de los campos guardados en NocoBase; no elimina la columna real de la view en la base de datos.

[Obtén más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Atención

Eliminar un campo puede afectar a los bloques de página, las condiciones de filtrado, el ordenamiento, los permisos, los flujos de trabajo, la API y las configuraciones existentes. Antes de eliminarlo, confirma si todavía se está utilizando. Si la view sigue devolviendo esa columna, NocoBase podría volver a reconocer el campo al ejecutar «Sync from database» posteriormente.

:::

## Editar la vista

La definición SQL de una vista de base de datos se mantiene desde la base de datos. En la lista de tablas de datos, haz clic en «Edit» a la derecha de una vista de base de datos para ajustar sus metadatos y configuración de ejecución en NocoBase; esto no modifica la view de la base de datos. Si necesitas conectar otra view, se recomienda crear una nueva tabla de datos de vista de base de datos.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que se muestra la vista de base de datos en la interfaz. Puedes cambiarlo por un nombre que el personal de negocio entienda, por ejemplo, «Vista de informes financieros» o «Vista de estadísticas de clientes». |
| Collection name | Nombre identificador de la vista de base de datos en NocoBase. No se puede modificar durante la edición. |
| Database view | View de la base de datos conectada actualmente. Es de solo lectura durante la edición y no se puede cambiar por otra view. |
| Categories | Categoría de la tabla de datos. Solo afecta a la organización de la interfaz de administración de fuentes de datos y no modifica la view de la base de datos. |
| Description | Descripción de la tabla de datos. Puede incluir quién mantiene la view, el origen de la consulta y las páginas o informes en los que se utiliza. |
| Use simple pagination mode | Modo de paginación simple. Al activarlo, la paginación de los bloques de tabla omite el recuento del total de registros. Es adecuado para views con grandes volúmenes de datos. |
| Record unique key | Identificador único del registro. Se utiliza para localizar un registro; normalmente se selecciona un campo o una combinación de campos estable y única en la view. |
| Allow add new, update and delete actions | Indica si se permiten operaciones de creación, actualización y eliminación. Solo se recomienda activarlo cuando la propia view admite escritura y la cuenta de la base de datos tiene los permisos correspondientes. |

:::warning Atención

Después de modificar Record unique key o Allow add new, update and delete actions, debes volver a comprobar que los bloques de página, los permisos y los flujos de trabajo sigan funcionando según lo previsto.

:::

## Eliminar la vista

En la lista de tablas de datos, haz clic en «Delete» a la derecha de una vista de base de datos para eliminar su tabla de datos. Eliminar la tabla de datos de la vista solo borra la configuración de conexión y los campos de NocoBase; no elimina la view de la base de datos.

También puedes seleccionar varias vistas de base de datos de la base de datos principal y eliminarlas de forma conjunta. Antes de eliminarlas, comprueba si los bloques de página, gráficos, permisos, flujos de trabajo o API externas siguen utilizando esta tabla de datos de vista de base de datos.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
