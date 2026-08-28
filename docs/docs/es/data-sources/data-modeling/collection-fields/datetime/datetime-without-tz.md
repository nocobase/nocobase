---
title: "Fecha y hora (sin zona horaria)"
description: "El campo de fecha y hora (sin zona horaria) se utiliza para guardar fechas y horas sin realizar conversiones de zona horaria."
keywords: "fecha y hora,datetime without timezone,sin zona horaria,NocoBase"
---

# Fecha y hora (sin zona horaria)

## Introducción

En NocoBase, **la fecha y hora (sin zona horaria) (Date time without timezone)** se utiliza para guardar fechas y horas sin realizar conversiones de zona horaria.

La fecha y hora (sin zona horaria) es adecuada para situaciones como la planificación de turnos, los horarios comerciales y los horarios de clases, en las que es más importante el valor mostrado en la hora local.

Si necesitas expresar un momento real y uniforme a nivel global, es más apropiado elegir [fecha y hora (con zona horaria)](./datetime.md).

## Casos de uso

La fecha y hora (sin zona horaria) es adecuada para estos escenarios empresariales:

- Horarios de turnos locales
- Hora de inicio de clases y hora de exámenes
- Horarios de apertura de establecimientos
- Horarios empresariales que no deben convertirse entre zonas horarias

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fecha y hora (sin zona horaria)» para crear un campo de fecha y hora (sin zona horaria).

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La fecha y hora (sin zona horaria) corresponde a `datetimeNoTz`, que determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Horario de turnos», «Horario de clases» u «Horario comercial». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas como API, campos de relación, permisos y flujos de trabajo. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. La fecha y hora (sin zona horaria) normalmente utiliza `datetimeNoTz`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Se pueden configurar requisitos como que el campo sea obligatorio o que se encuentre dentro de un intervalo de tiempo. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y las API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores derivados de modificaciones.

:::

## Características del campo

El comportamiento predeterminado del campo de fecha y hora (sin zona horaria) es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `datetimeNoTz`. |
| Field type predeterminado | `datetimeNoTz`. |
| Field type opcional | `datetimeNoTz`. |
| Componente de página | En el modo de edición se utiliza un selector de fecha y hora. |
| Filtrado | Permite filtrar por momento, intervalo, valores vacíos y valores no vacíos. |
| Ordenación | Permite ordenar por hora. |
| Validación | Permite validaciones como campo obligatorio e intervalo de tiempo. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de fecha y hora (sin zona horaria). La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Con restricciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El ajuste afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Con restricciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de ajustarlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de fecha y hora (sin zona horaria). En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de fecha y hora (sin zona horaria) creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones, exportaciones y datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de fecha y hora (sin zona horaria) es adecuado para operaciones basadas en la hora local.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar una fecha y una hora. |
| Bloque de tabla | Mostrar, ordenar y filtrar la hora. |
| Bloque de calendario | Utilizarlo como campo de hora local de un evento. |
| Flujo de trabajo | Utilizarlo como campo de condición temporal. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crear y gestionar campos en tablas normales
- [Fecha y hora (con zona horaria)](./datetime.md) — Guardar momentos con semántica de zona horaria
- [Fecha](./date.md) — Guardar únicamente la fecha