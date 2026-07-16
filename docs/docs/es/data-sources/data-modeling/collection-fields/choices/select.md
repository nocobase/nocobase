---
title: "Selección única desplegable"
description: "El campo de selección única desplegable se utiliza para seleccionar un valor entre opciones predefinidas, por lo que es adecuado para campos como estado, nivel y tipo."
keywords: "selección única desplegable,select,campo de opciones,NocoBase"
---

# Selección única desplegable

## Introducción

En NocoBase, la **selección única desplegable (Select)** se utiliza para seleccionar un valor de un conjunto de opciones.

La selección única desplegable es adecuada para campos empresariales con un rango fijo de valores, como estado, nivel, tipo y origen. Las opciones pueden configurarse con un nombre visible, un valor y un color.

Si necesitas seleccionar varios valores, elige [selección múltiple desplegable](./multiple-select.md). Si solo necesitas las opciones sí o no, elige [casilla de verificación](./checkbox.md).

## Escenarios de uso

La selección única desplegable es adecuada para estos escenarios empresariales:

- Estado de pedidos, estado de tickets, estado de aprobaciones
- Nivel de clientes, origen de leads, prioridad
- Tipo de proyecto, categoría de activo, tipo de contrato
- Campos en los que solo se puede seleccionar un valor dentro de un rango fijo

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Selección única desplegable» para crear un campo de selección única desplegable.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La selección única desplegable corresponde a `select` y determina cómo se introduce y se muestra el campo en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Estado del pedido», «Nivel del cliente» o «Prioridad». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, la selección única desplegable es `string` y almacena el valor de la opción seleccionada. |
| Default value | Valor predeterminado. Al crear un registro, el valor se completa automáticamente si el usuario no introduce ninguno. |
| Validation rules | Reglas de validación. Normalmente se configura como obligatorio y se mantienen los valores de las opciones. |
| Description | Descripción del campo. Es adecuada para indicar su significado, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y las API. Confirma el nombre antes de crearlo para evitar el coste de ajustar la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de selección única desplegable es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `select`. |
| Field type predeterminado | `string`. |
| Field type disponible | `string`. |
| Componente de página | En el modo de edición se utiliza un selector desplegable. |
| Filtrado | Permite filtrar por opción. |
| Ordenación | Permite ordenar por el valor de la opción. |
| Validación | Admite la obligatoriedad y la restricción al conjunto de opciones. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | ¿Se puede editar? | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes puedan utilizarse con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de selección única desplegable. En la base de datos principal también puedes seleccionar varios campos y eliminarlos en lote.

Al eliminar un campo de selección única desplegable creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de selección única desplegable es adecuado para utilizarlo en formularios, tablas, tableros y filtros.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar un valor entre las opciones desplegables. |
| Bloque de tabla | Mostrar las opciones como etiquetas o texto. |
| Bloque de tablero | Agrupar por opciones como estado o etapa. |
| Bloque de filtro | Filtrar rápidamente los registros por opción. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y gestiona campos en una tabla normal
- [Selección múltiple desplegable](./multiple-select.md) — Selecciona varios valores entre las opciones
- [Grupo de botones de opción](./radio-group.md) — Selecciona un valor mediante un grupo de botones
