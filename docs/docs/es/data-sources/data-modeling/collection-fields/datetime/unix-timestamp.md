---
title: "Marca de tiempo Unix"
description: "El campo de marca de tiempo Unix se utiliza para guardar valores de marcas de tiempo de sistemas externos."
keywords: "marca de tiempo Unix,unix timestamp,marca de tiempo,NocoBase"
---

# Marca de tiempo Unix

## Introducción

En NocoBase, la **marca de tiempo Unix (Unix timestamp)** se utiliza para guardar marcas de tiempo Unix.

Las marcas de tiempo Unix se utilizan habitualmente para integrar sistemas externos, gestionar datos de registros o migrar datos históricos. Se almacenan como valores numéricos, pero su significado de negocio es temporal.

Si no existe ningún requisito de marca de tiempo por parte de un sistema externo, usar directamente [fecha y hora](./datetime.md) resulta más fácil de comprender y mantener.

## Casos de uso

Las marcas de tiempo Unix son adecuadas para estos escenarios de negocio:

- Marcas de tiempo sincronizadas con sistemas externos
- Hora en que se producen los registros
- Unix timestamp devuelto por una interfaz
- Campos de fecha y hora durante la migración de datos históricos

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Unix 时间戳» para crear un campo de marca de tiempo Unix.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La marca de tiempo Unix corresponde a `unixTimestamp`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Marca de tiempo de sincronización», «Hora del registro» o «Hora de actualización externa». Se recomienda usar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Por lo general, no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Las marcas de tiempo Unix suelen almacenarse como enteros o enteros grandes. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Reglas de validación. Se pueden configurar como obligatorio y establecer un rango de valores numéricos. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes posteriores de ajuste de la configuración.

:::

## Características del campo

El comportamiento predeterminado del campo de marca de tiempo Unix es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `unixTimestamp`. |
| Field type predeterminado | `bigInt`. |
| Field type disponibles | `integer`, `bigInt`. |
| Componente de página | En el modo de edición, se gestiona mediante el componente de campo de marca de tiempo. |
| Filtrado | Admite el filtrado por el valor numérico de la marca de tiempo o por el intervalo de tiempo correspondiente. |
| Ordenación | Admite ordenación. |
| Validación | Admite la validación de campos obligatorios y de rangos numéricos. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo de marca de tiempo Unix en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición suele consistir en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Se puede ajustar al asignar campos de la base de datos principal o de campos sincronizados. El cambio afecta a la forma de introducir, mostrar y validar los datos en las páginas. |
| Field type | Según las condiciones | Se puede ajustar al asignar campos de la base de datos principal o de campos sincronizados. Antes de realizar el cambio, hay que confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre visible. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizarlo como variable en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de marca de tiempo Unix. En la base de datos principal también puedes seleccionar varios campos y eliminarlos en lote.

Al eliminar un campo de marca de tiempo Unix creado en la base de datos principal, normalmente también se eliminan la columna correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, los formularios, los filtros, los permisos, los flujos de trabajo, la API, la importación y exportación, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

Los campos de marca de tiempo Unix son adecuados para integraciones con sistemas externos y escenarios relacionados con registros.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir o asignar una marca de tiempo. |
| Bloque de tabla | Mostrar, ordenar y filtrar marcas de tiempo. |
| Flujo de trabajo | Utilizarlo como condición temporal de un sistema externo. |
| API | Integrar interfaces que requieren un Unix timestamp. |

## Enlaces relacionados

- [Campo](../index.md) — Consulta la función, las categorías y la lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Fecha y hora (con zona horaria)](./datetime.md) — Guardar fechas y horas normales
- [Entero](../basic/integer.md) — Guardar enteros normales