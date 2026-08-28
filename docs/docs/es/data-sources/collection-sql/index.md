---
pkg: "@nocobase/plugin-collection-sql"
title: "Tabla SQL"
description: "Crea tablas de datos a partir de resultados de consultas SQL y configura el origen de los campos, el mapeo de campos y el identificador único de los registros. Adecuado para consultas relacionadas, estadísticas y presentación de informes."
keywords: "Tabla SQL, colección SQL, consulta SQL, mapeo de campos, informes,NocoBase"
---

#  Tabla SQL

## Introducción

Escribir una consulta SQL forma una tabla SQL. No crea una tabla de base de datos real, sino que lee los resultados de la consulta para que puedan utilizarse en tablas, detalles, gráficos y flujos de trabajo. Casos de uso: datos resumidos e informes estadísticos.

:::warning Nota

Las tablas SQL solo admiten sentencias `SELECT` o sentencias `WITH ... SELECT`. Solo permiten consultar y mostrar datos; no admiten crear, editar ni eliminar datos.

:::

## Crear una tabla SQL

1. Haz clic en el menú de fuentes de datos de las funciones del sistema para acceder a la página principal de fuentes de datos.
2. Selecciona la fuente de datos **Main** en la lista de fuentes de datos y haz clic en la acción «Configure» para acceder a la base de datos principal.
3. En la administración de la base de datos principal, haz clic en «Create collection» y selecciona «SQL collection».

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre que se muestra en la interfaz para la tabla SQL, por ejemplo, «Resumen de ventas» o «Alertas de inventario». Se recomienda utilizar un nombre que explique el significado de los resultados de la consulta. |
| Collection name | Nombre identificador de la tabla SQL en NocoBase, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Se genera automáticamente, pero también puede modificarse manualmente; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Categories | Categoría de la tabla de datos. Solo afecta a la organización de la interfaz de administración de tablas de datos y no modifica la consulta SQL. |
| Description | Descripción de la tabla de datos. Se recomienda indicar claramente qué datos consulta esta sentencia SQL, quién la mantiene y para qué página o informe se utiliza. |
| Record unique key | Identificador único del registro. Los resultados de una consulta SQL no tienen una clave primaria real, por lo que debes seleccionar un campo o una combinación de campos que permita localizar cada registro de forma única; de lo contrario, es posible que no se puedan consultar correctamente los registros en los bloques. |
| SQL | Consulta utilizada por la tabla SQL. NocoBase ejecutará esta sentencia SQL, configurará los campos basándose en los resultados de la consulta y utilizará dichos resultados como una tabla de datos. |
| Source collections | Origen de los campos de los resultados de la consulta SQL. Se utiliza para relacionar los campos de los resultados con los campos de las tablas de datos existentes y ayudar a NocoBase a identificar el origen y el tipo de interfaz de los campos. |
| Fields | Configuración del mapeo de campos. Se utiliza para confirmar el nombre, el origen, el tipo de interfaz y el nombre visible de cada campo. |
| Preview | Vista previa de los resultados de la consulta SQL. Antes de enviarla, puedes confirmar que el mapeo de campos y el resultado visual cumplen las expectativas. |

### Escribir una consulta SQL

Introduce la consulta SQL y haz clic en «Execute» para ejecutarla e intentar analizar los campos devueltos y las tablas de datos de origen.
Haz clic en «Execute» únicamente para ejecutar la vista previa y analizar los campos. Después de confirmar que la consulta SQL es válida, haz clic en «Confirm» para que el formulario pueda enviarla como consulta confirmada.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Consejo

`Source collections` son las tablas de datos de origen inferidas a partir de la consulta SQL. Identifica de qué tablas de datos existentes proceden principalmente los campos de los resultados de la consulta y limita las opciones disponibles de `Field source` durante el mapeo de campos.

El resultado de la inferencia sirve para facilitar una configuración rápida. Si la consulta SQL contiene alias, subconsultas, campos calculados, funciones de agregación o joins complejos, el resultado puede no ser completamente preciso o no se podrá inferir. En ese caso, puedes especificar manualmente `Source collections`.

:::

### Mapeo de campos

El mapeo de campos es una configuración que debe confirmarse después de crear una tabla SQL. Los resultados de la consulta SQL solo indican a NocoBase qué columnas se han devuelto. Para que estas columnas puedan utilizarse como campos normales en la interfaz, también debes confirmar `Field source` o configurar `Field interface` y el nombre visible del campo.
[Más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Configuración | Descripción |
| --- | --- |
| Field source | Selecciona de qué tabla de datos y campo existentes procede cada campo de los resultados de la consulta SQL. Una vez seleccionado el origen, NocoBase puede reutilizar el Field interface del campo original. |
| Field interface | Confirma cómo se muestra y se introduce el campo en la página, por ejemplo, texto de una sola línea, número, fecha u opciones desplegables. |
| Field display name | Nombre con el que se muestra el campo en la interfaz. Se recomienda utilizar un nombre que el personal de negocio pueda comprender. |

Por ejemplo, si la consulta SQL devuelve `customers.name as customer_name` y este procede del campo «Nombre del cliente» de la tabla de clientes, puedes mapearlo al campo correspondiente de la tabla de clientes. De este modo, NocoBase reutilizará el título y la configuración de interfaz del campo original.

Si el campo procede de un resultado calculado, como `count(*) as total` o `sum(amount) as amount_total`, normalmente no existe un campo de origen claro, por lo que debes seleccionar manualmente un Field interface adecuado.

:::tip Consejo

`Field source` depende de `Source collections`. El campo de origen disponible en la tabla de mapeo solo aparecerá después de seleccionar la tabla de datos de origen.

Cuando la inferencia de campos incluye `Field source`, NocoBase reutilizará preferentemente el Field interface del campo de origen. Si no se puede inferir el campo de origen, puedes especificar manualmente `Field source`; si el resultado de la inferencia no coincide con el significado del negocio, debes eliminar `Field source` y especificar manualmente `Field source`, o seleccionar manualmente `Field interface` y configurar `Field display name`.

:::

### Identificador único del registro

La tabla SQL debe tener configurado un Record unique key; de lo contrario, no se podrán crear bloques en la página ni consultar correctamente los registros. Puedes seleccionar un solo campo o una combinación de varios campos como identificador único. Los campos adecuados como Record unique key suelen cumplir estas condiciones:

- Cada fila de los resultados de la consulta es única
- El valor del campo es estable y no cambia debido a la paginación, el orden o cambios en los criterios estadísticos
- El campo no está vacío
- El campo siempre se devuelve en los resultados de la consulta

Si los resultados proceden de una sola tabla, puedes devolver preferentemente la clave primaria de la tabla original. Si proceden de un join entre varias tablas o de una agregación, puedes conservar en la consulta SQL un ID de negocio estable o devolver varios campos que permitan localizar conjuntamente el registro.

:::warning Nota

No utilices valores como `row_number()`, que cambian con el orden, los filtros o el intervalo estadístico, como Record unique key estable a largo plazo. Si cambia el identificador único del registro, es posible que los bloques de página, los permisos, los flujos de trabajo y las API externas no puedan localizar el mismo registro.

:::

### Vista previa de los resultados de la consulta

Antes de enviarla, utiliza Preview para consultar los resultados de la consulta SQL. Durante la vista previa, comprueba especialmente:

- Que la consulta SQL se ejecute correctamente
- Que los campos devueltos estén completos
- Que el Field interface y el nombre visible sean coherentes con el significado del negocio
- Que exista un Record unique key y que los datos sean únicos
- Que los resultados de la consulta sean adecuados para mostrarse en la página

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## Configurar campos

Después de crear la tabla SQL, haz clic en «Configure fields» a la derecha de la tabla SQL en la lista de tablas de datos para acceder a la página de configuración de campos. La configuración de campos se utiliza para mantener los campos de la tabla SQL, definir cómo se muestran en la interfaz y establecer cómo se mapean los resultados de la consulta SQL a los Field interface de NocoBase.
[Más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

### Cambiar el tipo de interfaz de usuario

Después de crear la tabla SQL, todavía puedes ajustar la configuración de interfaz de los campos desde la configuración de campos. Esta página se utiliza principalmente para cambiar el Field interface, modificar el nombre visible y la descripción, y configurar opciones específicas del campo.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

Es adecuado gestionar aquí los siguientes casos:

- Al crear la tabla SQL, el Field interface configurado no era correcto
- El nombre visible del campo no se ajusta al uso habitual del negocio y debe cambiarse por un nombre más comprensible
- El significado del negocio del campo de los resultados de la consulta ha cambiado y es necesario volver a confirmar la forma de mostrarlo
- Es necesario ajustar la descripción o la configuración específica del campo, como las opciones desplegables

### Synchronizar desde la base de datos

Si la consulta SQL no ha cambiado, pero la estructura de la tabla de datos subyacente o sus campos sí, puedes acceder a «Configure fields» y hacer clic en «Sync from database» para volver a ejecutar la consulta SQL y sincronizar los campos. Consulta el mapeo de campos en [«Crear una tabla SQL»](#字段映射).

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### Editar campos

Haz clic en «Edit» a la derecha de un campo para editar su configuración. Editar un campo resulta útil para ajustar cómo se muestra y utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, las reglas de validación o la configuración específica del campo.
[Más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

:::warning Nota

Editar la configuración de un campo no modifica la consulta SQL, el nombre del campo de la tabla de origen, la definición del campo de origen ni los índices de la base de datos. Si necesitas ajustar las columnas reales de los resultados de la consulta, modifica primero la consulta SQL y, después, vuelve a ejecutarla y sincroniza los campos.

:::

### Eliminar campos

Haz clic en «Delete» a la derecha de un campo para eliminarlo. Eliminar un campo solo quita el campo guardado en NocoBase; no elimina la consulta SQL ni la columna real de la tabla de datos de origen.
[Más información sobre la configuración de campos](../data-modeling/collection-fields/index.md)

:::warning Nota

Eliminar un campo puede afectar a los bloques de página, las condiciones de filtrado, el orden, los permisos, los flujos de trabajo, la API y las configuraciones existentes. Antes de eliminarlo, confirma que el campo ya no se utiliza. Si la consulta SQL sigue devolviendo esa columna, NocoBase podría volver a identificarla al ejecutar posteriormente «Sync from database».

:::

## Editar una tabla SQL

En la lista de tablas de datos, haz clic en «Edit» a la derecha de una tabla SQL para ajustar sus metadatos y configuración de ejecución en NocoBase. Las opciones de configuración son básicamente las mismas que al crear una tabla SQL; solo `Collection name` no se puede modificar.

Si la consulta SQL cambia, debes volver a hacer clic en «Execute» y confirmar el mapeo de campos, el Record unique key y los resultados de la vista previa.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Nota

Modificar la consulta SQL puede provocar cambios en los nombres de los campos, el mapeo de campos o el Record unique key. Después de modificarla, comprueba de nuevo que los bloques de página, los gráficos, los permisos y los flujos de trabajo sigan funcionando correctamente.

:::

## Eliminar una tabla SQL

En la lista de tablas de datos, haz clic en «Delete» a la derecha de la tabla SQL. Esto solo elimina la configuración y los campos de la tabla SQL en NocoBase; no elimina la tabla de origen subyacente ni los datos que contiene.
También puedes seleccionar varias tablas y eliminarlas conjuntamente. Antes de eliminarlas, comprueba si los bloques de página, los gráficos, los permisos, los flujos de trabajo y las API externas siguen utilizando esta tabla SQL.