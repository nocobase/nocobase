---
pkg: "@nocobase/plugin-collection-tree"
title: "Tabla de árbol"
description: "La tabla de árbol se utiliza para guardar datos jerárquicos, como estructuras organizativas, categorías de productos, niveles geográficos y directorios departamentales, mediante una estructura de tabla de adyacencia para conservar las relaciones entre padres e hijos."
keywords: "tabla de árbol, colección jerárquica, tabla de adyacencia, datos jerárquicos, Tree Collection,NocoBase"
---

# Tabla de árbol

## Introducción

La tabla de árbol es adecuada para guardar datos con relaciones jerárquicas, como estructuras organizativas, categorías de productos, niveles geográficos, directorios departamentales y directorios de bases de conocimiento. La tabla de árbol utiliza una estructura de tabla de adyacencia para guardar las relaciones entre padres e hijos, y cada registro puede apuntar a su propio nodo padre.

Las tablas de árbol solo se pueden crear desde la página de la base de datos principal. Las bases de datos externas, las fuentes de datos de la API REST y las fuentes de datos externas de NocoBase no admiten la creación de tablas de árbol.

## Casos de uso

La tabla de árbol es adecuada para estos escenarios empresariales:

- Estructuras organizativas y jerarquías departamentales de empresas
- Categorías de productos, directorios de bases de conocimiento y directorios de documentos
- Provincias, ciudades y distritos, regiones de ventas y jerarquías de puntos de servicio
- Categorías de BOM, categorías de equipos y categorías de activos

## Configuración de creación

En la base de datos principal, haz clic en «Create collection» y selecciona «Tree collection» para crear una tabla de árbol.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

La configuración de creación de una tabla de árbol es básicamente igual que la de una tabla normal.

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que la tabla de datos se muestra en la interfaz, por ejemplo, «Estructura organizativa», «Categorías de productos» o «Niveles geográficos». |
| Collection name | Nombre identificativo de la tabla de datos, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. |
| Inherits | Selecciona la tabla padre que se heredará. Solo está visible cuando la base de datos principal es PostgreSQL. |
| Categories | Categoría de la tabla de datos. La categoría solo afecta a la organización de la interfaz de gestión de tablas de datos y no modifica la estructura de la tabla de datos. |
| Description | Descripción de la tabla de datos. Puedes indicar qué datos jerárquicos guarda esta tabla de árbol, quién la mantiene y en qué páginas se utiliza para filtrar. |
| Preset fields | Campos preestablecidos. Al crear una tabla de árbol, se recomienda conservar los campos del sistema y los campos integrados de la tabla de árbol. |

### Campos integrados

Después de crear una tabla de árbol, normalmente contiene estos campos integrados. `parentId`, `parent` y `children` se utilizan para guardar las relaciones jerárquicas.

| Campo | Nombre del campo | Descripción |
| --- | --- | --- |
| ID | `id` | Campo de clave principal predeterminado, utilizado para identificar de forma única un registro. |
| Fecha de creación | `createdAt` | Registra automáticamente la fecha y hora de creación del registro. |
| Creador | `createdBy` | Registra automáticamente el usuario que creó el registro. |
| Fecha de actualización | `updatedAt` | Registra automáticamente la fecha y hora de la última actualización del registro. |
| Actualizador | `updatedBy` | Registra automáticamente el usuario que actualizó el registro por última vez. |
| Parent ID | `parentId` | Guarda el ID del nodo padre. Normalmente está vacío para los nodos raíz. |
| Parent | `parent` | Campo de relación de varios a uno que apunta al nodo padre de la tabla actual. |
| Children | `children` | Campo de relación de uno a varios que representa los nodos hijos del nodo actual. |
| Espacio | `space` | Disponible después de activar el [plugin de múltiples espacios](../../multi-app/multi-space/index.md), se utiliza para aislar los datos por espacio. No aparece si no se ha activado la función de múltiples espacios. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Atención

Evita que los datos de la tabla de árbol formen relaciones circulares; por ejemplo, que el nodo padre de A sea B y que el nodo padre de B sea A. Las relaciones circulares pueden provocar anomalías en la visualización del árbol y en los resultados de los filtros.

:::

### Campos de clave principal

Al igual que las tablas normales, las tablas de árbol necesitan un campo de clave principal. Los campos de relación jerárquica se vinculan mediante el ID del nodo padre con el registro de clave principal de la misma tabla.

Si una tabla de árbol no tiene una clave principal, debes configurar «Record unique key» al editar la tabla de datos. De lo contrario, es posible que los bloques de página no puedan ver ni editar correctamente los registros y que la visualización del árbol no pueda localizar los nodos de forma estable.

## Uso en la configuración de páginas

Las tablas de árbol pueden utilizar la mayoría de los bloques de datos de las [tablas normales](../data-source-main/general-collection.md) para crear, eliminar, actualizar y consultar datos. Además, pueden utilizarse junto con las funciones de árbol:

| Bloque | Uso |
| --- | --- |
| [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Muestra registros jerárquicos para consultar y mantener la estructura entre padres e hijos. |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Añade o edita un único registro de nodo de árbol. |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Consulta los detalles de un único nodo de árbol. |
| [Bloque de filtro de árbol](../../interface-builder/blocks/filter-blocks/tree.md) | Filtra otros bloques de datos mediante una estructura de árbol, normalmente para filtrar jerarquías de categorías, organizaciones, regiones, etc. |

## Edición de la configuración

En la lista de tablas de datos, haz clic en «Edit» a la derecha de la tabla de árbol para modificar configuraciones como el nombre visible de la tabla de datos, la categoría, la descripción, el modo de paginación simple y «Record unique key».

Por lo general, no se recomienda eliminar ni cambiar arbitrariamente los campos de relación entre padres e hijos de una tabla de árbol para otros usos. Si necesitas ajustar la estructura jerárquica, modifica primero la relación con el nodo padre en los datos de los registros.

## Eliminación de la tabla de datos

En la lista de tablas de datos, haz clic en «Delete» a la derecha de la tabla de árbol para eliminarla.

Eliminar una tabla de árbol elimina los metadatos de Collection, la tabla de datos real y los datos de las relaciones jerárquicas. Antes de eliminarla, confirma si los bloques de página, los bloques de filtro de árbol, los campos de relación, los permisos, los flujos de trabajo y las API siguen dependiendo de ella.

:::danger Advertencia

Las tablas de árbol suelen utilizarse como condiciones de filtro para otros bloques. Después de eliminar una tabla de árbol, es posible que dejen de funcionar los bloques de filtro de árbol relacionados y las configuraciones de página que dependen de esa jerarquía de categorías.

:::

## Enlaces relacionados

- [Tabla normal](../data-source-main/general-collection.md) — Consulta la configuración general y cómo utilizar los bloques
- [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md) — Activa la visualización de la tabla de árbol en una tabla
- [Bloque de filtro de árbol](../../interface-builder/blocks/filter-blocks/tree.md) — Filtra datos mediante una estructura de árbol
- [Múltiples espacios](../../multi-app/multi-space/index.md) — Conoce los campos de espacio y la función de aislamiento por espacio