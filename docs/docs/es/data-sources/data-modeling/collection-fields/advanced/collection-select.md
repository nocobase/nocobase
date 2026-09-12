---
title: "Selector de tablas de datos"
description: "El campo selector de tablas de datos se utiliza para seleccionar tablas de datos en NocoBase."
keywords: "selector de tablas de datos,collection select,Collection,NocoBase"
---

# Selector de tablas de datos

## Introducción

En NocoBase, el **selector de tablas de datos (Collection select)** se utiliza para seleccionar una o varias tablas de datos.

El selector de tablas de datos es adecuado para escenarios como la configuración de plugins, la configuración de reglas y la gestión de metadatos. Guarda el identificador de la tabla de datos, no los registros de negocio.

Si quieres seleccionar registros de una tabla concreta, debes utilizar un campo de relación en lugar de un selector de tablas de datos.

## Casos de uso

El selector de tablas de datos es adecuado para estos escenarios empresariales:

- Seleccionar la tabla de datos de destino en la configuración de plugins
- Especificar el alcance de las tablas de datos en la configuración de reglas
- Gestión de metadatos y configuración de plantillas
- Configuración de funciones que necesitan hacer referencia al identificador de una Collection

## Crear la configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Selector de tablas de datos» para crear un campo selector de tablas de datos.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El selector de tablas de datos corresponde a `collectionSelect`, que determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Tabla de datos de destino», «Tabla de datos objetivo» o «Ámbito de datos». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Por lo general, no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El selector de tablas de datos normalmente guarda el identificador de la tabla de datos; el tipo de almacenamiento depende de la configuración real. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Normalmente se configura si el campo es obligatorio o el rango de selección permitido. |
| Description | Descripción del campo. Es adecuado incluir el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API después de su creación. Confirma el nombre antes de crearlo para evitar costes de ajuste de la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado de los campos selectores de tablas de datos es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `collectionSelect`. |
| Field type predeterminado | `string`. |
| Field type disponible | `string`, `json`, según la configuración real. |
| Componente de página | En el modo de edición se utiliza el componente de selección de tablas de datos. |
| Filtrado | Normalmente no se utiliza como campo de filtrado de negocio. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Con condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Con condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Afectará al modo de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo selector de tablas de datos. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo selector de tablas de datos creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración de negocio.

:::

## Uso en la configuración de páginas

El selector de tablas de datos es adecuado para utilizarse en formularios de configuración.

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar una o varias tablas de datos. |
| Bloque de detalles | Mostrar las tablas de datos seleccionadas. |
| Configuración de plugins | Especificar el alcance de las tablas de datos sobre las que actúa la función. |
| Flujo de trabajo o regla | Participar en la lógica como configuración de metadatos. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Tabla normal](../../../data-source-main/general-collection.md) — Conoce cómo se utiliza una Collection
- [Campo de relación](../associations/index.md) — Selecciona registros de una tabla concreta