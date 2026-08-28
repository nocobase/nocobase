---
pkg: "@nocobase/plugin-comments"
title: "Tabla de comentarios"
description: "La tabla de comentarios almacena comentarios, respuestas y comentarios de los registros empresariales, y admite contenido enriquecido, seguimiento de usuarios, comentarios multinivel y bloques de comentarios."
keywords: "tabla de comentarios,función de comentarios,comentarios enriquecidos,comentarios multinivel,Collection Comment,NocoBase"
---

# Tabla de comentarios

## Introducción

La tabla de comentarios es adecuada para guardar debates, comentarios y anotaciones relacionados con registros empresariales. Por ejemplo, los comentarios de tareas, las opiniones de aprobación, los comentarios de artículos y los comentarios de clientes pueden almacenarse en una tabla de comentarios.

La tabla de comentarios normalmente no se utiliza como tabla principal del negocio de forma independiente. Lo más habitual es crear primero la tabla de comentarios, configurar después los campos de relación en la tabla empresarial y, por último, añadir un bloque de comentarios en los detalles o en el cuadro de diálogo del registro empresarial.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Casos de uso

La tabla de comentarios es adecuada para los siguientes escenarios empresariales:

- Debates de colaboración sobre tareas, requisitos y errores
- Opiniones sobre la gestión de solicitudes de aprobación, tickets y contratos
- Comentarios sobre artículos, bases de conocimiento y anuncios
- Comentarios de clientes, seguimiento posventa y notas internas

## Flujo de uso

La tabla de comentarios suele utilizarse junto con una tabla empresarial y un bloque de comentarios:

1. Crea una tabla de comentarios para almacenar el contenido de los comentarios, las relaciones de respuesta, el creador, la fecha de creación y otra información.
2. Crea un campo de relación en la tabla empresarial para vincularlo con la tabla de comentarios. Por ejemplo, vincula la tabla «Tareas» con la tabla «Comentarios de tareas».
3. Añade un bloque de comentarios en la página de detalles o en el cuadro de diálogo de la tabla empresarial.
4. Los usuarios publican comentarios o respuestas en el bloque de comentarios. Los datos de los comentarios se escriben en la tabla de comentarios y se vinculan con el registro empresarial actual.
5. Configura los permisos de la tabla de comentarios según las necesidades empresariales para controlar quién puede ver, crear o eliminar comentarios.

## Crear configuración

En la base de datos principal, haz clic en «Create collection» y selecciona «Comment collection» para crear una tabla de comentarios.

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que la tabla de datos se muestra en la interfaz, por ejemplo, «Comentarios de tareas», «Opiniones de aprobación» o «Comentarios de artículos». |
| Collection name | Nombre identificativo de la tabla de datos, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. |
| Inherits | Selecciona la tabla principal que se heredará. Solo es visible cuando la base de datos principal es PostgreSQL. |
| Categories | Categorías de la tabla de datos. Las categorías solo afectan a la organización de la interfaz de gestión de tablas de datos y no modifican la estructura de la tabla. |
| Description | Descripción de la tabla de datos. Puedes indicar a qué objeto empresarial presta servicio esta tabla de comentarios, quién la mantiene y cómo se diseñan los permisos de comentarios. |
| Preset fields | Campos preestablecidos. Al crear una tabla de comentarios, se recomienda conservar los campos del sistema y los campos integrados de la tabla de comentarios. |

### Campos integrados

Después de crear una tabla de comentarios, normalmente incluye los siguientes campos integrados. El bloque de comentarios depende principalmente de `content`, `createdBy` y `createdAt` para mostrar el contenido del comentario, el autor y la hora del comentario.

| Campo | Nombre del campo | Descripción |
| --- | --- | --- |
| ID | `id` | Campo de clave primaria predeterminado, utilizado para identificar de forma única un registro de comentario. |
| Contenido del comentario | `content` | Almacena el texto del comentario introducido por el usuario y utiliza Markdown Vditor de forma predeterminada. |
| Fecha de creación | `createdAt` | Registra automáticamente la fecha de creación del comentario; el bloque de comentarios la utiliza para mostrar la hora del comentario. |
| Creador | `createdBy` | Registra automáticamente al usuario que publicó el comentario; el bloque de comentarios lo utiliza para mostrar el autor. |
| Fecha de actualización | `updatedAt` | Registra automáticamente la fecha de la última actualización del comentario. |
| Actualizador | `updatedBy` | Registra automáticamente al usuario que actualizó el comentario por última vez. |
| Espacio | `space` | Disponible después de habilitar el [plugin de múltiples espacios](../../multi-app/multi-space/index.md), y se utiliza para aislar los datos por espacio. No aparece si no se han habilitado los múltiples espacios. |

:::warning Atención

Los campos integrados de la tabla de comentarios suelen ser gestionados por el bloque de comentarios; no se recomienda eliminarlos ni cambiar arbitrariamente su significado empresarial. Si necesitas guardar información como la categoría o el estado de gestión del comentario, puedes añadir campos empresariales.

:::

### Campo de clave primaria

Al igual que las tablas normales, la tabla de comentarios necesita un campo de clave primaria. El bloque de comentarios utiliza la clave primaria para localizar los registros de comentarios y las relaciones de respuesta.

Si la tabla de comentarios no tiene una clave primaria, debes configurar «Record unique key» al editar la tabla de datos; de lo contrario, es posible que el bloque de comentarios no pueda ver, responder o eliminar comentarios correctamente.

## Establecer relaciones
Crea un campo de relación en la tabla empresarial para vincularlo con la tabla de comentarios
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Configuración y uso en páginas

La tabla de comentarios suele utilizarse mediante un bloque de comentarios. Puedes añadir un bloque de comentarios en la página de detalles, el cuadro de diálogo o la página de registros de la tabla empresarial para que los usuarios publiquen comentarios relacionados con el registro actual.

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Ubicación de configuración | Uso |
| --- | --- |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Muestra la entrada de comentarios en los detalles del registro empresarial. |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Utiliza el campo de relación de comentarios junto con el proceso de edición de la tabla empresarial. |
| Bloque de comentarios | Muestra la lista de comentarios y permite publicar y responder comentarios. |

## Editar configuración

En la lista de tablas de datos, haz clic en «Edit», a la derecha de la tabla de comentarios, para modificar configuraciones como el nombre mostrado de la tabla de datos, las categorías, la descripción, el modo de paginación simple y «Record unique key».

Una vez puesta en producción la tabla de comentarios, no se recomienda modificar arbitrariamente el campo de contenido de los comentarios ni el campo de relación de respuestas. El bloque de comentarios, los permisos, los flujos de trabajo y la API pueden depender de estos campos.

## Eliminar la tabla de datos

En la lista de tablas de datos, haz clic en «Delete», a la derecha de la tabla de comentarios, para eliminarla.

Al eliminar la tabla de comentarios, se eliminarán los registros de comentarios, las relaciones de respuesta y los metadatos relacionados de la colección. Antes de eliminarla, confirma si los campos de relación de las tablas empresariales, los bloques de comentarios, los permisos, los flujos de trabajo y la API siguen dependiendo de ella.

:::danger Advertencia

Eliminar la tabla de comentarios hará que los registros empresariales existentes pierdan sus datos de comentarios. Los comentarios suelen contener el historial de colaboración y las opiniones de gestión; antes de realizar esta operación, confirma si es necesario hacer una copia de seguridad o archivarlos.

:::

## Enlaces relacionados

- [Tabla normal](../data-source-main/general-collection.md) — Consulta la configuración general y el uso de los bloques
- [Campos de relación](../data-modeling/collection-fields/associations/index.md) — Conoce cómo se relacionan las tablas empresariales con la tabla de comentarios
- [Plugin de comentarios](../../plugins/@nocobase/plugin-comments/index.md) — Consulta el bloque de comentarios y sus funciones
- [Múltiples espacios](../../multi-app/multi-space/index.md) — Conoce el campo de espacio y las funciones de aislamiento por espacio