---
title: "Fecha y hora (con zona horaria)"
description: "El campo de fecha y hora (con zona horaria) se utiliza para guardar fechas y horas con semántica de zona horaria."
keywords: "fecha y hora,datetime,zona horaria,NocoBase"
---

# Fecha y hora (con zona horaria)

## Introducción

En NocoBase, **Fecha y hora (con zona horaria) (Date time with timezone)** se utiliza para guardar fechas y horas y procesarlas según la semántica de la zona horaria.

La fecha y hora (con zona horaria) es adecuada para la colaboración entre distintas zonas horarias, negocios internacionales o escenarios que requieren un punto temporal claro, como crear reservas, definir fechas límite o programar ejecuciones.

Si el negocio solo necesita texto de hora local y no requiere conversiones de zona horaria, puedes elegir [Fecha y hora (sin zona horaria)](./datetime-without-tz.md). Si solo necesitas la fecha, elige [Fecha](./date.md).

## Casos de uso

La fecha y hora (con zona horaria) es adecuada para estos escenarios de negocio:

- Hora de inicio de reuniones y hora de reservas
- Fechas límite y horas de ejecución de tareas
- Puntos temporales en negocios entre distintas zonas horarias
- Horas relacionadas con condiciones programadas de flujos de trabajo

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fecha y hora (con zona horaria)» para crear un campo de fecha y hora (con zona horaria).

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Fecha y hora (con zona horaria) corresponde a `datetime`, que determina cómo se introduce y muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Hora de inicio», «Fecha límite» u «Hora de ejecución». Se recomienda utilizar un nombre que el personal de negocio pueda comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Fecha y hora (con zona horaria) normalmente utiliza `date`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Se pueden configurar requisitos como que el campo sea obligatorio o que se encuentre dentro de un intervalo de tiempo. |
| Description | Descripción del campo. Es adecuada para indicar su significado, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API. Confirma el nombre antes de crearlo para evitar los costes de ajuste de configuración que puedan ocasionar cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de fecha y hora (con zona horaria) es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `datetime`. |
| Field type predeterminado | `date`. |
| Field type opcional | `date`. |
| Componente de página | En el modo de edición se utiliza un selector de fecha y hora. |
| Filtrado | Permite filtrar por punto temporal, intervalo, valores vacíos y valores no vacíos. |
| Ordenación | Permite ordenar por hora. |
| Validación | Permite validaciones como campo obligatorio e intervalo de tiempo. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de hacerlo, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de fecha y hora (con zona horaria). En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de fecha y hora (con zona horaria) creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración del negocio.

:::

## Uso en la configuración de páginas

El campo de fecha y hora (con zona horaria) es adecuado para utilizarse en calendarios, tablas, filtros y flujos de trabajo.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar una fecha y una hora. |
| Bloque de tabla | Mostrar, ordenar y filtrar horas. |
| Bloque de calendario | Utilizarlo como campo de hora de inicio o de finalización. |
| Flujo de trabajo | Utilizarlo como condición temporal o campo relacionado con una programación. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Fecha y hora (sin zona horaria)](./datetime-without-tz.md) — Guardar fechas y horas sin conversión de zona horaria
- [Fecha](./date.md) — Guardar solo la fecha
- [Hora](./time.md) — Guardar solo la hora
