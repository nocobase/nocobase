---
title: "Texto multilínea"
description: "El campo de texto multilínea se utiliza para guardar textos más largos, como notas, descripciones, direcciones y opiniones sobre el procesamiento. De forma predeterminada, utiliza el tipo text y un cuadro de entrada multilínea."
keywords: "texto multilínea,textarea,campo de texto,text,NocoBase"
---

# Texto multilínea

## Introducción

En NocoBase, el **texto multilínea (Multi-line text)** se utiliza para guardar contenido textual que requiere saltos de línea o que es relativamente extenso.

El texto multilínea utiliza de forma predeterminada un cuadro de entrada multilínea, por lo que resulta adecuado para notas, descripciones y opiniones sobre el procesamiento. Puede participar en filtros, permisos, condiciones de flujo de trabajo y consultas de API.

Si el contenido normalmente ocupa una sola línea, como un nombre, un número o un título, es más adecuado elegir por defecto el [texto de una línea](./input.md). Si el contenido necesita formato, imágenes o capacidades de texto enriquecido, elige un campo de texto enriquecido o Markdown.

## Casos de uso

El texto multilínea es adecuado para estos escenarios empresariales:

- Notas de clientes, notas de pedidos y opiniones sobre el procesamiento de tickets
- Direcciones detalladas, descripciones de problemas y especificaciones de necesidades
- Resúmenes de cláusulas contractuales y descripciones del contexto del proyecto
- Contenido textual que requiere introducir saltos de línea

## Crear y configurar

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Texto multilínea» para crear un campo de texto multilínea.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El texto multilínea corresponde a `textarea`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Notas del cliente», «Opiniones sobre el procesamiento» o «Dirección detallada». Se recomienda utilizar un nombre que el personal de la empresa pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el texto multilínea es `text`, aunque también puede asignarse a `string` o `json` según el campo de origen. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, este puede completarse automáticamente. |
| Validation rules | Reglas de validación. Permiten limitar la longitud mínima, la longitud máxima, una longitud fija, el uso de mayúsculas o minúsculas, o una expresión regular. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración adicionales debido a cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado de los campos de texto multilínea es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `textarea`. |
| Field type predeterminado | `text`. |
| Field type opcionales | `text`, `json` y `string`. |
| Componente de página | En el modo de edición se utiliza un cuadro de entrada multilínea. |
| Filtrado | Admite filtros de texto, como contiene, no contiene, está vacío y no está vacío. |
| Ordenación | Normalmente no se recomienda utilizarlo para ordenar. La posibilidad de ordenar depende de la base de datos y del tipo de campo concretos. |
| Validación | Admite validaciones de longitud mínima, longitud máxima, longitud fija, mayúsculas y minúsculas, expresiones regulares, etc. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del texto multilínea. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no puede modificarse en el formulario de edición una vez creado. |
| Field interface | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados pueden ajustarse durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados pueden ajustarse durante la asignación de campos. Antes de hacerlo, es necesario confirmar que los datos existentes pueden utilizarse con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Esto afecta a la forma de almacenar los datos, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de texto multilínea. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de texto multilínea creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos de texto multilínea son adecuados para mostrar contenido extenso en formularios y páginas de detalle.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir o editar notas, descripciones, opiniones sobre el procesamiento y otros contenidos. |
| Bloque de detalle | Mostrar contenido textual extenso. |
| Bloque de tabla | Mostrar contenido resumido; el contenido extenso normalmente se omite. |
| Flujos de trabajo y permisos | Participar como campo de condición en las comprobaciones, por ejemplo, para determinar si una nota está vacía. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Texto de una línea](./input.md) — Guardar contenido textual corto de una sola línea
- [Markdown](../media/markdown.md) — Guardar contenido con formato Markdown
- [Texto enriquecido](../media/rich-text.md) — Guardar contenido con formato complejo