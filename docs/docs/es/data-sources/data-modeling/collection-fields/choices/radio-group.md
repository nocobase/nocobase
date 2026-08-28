---
title: "Grupo de botones de opción"
description: "El campo de grupo de botones de opción muestra las opciones en línea en la página y permite seleccionar un único valor."
keywords: "grupo de botones de opción, grupo de radio, campo de opciones, NocoBase"
---

# Grupo de botones de opción

## Introducción

En NocoBase, el **grupo de botones de opción (Radio group)** se utiliza para seleccionar un único valor entre varias opciones y mostrar estas directamente en el formulario.

El grupo de botones de opción es adecuado para escenarios con pocas opciones en los que se necesita que el usuario pueda verlas todas de un vistazo. Es similar al selector desplegable de una sola opción, pero se diferencia principalmente en la forma de interacción en la página.

Si hay muchas opciones, elige el [selector desplegable de una sola opción](./select.md) para ahorrar espacio. Si necesitas seleccionar varias, elige el [grupo de casillas de verificación](./checkbox-group.md).

## Situaciones de uso

El grupo de botones de opción es adecuado para estos escenarios empresariales:

- Prioridad: baja, media, alta
- Sexo, tipo y otras opciones ampliadas de tipo sí/no
- Resultado de la aprobación: aprobado, rechazado
- Selección rápida entre pocas opciones fijas

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Grupo de botones de opción» para crear un campo de grupo de botones de opción.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El grupo de botones de opción corresponde a `radioGroup` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Prioridad», «Resultado de la aprobación» o «Tipo». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el grupo de botones de opción es `string` y almacena el valor de la opción seleccionada. |
| Default value | Valor predeterminado. Al crear un registro, se puede introducir automáticamente este valor si el usuario no proporciona ninguno. |
| Validation rules | Reglas de validación. Normalmente se configura como obligatorio y se mantienen los valores de las opciones. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar posteriores ajustes de configuración.

:::

## Características del campo

El comportamiento predeterminado del campo de grupo de botones de opción es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `radioGroup`. |
| Field type predeterminado | `string`. |
| Field type disponible | `string`. |
| Componente de página | En el modo de edición se utiliza un grupo de botones de opción. |
| Filtrado | Permite filtrar por opción. |
| Ordenación | Permite ordenar por el valor de la opción. |
| Validación | Admite campos obligatorios y restricciones sobre el conjunto de opciones. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del grupo de botones de opción. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de hacerlo, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los registros nuevos. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si hay muchos datos existentes, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de grupo de botones de opción. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de grupo de botones de opción creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que contiene. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, los formularios, los filtros, los permisos, los flujos de trabajo, la API, la importación y exportación, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El grupo de botones de opción es adecuado para mostrar en línea un número reducido de opciones en un formulario.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Muestra directamente todas las opciones y permite seleccionar una. |
| Bloque de detalles | Muestra la opción seleccionada. |
| Bloque de filtrado | Filtra los registros por opción. |
| Flujos de trabajo y permisos | Participa en condiciones como el estado o el tipo. |

## Enlaces relacionados

- [Campos](../index.md) — Consulta el propósito, la clasificación y la lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crea y administra campos en tablas normales
- [Selector desplegable de una sola opción](./select.md) — Úsalo cuando haya muchas opciones
- [Grupo de casillas de verificación](./checkbox-group.md) — Selecciona varios valores