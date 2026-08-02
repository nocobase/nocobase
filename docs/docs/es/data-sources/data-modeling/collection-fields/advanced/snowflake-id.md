---
title: "Snowflake ID"
description: "El campo Snowflake ID se utiliza para generar ID de Snowflake de 53 bits y suele emplearse como clave primaria predeterminada."
keywords: "Snowflake ID,snowflakeId,clave primaria,NocoBase"
---

# Snowflake ID

## Introducción

En NocoBase, **Snowflake ID (Snowflake ID)** se utiliza para generar identificadores únicos.

Snowflake ID es el tipo de clave primaria utilizado habitualmente por el campo ID predeterminado de las tablas normales de NocoBase. Es adecuado como identificador único interno de los registros.

Si necesita un número legible para sistemas externos, utilice una [secuencia](../../../field-sequence/index.md) o un campo de número de negocio.

## Casos de uso

Snowflake ID es adecuado para los siguientes escenarios empresariales:

- Clave primaria predeterminada de las tablas normales
- ID interno de los registros
- Tablas empresariales que necesitan generar ID únicos con alto rendimiento
- Identificadores únicos que no necesitan ser reconocidos manualmente

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haga clic en «Add field» y seleccione «Snowflake ID» para crear un campo Snowflake ID.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Snowflake ID corresponde a `snowflakeId`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «ID», «ID del registro» o «ID interno». Se recomienda utilizar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Por lo general, no se modifica después de la creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Snowflake ID normalmente utiliza `bigInt`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Normalmente se genera automáticamente mediante el sistema y no requiere validación manual. |
| Description | Descripción del campo. Es adecuado indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y las API. Confirme el nombre antes de crearlo para evitar ajustes de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo Snowflake ID es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `snowflakeId`. |
| Field type predeterminado | `bigInt`. |
| Field type opcional | `bigInt`. |
| Componente de página | Normalmente se genera automáticamente y no requiere introducción manual. |
| Filtrado | Admite búsquedas exactas por ID. |
| Ordenación | Admite ordenación. |
| Validación | Normalmente se genera automáticamente y mantiene la unicidad. |

## Edición de la configuración

Después de crear el campo, haga clic en «Edit», a la derecha del campo, para editar la configuración del campo Snowflake ID. La edición del campo se utiliza principalmente para ajustar su forma de visualización y uso en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Esto afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, debe confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirme primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haga clic en «Delete», a la derecha del campo, para eliminar el campo Snowflake ID. En la base de datos principal también puede seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Snowflake ID creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirme si el campo todavía se utiliza en alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo Snowflake ID es adecuado como clave primaria e identificador único interno.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Escenario | Uso |
| --- | --- |
| Creación de tablas | Se utiliza como campo ID predeterminado. |
| Campos de relación | Se utiliza como identificador único de los registros relacionados. |
| API | Se utiliza para localizar un registro individual. |
| Permisos y flujos de trabajo | Participa en el procesamiento interno como identificador único del registro. |

## Enlaces relacionados

- [Campos](../index.md) — Conozca la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Cree y administre campos en tablas normales
- [UUID](./uuid.md) — Utilice UUID como identificador único
- [Nano ID](./nano-id.md) — Utilice ID cortos
- [Secuencias](../../../field-sequence/index.md) — Genere números de negocio
