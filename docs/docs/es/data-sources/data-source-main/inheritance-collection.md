---
pkg: "@nocobase/plugin-data-source-main"
title: "Tabla heredada"
description: "Las tablas heredadas derivan tablas secundarias a partir de una tabla principal. Las tablas secundarias heredan la estructura de campos de la tabla principal y pueden definir sus propios campos. Solo son compatibles cuando la base de datos principal es PostgreSQL."
keywords: "tabla heredada,Inheritance Collection,herencia de tablas,extensión de tablas de datos,PostgreSQL,NocoBase"
---

# Tabla heredada

## Introducción

Las tablas heredadas son una extensión de las tablas normales, adecuadas para varios tipos de datos que comparten un conjunto de campos comunes, mientras que cada tabla secundaria tiene sus propios campos específicos.

Por ejemplo, primero se puede crear la tabla principal «Activos» para guardar campos comunes como el número de activo, el nombre del activo, la fecha de adquisición y la persona responsable, y después derivar tablas secundarias como «Activos informáticos», «Vehículos» y «Mobiliario de oficina». Las tablas secundarias heredan la estructura de campos de la tabla principal y pueden seguir definiendo sus propios campos.

:::warning Nota

Las tablas heredadas solo se pueden crear cuando la base de datos principal es PostgreSQL. Otras bases de datos principales, las bases de datos externas, las fuentes de datos de API REST y las fuentes de datos externas de NocoBase no son compatibles con las tablas heredadas.

:::

## Casos de uso

Las tablas heredadas son adecuadas para estos escenarios empresariales:

- Derivar las tablas de activos informáticos, vehículos y mobiliario de oficina a partir de una tabla principal de activos
- Derivar las tablas de empleados, personal subcontratado y visitantes a partir de una tabla principal de personal
- Derivar las tablas de tareas, incidencias y requisitos a partir de una tabla principal de asuntos
- Derivar las tablas de contratos de compra, contratos de venta y contratos de servicios a partir de una tabla principal de contratos

El requisito previo para utilizar tablas heredadas es que estos objetos tengan campos comunes estables y que las diferencias entre las tablas secundarias se manifiesten principalmente en un número reducido de campos específicos.

## Creación y configuración

En la base de datos principal, al hacer clic en «Create collection» y seleccionar una tabla normal o una opción de creación compatible con la herencia, se puede seleccionar la tabla principal mediante `Inherits`.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que se muestra la tabla de datos en la interfaz, por ejemplo, «Activos informáticos», «Vehículos» o «Mobiliario de oficina». |
| Collection name | Nombre identificativo de la tabla de datos, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. |
| Inherits | Selecciona la tabla principal que se heredará. La tabla de datos actual heredará la estructura de campos de la tabla principal y podrá seguir definiendo sus propios campos. |
| Categories | Categoría de la tabla de datos. La categoría solo afecta a la organización de la interfaz de gestión de tablas de datos y no modifica su estructura. |
| Description | Descripción de la tabla de datos. Se puede indicar qué tipo de datos guarda esta tabla secundaria, de qué tabla principal se deriva y quién la mantiene. |
| Preset fields | Campos predefinidos. Las tablas heredadas normalmente también conservan los campos ID, fecha de creación, creador, fecha de actualización y actualizador de las tablas normales. |

Las tablas heredadas pueden utilizar la misma configuración de bloques y campos que las [tablas normales](./general-collection.md). Para los bloques de página, siguen siendo tablas de datos en las que se pueden crear, consultar, actualizar y eliminar registros.

:::warning Nota

Las tablas heredadas son adecuadas para objetos empresariales con estructuras muy similares. Si los procesos empresariales, los permisos y las páginas de los distintos objetos presentan grandes diferencias, normalmente resulta más claro dividirlos en tablas normales y conectarlas mediante campos de relación.

:::

### Campos integrados

Las tablas heredadas heredan los campos existentes de la tabla principal y también pueden seguir añadiendo sus propios campos.

| Origen del campo | Descripción |
| --- | --- |
| Campos de la tabla principal | La tabla secundaria hereda los campos comunes de la tabla principal, como el número de activo, el nombre del activo y la persona responsable. |
| Campos de la tabla secundaria | La tabla secundaria puede seguir definiendo sus propios campos específicos, como el «Modelo de CPU» de los activos informáticos o la «Matrícula» de los vehículos. |
| Campos del sistema | Si se conserva `Preset fields` durante la creación, se incluirán los campos ID, fecha de creación, creador, fecha de actualización y actualizador, entre otros. |

:::warning Nota

Los campos de la tabla principal afectan a todas las tablas secundarias que los heredan. Antes de modificar los campos de la tabla principal, confirma si las páginas, los permisos, los flujos de trabajo y las API de las tablas secundarias dependen de ellos.

:::

### Campo de clave primaria

Las tablas heredadas, al igual que las tablas normales, necesitan un campo de clave primaria. Al crear una tabla, se recomienda conservar el campo predefinido ID; el tipo de clave primaria predeterminado es `Snowflake ID (53-bit)`.

Si una tabla heredada conectada o sincronizada no tiene una clave primaria, es necesario establecer «Record unique key» al editar la tabla de datos. De lo contrario, es posible que los bloques de página no puedan consultar o editar los registros correctamente.

## Uso en la configuración de páginas

Las tablas heredadas se pueden utilizar en la mayoría de los bloques de página compatibles con las tablas normales. Un uso habitual consiste en configurar cada tabla secundaria como un bloque independiente de tabla, formulario, detalles o kanban.

| Bloque | Uso |
| --- | --- |
| [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md) | Consultar, filtrar, ordenar y procesar por lotes los registros de la tabla secundaria. |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Añadir o editar un único registro de la tabla secundaria. |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Consultar los detalles de un único registro de la tabla secundaria. |
| [Bloque kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Mostrar los registros de la tabla secundaria agrupados por campos como el estado, la etapa o la persona responsable. |

## Edición de la configuración

En la lista de tablas de datos, haz clic en «Edit» a la derecha de la tabla heredada para modificar configuraciones como el nombre mostrado de la tabla, la categoría, la descripción, el modo de paginación simple y «Record unique key».

No se recomienda ajustar con frecuencia las relaciones de herencia después de haber configurado ampliamente los procesos empresariales existentes. Los bloques de página, los campos de relación, los permisos y los flujos de trabajo pueden depender de la estructura de campos actual.

## Eliminación de una tabla de datos

En la lista de tablas de datos, haz clic en «Delete» a la derecha de la tabla heredada para eliminarla.

Eliminar una tabla heredada eliminará los metadatos de Collection de esta tabla secundaria y la tabla de datos real en la base de datos principal. Antes de eliminarla, confirma que ningún bloque de página, campo de relación, permiso, flujo de trabajo o API siga utilizando esta tabla secundaria.

:::danger Advertencia

Eliminar una tabla heredada no equivale automáticamente a eliminar la tabla principal. La eliminación de los objetos dependientes dependerá de las opciones seleccionadas en la confirmación de eliminación. Antes de realizar la operación, confirma si la tabla principal y las demás tablas secundarias todavía deben conservarse.

:::

## Enlaces relacionados

- [Tabla normal](./general-collection.md) — Consulta la configuración general de las tablas normales
- [Base de datos principal](./index.md) — Consulta los tipos de bases de datos compatibles con la base de datos principal
- [Campos de la tabla de datos](../data-modeling/collection-fields/index.md) — Consulta cómo configurar los campos