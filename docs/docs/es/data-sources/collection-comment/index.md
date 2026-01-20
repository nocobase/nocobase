---
pkg: "@nocobase/plugin-comments"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Colección de Comentarios

## Introducción

La colección de comentarios es una plantilla de tabla de datos especializada, diseñada para almacenar los comentarios y la retroalimentación de los usuarios. Con esta función, usted puede añadir capacidades de comentarios a cualquier tabla de datos, permitiendo a los usuarios discutir, proporcionar retroalimentación o anotar registros específicos. La colección de comentarios soporta la edición de texto enriquecido, lo que le brinda capacidades flexibles para la creación de contenido.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Características

- **Edición de texto enriquecido**: Incluye el editor Markdown (vditor) por defecto, soportando la creación de contenido de texto enriquecido.
- **Asociación con cualquier tabla de datos**: Puede asociar comentarios con registros en cualquier tabla de datos a través de campos de relación.
- **Comentarios multinivel**: Soporta la respuesta a comentarios, construyendo una estructura de árbol de comentarios.
- **Seguimiento de usuario**: Registra automáticamente el creador del comentario y la hora de creación.

## Guía de usuario

### Creación de una colección de comentarios

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Vaya a la página de gestión de tablas de datos.
2. Haga clic en el botón "Crear colección".
3. Seleccione la plantilla "Colección de comentarios".
4. Introduzca el nombre de la tabla (por ejemplo, "Comentarios de tareas", "Comentarios de artículos", etc.).
5. El sistema creará automáticamente una tabla de comentarios con los siguientes campos predeterminados:
   - Contenido del comentario (tipo Markdown vditor)
   - Creado por (vinculado a la tabla de usuarios)
   - Fecha de creación (tipo fecha y hora)

### Configuración de relaciones

Para que los comentarios puedan vincularse a una tabla de datos de destino, usted necesita configurar los campos de relación:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Añada un campo de relación "Muchos a uno" en la tabla de comentarios.
2. Seleccione la tabla de datos de destino a la que desea vincular (por ejemplo, tabla de tareas, tabla de artículos, etc.).
3. Establezca el nombre del campo (por ejemplo, "Tarea asociada", "Artículo asociado", etc.).

### Uso de bloques de comentarios en las páginas

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Vaya a la página donde desea añadir la funcionalidad de comentarios.
2. Añada un bloque en los detalles o en la ventana emergente del registro de destino.
3. Seleccione el tipo de bloque "Comentarios".
4. Elija la colección de comentarios que acaba de crear.

### Casos de uso típicos

- **Sistemas de gestión de tareas**: Los miembros del equipo discuten y proporcionan retroalimentación sobre las tareas.
- **Sistemas de gestión de contenido**: Los lectores comentan e interactúan con los artículos.
- **Flujos de trabajo de aprobación**: Los aprobadores anotan y proporcionan opiniones sobre los formularios de solicitud.
- **Retroalimentación del cliente**: Recopile las valoraciones de los clientes sobre productos o servicios.

## Consideraciones

- La colección de comentarios es una característica de un plugin comercial y requiere que el plugin de comentarios esté habilitado para su uso.
- Se recomienda establecer los permisos adecuados para la tabla de comentarios para controlar quién puede ver, crear y eliminar comentarios.
- Para escenarios con un gran número de comentarios, se recomienda habilitar la paginación para mejorar el rendimiento.