---
pkg: "@nocobase/plugin-block-comment"
title: "Bloque de comentarios"
description: "Bloque de comentarios: permite ver y crear comentarios en detalles de registros, ventanas emergentes y escenarios similares, con mapeo de campos, paginación, alcance de datos, ordenación predeterminada y salto automático a la última página."
keywords: "Bloque de comentarios,CommentBlock,tabla de comentarios,mapeo de campos,alcance de datos,ordenación predeterminada,constructor de interfaces,NocoBase"
---

# Bloque de comentarios

## Introducción

El bloque de comentarios agrega capacidades de comentarios a los registros de negocio. Puedes añadirlo a páginas de detalle o ventanas emergentes de tareas, artículos, tickets, clientes y otros registros, para que los usuarios puedan ver, responder y crear comentarios alrededor del registro actual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Consejo

El bloque de comentarios no crea una colección por sí mismo. Antes de usarlo, prepara una colección para guardar comentarios y configura campos como contenido del comentario, autor, propietario del comentario y hora del comentario.

:::

## Añadir un bloque

El bloque de comentarios suele añadirse a la página de detalle o a la ventana emergente de un registro de negocio.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Abre la página de detalle o la ventana emergente del registro objetivo
2. Haz clic en "Añadir bloque"
3. Selecciona "Comentario"
4. Selecciona la colección usada para guardar comentarios
5. Completa el mapeo de campos según las indicaciones

Si el bloque de comentarios se crea desde una asociación, NocoBase intentará identificar automáticamente el campo propietario del comentario y el valor del registro actual según la asociación actual. En este caso, "Campo propietario del comentario" y "Valor del campo propietario del comentario" se rellenan automáticamente y normalmente no necesitan configuración manual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Si el bloque se crea directamente desde la colección de comentarios, debes configurar manualmente el campo propietario del comentario y su valor.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Mapeo de campos

El bloque de comentarios usa "Mapeo de campos" para saber cómo se debe mostrar y guardar cada comentario.

| Configuración | Descripción |
| --- | --- |
| Campo de contenido del comentario | Selecciona el campo que guarda el cuerpo del comentario. |
| Campo de autor del comentario | Selecciona un campo muchos-a-uno asociado a la colección de usuarios. |
| Campo propietario del comentario | Selecciona el campo que guarda el identificador del registro de negocio actual. |
| Valor del campo propietario del comentario | Especifica el valor del registro de negocio actual, por ejemplo `{{ ctx.popup.record.id }}`. |
| Campo de fecha del comentario | Selecciona el campo de hora del comentario, usado para mostrar y ordenar por defecto. |

### Campo propietario del comentario

"Campo propietario del comentario" se usa para filtrar los comentarios del registro actual y también se escribe cuando se crea un comentario nuevo.

Al seleccionarlo manualmente, el desplegable solo muestra campos escalares ordinarios y no muestra campos de asociación. Configuraciones comunes:

| Colección de negocio | Campo propietario en la colección de comentarios | Valor del campo propietario del comentario |
| --- | --- | --- |
| Tareas | `taskId` | `{{ ctx.popup.record.id }}` |
| Artículos | `postId` | `{{ ctx.popup.record.id }}` |
| Tickets | `ticketId` | `{{ ctx.popup.record.id }}` |

Si el registro actual usa un identificador único distinto de `id`, cambia "Valor del campo propietario del comentario" al campo correspondiente, por ejemplo `{{ ctx.popup.record.uuid }}`.

### Mapeo automático desde asociaciones

Si el bloque se crea desde una asociación del registro de negocio, el bloque de comentarios usa prioritariamente el campo de clave foránea de esa asociación como campo propietario del comentario, y usa el valor del registro actual como valor del campo propietario del comentario.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Por ejemplo, si existe una asociación uno-a-muchos entre la colección de tareas y la colección de comentarios de tareas, y el campo de clave foránea en la colección de comentarios de tareas es `taskId`, al añadir un bloque de comentarios desde la asociación en la página de detalle de la tarea, el bloque usa automáticamente:

- Campo propietario del comentario: `taskId`
- Valor del campo propietario del comentario: el identificador del registro de tarea actual

Este método es adecuado para la mayoría de los escenarios y reduce errores de configuración manual.

## Configuración del bloque

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Tamaño de página

Define cuántos comentarios se muestran por página. Los valores disponibles incluyen `5`, `10`, `20`, `50`, `100` y `200`.

### Alcance de datos

Define el alcance de filtrado de datos para la lista de comentarios. Puedes añadir más condiciones aquí, como mostrar solo comentarios que coincidan con ciertos estados o condiciones de permisos.

Para más detalles, consulta [Establecer alcance de datos](../block-settings/data-scope.md).

### Regla de ordenación predeterminada

Define la ordenación predeterminada de la lista de comentarios. Normalmente puedes ordenar por el campo de fecha del comentario en orden ascendente o descendente.

Si no se configura una regla de ordenación predeterminada por separado, el bloque de comentarios prioriza el "Campo de fecha del comentario" como campo de ordenación predeterminado.

Para más detalles, consulta [Establecer regla de ordenación](../block-settings/sorting-rule.md).

### Saltar automáticamente a la última página

Está desactivado por defecto. Cuando está desactivado, el bloque de comentarios permanece en la primera página después de abrirse.

Cuando está activado, el bloque de comentarios salta a la última página en la primera carga. Es adecuado cuando quieres que los usuarios vean primero los comentarios más recientes.
