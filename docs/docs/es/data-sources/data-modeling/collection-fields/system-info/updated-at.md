---
title: "Fecha de actualización"
description: "El campo Fecha de actualización se utiliza para registrar automáticamente la última vez que se actualizó un registro."
keywords: "Fecha de actualización,updatedAt,campo del sistema,NocoBase"
---

# Fecha de actualización

## Introducción

En NocoBase, **Fecha de actualización (Updated at)** se utiliza para registrar automáticamente la última vez que se actualizó un registro.

La fecha de actualización normalmente se genera mediante un campo predefinido. Es adecuada para auditorías, comprobaciones de sincronización, ordenación, filtrado y condiciones de flujos de trabajo.

Si necesitas guardar la fecha de finalización, la fecha de aprobación u otros tiempos relacionados con el negocio, utiliza [Fecha y hora](../datetime/datetime.md).

## Casos de uso

La fecha de actualización es adecuada para estos casos de uso:

- Consultar la última fecha de actualización
- Filtrar los datos actualizados recientemente
- Determinar si los datos llevan mucho tiempo sin mantenerse
- Comparar las fechas de actualización al sincronizar con sistemas externos

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fecha de actualización» para crear un campo de fecha de actualización.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Fecha de actualización corresponde a `updatedAt`, que determina cómo se introduce y muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Fecha de actualización» o «Última actualización». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. La fecha de actualización normalmente utiliza `date`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no lo introduce, se puede completar automáticamente. |
| Validation rules | Se mantiene automáticamente por el sistema y normalmente no requiere validación manual. |
| Description | Descripción del campo. Es adecuado indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y la API después de su creación. Confirma el nombre antes de crearlo para evitar costes de configuración derivados de cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo Fecha de actualización es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `updatedAt`. |
| Field type predeterminado | `date`. |
| Field type opcional | `date`. |
| Componente de página | El sistema lo completa automáticamente; normalmente solo se muestra como de solo lectura en la página. |
| Filtrado | Permite filtrar por fecha y por intervalos. |
| Ordenación | Permite ordenar por fecha. |
| Validación | El sistema lo completa automáticamente. |

## Editar configuración

Después de crearlo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo Fecha de actualización. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo Fecha de actualización. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Fecha de actualización creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, la API, las importaciones y exportaciones, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo Fecha de actualización es adecuado para utilizarlo en listas, detalles, filtros y comprobaciones de sincronización.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Mostrar y ordenar por la última fecha de actualización. |
| Bloque de filtro | Filtrar registros actualizados recientemente o que no se hayan actualizado durante mucho tiempo. |
| Bloque de detalles | Consultar la última fecha de actualización. |
| Flujo de trabajo | Participar como condición temporal en una evaluación. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Fecha de creación](./created-at.md) — Registrar automáticamente la fecha de creación
- [Fecha y hora (con zona horaria)](../datetime/datetime.md) — Guardar tiempos relacionados con el negocio.