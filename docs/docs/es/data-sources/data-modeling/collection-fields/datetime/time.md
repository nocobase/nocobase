---
title: "Hora"
description: "El campo de hora se utiliza para guardar la hora del día, como la hora de inicio del horario comercial o la hora de un recordatorio."
keywords: "hora,time,campo de hora,NocoBase"
---

# Hora

## Introducción

En NocoBase, **Hora (Time)** se utiliza para guardar la hora del día.

El campo de hora es adecuado para datos empresariales no vinculados a una fecha concreta, como horarios comerciales, horas de recordatorios y turnos.

Si necesitas guardar la fecha y la hora al mismo tiempo, selecciona [fecha y hora](./datetime.md).

## Casos de uso

La hora es adecuada para estos casos de uso:

- Hora de inicio y hora de cierre del horario comercial
- Hora de los recordatorios diarios
- Hora de inicio y hora de finalización de los turnos
- Configuración de horas fijas

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Hora» para crear un campo de hora.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para la hora corresponde a `time`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Hora de inicio», «Hora del recordatorio» u «Horario comercial». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El tipo predeterminado del campo de hora es `time`. |
| Default value | Valor predeterminado. Al crear un registro, se puede establecer automáticamente este valor si el usuario no introduce ninguno. |
| Validation rules | Reglas de validación. Se pueden configurar reglas como campo obligatorio o intervalo horario. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración por modificaciones posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de hora es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `time`. |
| Field type predeterminado | `time`. |
| Field type opcional | `time`. |
| Componente de página | En el modo de edición se utiliza un selector de hora. |
| Filtrado | Admite filtros por hora, intervalo, vacío y no vacío. |
| Ordenación | Admite la ordenación por hora. |
| Validación | Admite validaciones como campo obligatorio e intervalo horario. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de hora. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya está sincronizada, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatible con condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El ajuste afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible con condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los registros nuevos. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de hora. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de hora creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de hora es adecuado para utilizarlo en formularios y configuraciones de reglas.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar una hora del día. |
| Bloque de tabla | Mostrar, ordenar y filtrar horas. |
| Bloque de filtrado | Filtrar por intervalo horario. |
| Flujo de trabajo | Utilizarlo como campo de condición horaria. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, las categorías y la lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Fecha](./date.md) — Guardar únicamente la fecha
- [Fecha y hora (con zona horaria)](./datetime.md) — Guardar la fecha y la hora