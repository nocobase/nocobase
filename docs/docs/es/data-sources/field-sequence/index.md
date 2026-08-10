---
title: "Secuencia"
description: "El campo de secuencia se utiliza para generar números de negocio incrementales o generados según reglas."
keywords: "secuencia,sequence,número, numeración automática,NocoBase"
---

# Secuencia

## Introducción

En NocoBase, **Secuencia (Sequence)** se utiliza para generar números de negocio.

El campo de secuencia es adecuado para números de pedido, contrato, orden de trabajo, solicitud y otros identificadores que requieren reglas legibles. A diferencia de la clave primaria, está más orientado a la presentación empresarial y a la identificación manual.

Si solo necesitas un identificador único interno, utiliza Snowflake ID, UUID o Nano ID.

## Casos de uso

La secuencia es adecuada para estos escenarios empresariales:

- Números de pedido y contrato
- Números de orden de trabajo y solicitud
- Identificadores de activos y equipos
- Números con prefijos, fechas o reglas incrementales

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Secuencia» para crear un campo de secuencia.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La secuencia corresponde a `sequence` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Número de pedido», «Número de contrato» o «Número de orden de trabajo». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El tipo de almacenamiento de un campo de secuencia depende de la regla de secuencia y normalmente es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Normalmente se generan según las reglas del sistema y no requieren validación manual. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma la nomenclatura antes de crearlo para evitar costes de ajuste de configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado de los campos de secuencia es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `sequence`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string`, `integer`, según la configuración de secuencia real. |
| Componente de página | Normalmente se genera automáticamente y se utiliza después de configurar la regla de numeración. |
| Filtrado | Admite búsquedas exactas por número o filtrado de texto. |
| Ordenación | La idoneidad para ordenar depende de la regla de numeración. |
| Validación | Depende de la regla de secuencia y normalmente mantiene la unicidad. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El ajuste afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de secuencia. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de secuencia creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos de secuencia son adecuados para escenarios de números de negocio y búsquedas manuales.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Escenario | Uso |
| --- | --- |
| Crear registros | Generar automáticamente números de negocio. |
| Bloques de tabla | Mostrar, buscar y filtrar números. |
| Bloques de detalles | Utilizarlo como identificador legible del registro. |
| Flujos de trabajo y notificaciones | Referenciar el número de negocio en aprobaciones y notificaciones. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../data-source-main/general-collection.md) — Crear y administrar campos en tablas normales
- [Texto de una sola línea](../data-modeling/collection-fields/basic/input.md) — Mantener manualmente números de negocio
- [Snowflake ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Utilizar un ID de clave primaria interna