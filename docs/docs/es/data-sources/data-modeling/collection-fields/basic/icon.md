---
title: "Icono"
description: "El campo de icono se utiliza para guardar nombres o configuraciones de iconos, y es adecuado para identificadores visuales de categorías, menús, estados, etc."
keywords: "icono,icon,campo,NocoBase"
---

# Icono

## Introducción

En NocoBase, el **icono (Icon)** se utiliza para guardar identificadores de iconos.

El campo de icono es adecuado para proporcionar un identificador visual a categorías, menús, estados y entradas. Guarda el valor del icono, que se renderiza mediante el componente de icono cuando se muestra en la página.

Si quieres subir una imagen real, selecciona [Adjunto](../media/field-attachment.md). Si solo quieres guardar una descripción del icono, selecciona [Texto de una línea](./input.md).

## Casos de uso

El campo de icono es adecuado para estos escenarios empresariales:

- Iconos de menú e iconos de entradas de funciones
- Iconos de categorías e iconos de etiquetas
- Iconos de estado e iconos de nivel
- Identificadores visuales en paneles o tarjetas

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Icono» para crear un campo de icono.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para el icono corresponde a `icon`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Icono del menú», «Icono de categoría» o «Icono de estado». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar con una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de icono es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es adecuado indicar su significado, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API después de su creación. Confirma el nombre antes de crearlo para evitar costes de configuración derivados de cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de icono es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `icon`. |
| Field type predeterminado | `string`. |
| Field type disponible | `string`. |
| Componente de página | En el modo de edición se utiliza un componente de selección de iconos. |
| Filtrado | Normalmente no se utiliza como condición de filtrado principal. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de hacerlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Completa el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminarlo. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de icono creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en dicha columna. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de icono es adecuado para proporcionar indicaciones visuales en listas, tarjetas y vistas de detalle.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar un icono. |
| Bloque de detalle | Mostrar un icono. |
| Lista o tarjeta | Utilizarlo como identificador visual de una categoría, un estado o una entrada. |
| Permisos y flujos de trabajo | Normalmente no se utiliza como campo de condición principal. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Color](./color.md) — Guardar identificadores de color
- [Adjunto](../media/field-attachment.md) — Subir imágenes o archivos