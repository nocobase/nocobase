---
pkg: "@nocobase/plugin-data-source-main"
title: "Colección general"
description: "Las colecciones generales son adecuadas para almacenar datos empresariales habituales, como clientes, pedidos, contratos, tickets, proyectos y tareas. Admiten campos de sistema comunes, configuración de claves principales y la creación de bloques de página."
keywords: "Colección general,General Collection,Campos de sistema,Tabla de datos,NocoBase"
---

# Colección general

## Introducción

La colección general es el tipo de tabla de datos más utilizado y resulta adecuada para almacenar datos empresariales habituales, como clientes, pedidos, contratos, tickets, solicitudes de reembolso, proyectos y tareas. Cuando la mayoría de los objetos empresariales no tienen requisitos de estructura especiales, normalmente basta con utilizar una colección general.

Las colecciones generales pueden proceder de estas fuentes de datos:

- Una tabla nueva creada en la base de datos principal
- Una tabla real existente sincronizada desde la base de datos principal
- Una tabla real existente conectada desde una base de datos externa
- Un recurso mapeado desde una API REST
- Una tabla de datos de una aplicación externa de NocoBase

En NocoBase, todos estos datos se utilizan como colecciones generales. La diferencia es que las colecciones generales de la base de datos principal pueden ser creadas y mantenidas por NocoBase, incluida su estructura real; en cambio, las colecciones generales de fuentes de datos externas normalmente solo leen la estructura existente, que sigue siendo mantenida por el sistema externo.

## Casos de uso

Las colecciones generales son adecuadas para estos escenarios empresariales:

- Datos de CRM, como clientes, contactos, oportunidades y contratos
- Datos de transacciones, como pedidos, envíos, devoluciones y facturas
- Datos de colaboración, como tickets, tareas, proyectos y requisitos
- Datos de procesos, como solicitudes de reembolso, pedidos de compra y solicitudes de pago
- Datos maestros, como equipos, activos, productos y tiendas



## Creación y configuración

En la base de datos principal, haz clic en «Create collection» y selecciona «General collection» para crear una colección general.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que se muestra la tabla de datos en la interfaz, por ejemplo, «Clientes», «Pedidos» o «Archivos adjuntos de contratos». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Collection name | Nombre identificativo de la tabla de datos, utilizado para las referencias internas en API, campos de relación, permisos y flujos de trabajo. Se genera automáticamente, pero también se puede modificar manualmente; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Categories | Categorías de la tabla de datos. Las categorías solo afectan a la organización de la interfaz de gestión de tablas de datos y no modifican su estructura. Cuando hay muchas tablas de datos, se recomienda clasificarlas por módulos empresariales, como «Gestión de clientes», «Gestión de proyectos» o «Finanzas». |
| Description | Descripción de la tabla de datos. Puedes indicar qué datos almacena, quién la mantiene y con qué procesos empresariales está relacionada, para facilitar el mantenimiento posterior. |
| Use simple pagination mode | Modo de paginación simple. Al activarlo, los bloques de tabla omiten el recuento total de registros al paginar. Es adecuado para tablas con grandes volúmenes de datos y puede reducir la carga de las consultas. |
| Preset fields | Campos predefinidos. Al crear la tabla, puedes elegir si se añaden automáticamente campos habituales como ID, fecha de creación, creador, fecha de actualización y actualizador. Se recomienda conservar estos campos en las tablas empresariales generales. |

### Campos integrados

Al crear una colección general, puedes añadir automáticamente campos de sistema habituales mediante `Preset fields`.

| Campo | Nombre del campo | Descripción |
| --- | --- | --- |
| ID | `id` | Campo de clave principal predeterminado, utilizado para identificar de forma única un registro. El tipo de clave principal predeterminado es `Snowflake ID (53-bit)`. |
| Fecha de creación | `createdAt` | Registra automáticamente la fecha y hora de creación del registro. Se utiliza habitualmente para ordenar, filtrar, auditar y establecer condiciones en los flujos de trabajo. |
| Creador | `createdBy` | Registra automáticamente el usuario que creó el registro. Se utiliza habitualmente para «ver solo los datos creados por mí», controlar permisos y realizar el seguimiento de responsabilidades. |
| Fecha de actualización | `updatedAt` | Registra automáticamente la fecha y hora de la última actualización del registro. Se utiliza habitualmente para determinar si los datos han sido modificados. |
| Actualizador | `updatedBy` | Registra automáticamente el usuario que realizó la última actualización del registro. Se utiliza habitualmente en escenarios de auditoría y colaboración. |
| [Espacio](../../multi-app/multi-space/index.md) | `space` | Disponible después de activar el [plugin de espacios múltiples](../../multi-app/multi-space/index.md), permite aislar los datos por espacio. Si no se activa la función de espacios múltiples, no aparecerá entre los campos predefinidos de las colecciones generales. |

### Campo de clave principal

**Primary key** identifica el campo de clave principal. Se utiliza para identificar de forma única un registro en la base de datos. Al crear una tabla, se recomienda conservar el campo predefinido ID; el tipo de clave principal predeterminado es `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Pasa el cursor sobre Interface del campo ID para seleccionar otro tipo de clave principal.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Los tipos de clave principal disponibles son:

- [Texto](../data-modeling/collection-fields/basic/input.md)
- [Entero](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Nota

Las tablas de datos sin clave principal deben configurar «Record unique key» al editar la tabla de datos; de lo contrario, no será posible crear bloques en las páginas ni ver o editar registros correctamente.

:::


## Uso en la configuración de páginas

Las colecciones generales se pueden utilizar en la mayoría de los bloques de datos y bloques de filtrado.

| Bloque | Uso |
| --- | --- |
| [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md) | Ver, filtrar, ordenar y procesar registros por lotes. |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Añadir o editar un solo registro. |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Ver los detalles de un solo registro. |
| [Bloque de lista](../../interface-builder/blocks/data-blocks/list.md) | Mostrar registros en forma de lista. |
| [Bloque de tarjetas en cuadrícula](../../interface-builder/blocks/data-blocks/grid-card.md) | Mostrar en una cuadrícula de tarjetas registros como imágenes, archivos, productos y activos. |
| [Bloque de tablero kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Mostrar registros agrupados por campos como estado, etapa o responsable. |
| [Bloque de calendario](../../interface-builder/blocks/data-blocks/calendar.md) | Mostrar registros por fecha o intervalo de tiempo. |
| [Bloque de gráficos](../../interface-builder/blocks/data-blocks/chart.md) | Generar gráficos estadísticos a partir de los registros. |
| [Bloque de mapa](../../interface-builder/blocks/data-blocks/map.md) | Mostrar registros según su ubicación geográfica. |
| [Bloque de diagrama de Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Mostrar planes de proyectos y programación de tareas según las fechas de inicio y finalización. |
| [Bloque de filtro de formulario](../../interface-builder/blocks/filter-blocks/form.md) | Utilizar condiciones de formulario para filtrar los bloques de datos de la página. |
| [Bloque de filtro de árbol](../../interface-builder/blocks/filter-blocks/tree.md) | Utilizar una estructura de árbol para filtrar los bloques de datos de la página; se usa habitualmente para filtros jerárquicos de categorías, organizaciones, regiones, etc. |

## Edición de la configuración

En la lista de tablas de datos, haz clic en «Edit», a la derecha de la colección general, para modificar su configuración básica. La edición de una tabla de datos se utiliza principalmente para ajustar sus metadatos y parte de la configuración de ejecución, no para modificar la estructura de los campos por lotes.

Para añadir campos, modificar sus tipos, ajustar sus tipos de interfaz o eliminar campos, debes acceder a «Configure fields».

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Collection display name | Sí | Nombre con el que se muestra la tabla de datos en la interfaz, por ejemplo, «Clientes», «Pedidos» o «Archivos adjuntos de contratos». Después de modificarlo, solo cambia la presentación en la interfaz; no cambia el nombre identificativo de la tabla. |
| Collection name | No | Nombre identificativo de la tabla de datos, utilizado para las referencias internas en API, campos de relación, permisos y flujos de trabajo. No se puede modificar en el formulario de edición después de crearla. |
| Inherits | Condicional | Selecciona la tabla principal que se va a heredar. Solo está disponible cuando la base de datos principal es PostgreSQL y esta configuración se muestra en la interfaz. Antes de modificar la relación de herencia de una tabla existente, debes confirmar si la estructura de campos, los bloques de página, los permisos y los flujos de trabajo dependen de la estructura original. |
| Categories | Sí | Categorías de la tabla de datos. Las categorías solo afectan a la organización de la interfaz de gestión de tablas de datos y no modifican su estructura. |
| Description | Sí | Descripción de la tabla de datos. Es adecuada para complementar información sobre su propósito, responsable de mantenimiento, origen de los datos y procesos empresariales relacionados. |
| Use simple pagination mode | Sí | Modo de paginación simple. Al activarlo, los bloques de tabla omiten el recuento total de registros al paginar. Es adecuado para tablas con grandes volúmenes de datos. |
| Record unique key | Sí | Identificador único del registro. Se utiliza para localizar un registro en un bloque; normalmente se selecciona la clave principal o un campo único. Las tablas de datos sin clave principal deben configurarlo; de lo contrario, no será posible crear bloques, ver ni editar registros correctamente. |

:::warning Nota

Editar una tabla de datos no ajusta automáticamente los campos existentes. `Preset fields` solo se aplica al crear la tabla; si después de crearla necesitas añadir campos como fecha de creación, creador, fecha de actualización o actualizador, debes agregarlos por separado en «Configure fields».

:::

## Eliminación de una tabla de datos

En la lista de tablas de datos, haz clic en «Delete», a la derecha de la colección general, para eliminarla. Las colecciones generales de la base de datos principal también admiten la selección y eliminación por lotes.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Al eliminarla, aparecerá una segunda confirmación. Después de confirmar, NocoBase eliminará los metadatos de Collection de esta colección general, así como la tabla de datos real y sus datos en la base de datos principal.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

El cuadro de confirmación de eliminación incluye una opción: eliminar automáticamente los objetos que dependen de esta tabla de datos. Al activarla, NocoBase intentará eliminar también los objetos de base de datos que dependan de esta tabla, como las vistas de base de datos creadas a partir de ella y otros objetos que sigan dependiendo de esos objetos.

:::danger Advertencia

Eliminar una colección general es una operación de alto riesgo. Después de eliminarla, la estructura de la tabla, los datos, los metadatos de los campos y los bloques de página, campos de relación, permisos, flujos de trabajo y llamadas a API que dependan de ella podrían dejar de funcionar. Antes de marcar la opción de eliminar automáticamente los objetos dependientes, confirma que también se pueden eliminar.

:::
