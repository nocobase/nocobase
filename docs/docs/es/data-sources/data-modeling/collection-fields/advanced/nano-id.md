---
title: "Nano ID"
description: "El campo Nano ID se utiliza para generar identificadores únicos aleatorios más cortos."
keywords: "Nano ID,nanoid,identificador único,NocoBase"
---

# Nano ID

## Introducción

En NocoBase, **Nano ID (Nano ID)** se utiliza para generar ID únicos aleatorios y cortos.

Nano ID es adecuado para escenarios que requieren identificadores de cadena más cortos, como enlaces cortos, números públicos e ID de referencia externos.

Si se va a utilizar como clave primaria interna predeterminada, Snowflake ID suele ser una opción más directa. Si se necesita un número de negocio legible, elige [Secuencia](../../../field-sequence/index.md).

## Escenarios aplicables

Nano ID es adecuado para estos escenarios empresariales:

- Identificadores de enlaces cortos
- ID públicos para compartir
- Números de referencia externos
- Cadenas únicas aleatorias más cortas

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Nano ID» para crear un campo Nano ID.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Nano ID corresponde a `nanoId`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «ID de uso compartido», «ID público» o «identificador corto». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Nano ID utiliza `string` de forma predeterminada. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Normalmente se genera automáticamente y no requiere validación manual. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración adicionales debido a cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo Nano ID es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `nanoId`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string`. |
| Componente de página | Normalmente se genera automáticamente y no requiere introducción manual. |
| Filtrado | Admite búsquedas exactas por Nano ID. |
| Ordenación | Normalmente no se utiliza Nano ID para la ordenación empresarial. |
| Validación | Normalmente se genera automáticamente y se mantiene la unicidad. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración de Nano ID. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatibilidad condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatibilidad condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de realizar el cambio, confirma que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Completa el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Afecta al modo de almacenamiento del campo, al componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo Nano ID. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Nano ID creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo Nano ID es adecuado para identificadores públicos cortos y escenarios de referencia externa.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Normalmente no se edita manualmente; el sistema lo genera. |
| Bloque de detalles | Muestra el identificador corto. |
| API | Se utiliza como identificador público del registro. |
| Enlaces externos | Se utiliza como parte de un enlace corto o de uso compartido. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, las categorías y la lógica de mapeo de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Snowflake ID](./snowflake-id.md) — Utiliza el ID interno predeterminado
- [UUID](./uuid.md) — Utiliza UUID
- [Secuencia](../../../field-sequence/index.md) — Genera números de negocio legibles
