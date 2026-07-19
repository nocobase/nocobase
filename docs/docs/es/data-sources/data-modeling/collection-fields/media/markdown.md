---
title: "Markdown"
description: "El campo Markdown se utiliza para guardar contenido de texto con sintaxis Markdown."
keywords: "Markdown,markdown,campo de contenido,NocoBase"
---

# Markdown

## Introducción

En NocoBase, **Markdown (Markdown)** se utiliza para guardar contenido en formato Markdown.

El campo Markdown es adecuado para documentos explicativos, procedimientos de resolución, contenido principal de bases de conocimiento, registros de cambios y otros contenidos. Guarda texto y, al mostrarse en la página, se renderiza en formato Markdown.

Si necesitas una experiencia de edición WYSIWYG, puedes elegir [Texto enriquecido](./rich-text.md) o [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Escenarios de uso

Markdown es adecuado para los siguientes escenarios empresariales:

- Contenido principal de bases de conocimiento y documentos explicativos
- Procedimientos de resolución y registros de diagnóstico
- Notas de publicación y registros de cambios
- Contenido de texto extenso que requiere un formato ligero

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Markdown» para crear un campo Markdown.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Markdown corresponde a `markdown` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Documento explicativo», «Procedimiento de resolución» o «Contenido principal». Se recomienda utilizar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos Markdown normalmente utilizan `text` para guardar el contenido. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Permiten limitar la longitud o exigir que el campo sea obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores derivados de cambios.

:::

## Características del campo

El comportamiento predeterminado de los campos Markdown es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `markdown`. |
| Field type predeterminado | `text`. |
| Field type opcionales | `text` y `string`, según la configuración real del campo. |
| Componente de página | En el modo de edición se utiliza el componente de edición Markdown. |
| Filtrado | Admite filtros de tipo texto, como contiene, está vacío y no está vacío. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones de texto, como longitud y obligatoriedad. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Esto afecta a la forma de almacenamiento del campo, al componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminarlo. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Markdown creado en la base de datos principal, normalmente también se elimina la columna real correspondiente en la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos Markdown son adecuados para la edición de contenido y la visualización detallada.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Editar contenido Markdown. |
| Bloque de detalles | Mostrar el contenido renderizado en Markdown. |
| Bloque de tabla | Mostrar un resumen del contenido. |
| Flujo de trabajo | Utilizar el contenido principal para generar notificaciones o documentos. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Editar Markdown con Vditor
- [Texto enriquecido](./rich-text.md) — Editar contenido con texto enriquecido
- [Texto multilínea](../basic/textarea.md) — Guardar contenido de texto largo sin formato
