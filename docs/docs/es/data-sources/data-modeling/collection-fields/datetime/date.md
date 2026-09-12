---
title: "Fecha"
description: "El campo de fecha se utiliza para guardar fechas sin una hora específica, como cumpleaños, fechas de firma y fechas de vencimiento."
keywords: "fecha,date,campo de fecha,NocoBase"
---

# Fecha

## Introducción

En NocoBase, **Fecha (Date)** se utiliza para guardar fechas sin una hora específica.

El campo de fecha es adecuado para datos empresariales en los que solo importan el año, el mes y el día, como cumpleaños, fechas de firma, fechas de vencimiento y fechas planificadas.

Si necesitas guardar horas, minutos y segundos específicos, selecciona [Fecha y hora](./datetime.md). Si solo necesitas la hora del día, selecciona [Hora](./time.md).

## Casos de uso

La fecha es adecuada para estos casos de uso:

- Cumpleaños de clientes y fechas de incorporación de empleados
- Fechas de firma y vencimiento de contratos
- Fechas planificadas y fechas de entrega
- Fechas empresariales que no requieren una hora específica

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fecha» para crear un campo de fecha.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para la fecha corresponde a `date` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Fecha de firma», «Fecha de vencimiento» o «Cumpleaños». Se recomienda utilizar un nombre que el personal de negocio pueda comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de fecha es `dateonly`. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Reglas de validación. Se pueden configurar reglas como obligatoriedad y rango de fechas. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de fecha es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `date`. |
| Field type predeterminado | `dateonly`. |
| Field type opcional | `dateonly`. |
| Componente de página | En el modo de edición se utiliza un selector de fecha. |
| Filtrado | Permite filtrar por fecha, intervalo, valores vacíos y valores no vacíos. |
| Ordenación | Permite ordenar por fecha. |
| Validación | Permite validaciones como obligatoriedad y rango de fechas. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de fecha. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatibilidad condicionada | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatibilidad condicionada | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. El cambio afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de fecha. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de fecha creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de fecha es adecuado para utilizarlo en formularios, tablas, filtros, calendarios y estadísticas.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Caso de uso | Finalidad |
| --- | --- |
| Bloque de formulario | Seleccionar una fecha. |
| Bloque de tabla | Mostrar, ordenar y filtrar fechas. |
| Bloque de calendario | Utilizarlo como campo de fecha del evento. |
| Flujo de trabajo | Utilizarlo como campo de condición de fecha. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Fecha y hora (con zona horaria)](./datetime.md) — Guarda una fecha y hora específicas
- [Hora](./time.md) — Guarda únicamente la hora