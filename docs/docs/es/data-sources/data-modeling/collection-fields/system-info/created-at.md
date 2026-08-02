---
title: "Fecha de creación"
description: "El campo de fecha de creación se utiliza para registrar automáticamente la fecha y hora de creación de un registro."
keywords: "fecha de creación,createdAt,campo del sistema,NocoBase"
---

# Fecha de creación

## Introducción

En NocoBase, **Fecha de creación (Created at)** se utiliza para registrar automáticamente la fecha y hora en que se crea un registro.

La fecha de creación normalmente se genera mediante un campo preestablecido. Es adecuada para ordenar, filtrar, auditar, establecer condiciones en flujos de trabajo y realizar estadísticas de datos.

Si necesitas introducir manualmente una fecha de negocio, como la fecha de firma o la fecha de vencimiento, utiliza [Fecha](../datetime/date.md) o [Fecha y hora](../datetime/datetime.md).

## Casos de uso

El campo de fecha de creación es adecuado para los siguientes casos de negocio:

- Ordenar por fecha de creación
- Filtrar los datos creados durante un período determinado
- Auditar la fecha y hora de creación de los registros
- Determinar en un flujo de trabajo la fecha y hora de creación de un registro nuevo

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fecha de creación» para crear un campo de fecha de creación.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para la fecha de creación corresponde a `createdAt` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Fecha de creación» o «Hora de creación». Se recomienda utilizar un nombre que los usuarios de negocio puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de la creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. La fecha de creación normalmente utiliza `date`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Se mantiene automáticamente por el sistema y normalmente no requiere validación manual. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar ajustes de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de fecha de creación es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `createdAt`. |
| Field type predeterminado | `date`. |
| Field type opcional | `date`. |
| Componente de página | El sistema lo completa automáticamente; normalmente se muestra como un campo de solo lectura en la página. |
| Filtrado | Admite el filtrado por fecha y por intervalo. |
| Ordenación | Admite la ordenación por fecha y hora. |
| Validación | El sistema lo completa automáticamente. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de fecha de creación. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | ¿Se puede editar? | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de crear el campo. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El ajuste afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, confirma que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de fecha de creación. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de fecha de creación nuevo en la base de datos principal, normalmente también se elimina la columna correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones, exportaciones y datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

El campo de fecha de creación es adecuado para utilizarlo en listas, detalles, filtros y auditorías.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Mostrar y ordenar por la fecha y hora de creación. |
| Bloque de filtrado | Filtrar los registros creados durante un período determinado. |
| Bloque de detalles | Consultar la fecha y hora de creación del registro. |
| Flujo de trabajo | Participar como condición temporal en una evaluación. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Fecha y hora (con zona horaria)](../datetime/datetime.md) — Guardar fechas y horas de negocio
- [Fecha de actualización](./updated-at.md) — Registrar automáticamente la fecha y hora de actualización