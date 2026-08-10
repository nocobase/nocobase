---
title: "Texto enriquecido"
description: "El campo de texto enriquecido se utiliza para guardar contenido con formato, como estilos, imágenes y enlaces."
keywords: "Texto enriquecido,rich text,campo de contenido,NocoBase"
---

# Texto enriquecido

## Introducción

En NocoBase, el **texto enriquecido (Rich text)** se utiliza para guardar contenido con formato.

El campo de texto enriquecido es adecuado para el cuerpo de anuncios, artículos y plantillas de correo electrónico, así como para documentos de instrucciones. Ofrece una experiencia de edición más cercana a la de «lo que ves es lo que obtienes».

Si el equipo está acostumbrado a Markdown o necesita controlar el formato mediante texto sin formato, elige [Markdown](./markdown.md) o [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Casos de uso

El texto enriquecido es adecuado para estos escenarios empresariales:

- Cuerpo de anuncios y artículos
- Plantillas de correo electrónico y notificaciones
- Descripciones de productos e instrucciones de uso
- Contenido que requiere imágenes, enlaces y estilos

## Crear y configurar

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Texto enriquecido» para crear un campo de texto enriquecido.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El texto enriquecido corresponde a `richText`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Cuerpo del anuncio», «Plantilla de correo electrónico» o «Descripción del producto». Se recomienda utilizar un nombre que el personal de negocio pueda comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos de texto enriquecido normalmente utilizan `text` para guardar el contenido. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Permiten limitar la longitud o exigir que el campo sea obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma la nomenclatura antes de crearlo para evitar costes de configuración posteriores debido a modificaciones.

:::

## Características del campo

El comportamiento predeterminado del campo de texto enriquecido es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `richText`. |
| Field type predeterminado | `text`. |
| Field type opcional | `text`. |
| Componente de página | En el modo de edición se utiliza un editor de texto enriquecido. |
| Filtrado | Admite filtros de texto, como contiene, está vacío y no está vacío. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones de texto, como longitud y obligatoriedad. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Admite modificaciones según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en las páginas. |
| Field type | Admite modificaciones según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenar los datos, al componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de texto enriquecido. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de texto enriquecido creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de texto enriquecido es adecuado para escenarios de edición y visualización de contenido.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Editar contenido de texto enriquecido. |
| Bloque de detalles | Mostrar el contenido con formato de texto enriquecido. |
| Plantillas de correo electrónico o notificaciones | Utilizarlo como fuente del cuerpo de la plantilla. |
| Bloque de tabla | Mostrar un resumen o contenido simplificado. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Markdown](./markdown.md) — Guardar contenido Markdown
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Utilizar Vditor para editar Markdown