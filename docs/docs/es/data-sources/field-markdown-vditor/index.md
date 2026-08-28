---
title: "Markdown Vditor"
description: "El campo Markdown Vditor permite guardar contenido Markdown mediante el editor Vditor."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Introducción

En NocoBase, **Markdown Vditor（Markdown Vditor）** se utiliza para editar contenido Markdown con el editor Vditor.

Markdown Vditor es adecuado para contenidos que requieren una experiencia de edición Markdown más completa, como el contenido de comentarios, el contenido principal de una base de conocimientos y las descripciones de soluciones.

Si solo necesitas una edición Markdown sencilla, puedes elegir [Markdown](../data-modeling/collection-fields/media/markdown.md). Si necesitas una experiencia de edición de texto enriquecido WYSIWYG, elige [Texto enriquecido](../data-modeling/collection-fields/media/rich-text.md).

## Casos de uso

Markdown Vditor es adecuado para los siguientes casos de uso:

- Contenido de comentarios y debates
- Contenido principal de bases de conocimientos y descripciones de soluciones
- Textos largos con formato Markdown
- Contenido que requiere funciones de vista previa y edición

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Markdown Vditor» para crear un campo Markdown Vditor.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Markdown Vditor corresponde a `vditor` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Contenido del comentario», «Contenido principal de la base de conocimientos» o «Descripción de la solución». Se recomienda utilizar un nombre que los usuarios de negocio puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de la creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos Markdown Vditor normalmente utilizan `text` para guardar el contenido. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, este puede completarse automáticamente. |
| Validation rules | Reglas de validación. Permiten limitar la longitud o exigir que el campo sea obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar posteriores ajustes de configuración.

:::

## Características del campo

El comportamiento predeterminado de los campos Markdown Vditor es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `vditor`. |
| Field type predeterminado | `text`. |
| Field type opcional | `text`. |
| Componente de página | En el modo de edición se utiliza el editor MarkdownVditor. |
| Filtrado | Admite filtros de texto, como contiene, está vacío y no está vacío. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones de texto, como longitud y obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, normalmente la edición consiste en realizar una asignación de campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no puede modificarse en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados pueden ajustarse durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados pueden ajustarse durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes puedan utilizarse con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Esto afecta al modo de almacenamiento del campo, al componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo Markdown Vditor. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos en lote.

Al eliminar un campo Markdown Vditor creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, la API, las importaciones y exportaciones, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

Los campos Markdown Vditor son adecuados para utilizarse en contenidos principales y comentarios que requieren una experiencia de edición.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Caso de uso | Finalidad |
| --- | --- |
| Bloque de formulario | Utilizar Vditor para editar contenido Markdown. |
| Bloque de detalles | Renderizar y mostrar contenido Markdown. |
| Bloque de comentarios | Guardar el contenido principal de un comentario. |
| Flujo de trabajo | Utilizar el contenido principal para generar notificaciones o documentos. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Guardar contenido Markdown
- [Texto enriquecido](../data-modeling/collection-fields/media/rich-text.md) — Guardar contenido de texto enriquecido
