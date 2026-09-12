---
title: "Entero"
description: "El campo entero se utiliza para guardar valores numéricos sin decimales, como cantidades, personas, veces o días."
keywords: "entero,integer,campo numérico,NocoBase"
---

# Entero

## Introducción

En NocoBase, **entero (Integer)** se utiliza para guardar valores numéricos sin decimales.

Los campos enteros son adecuados para datos empresariales como cantidades, veces, número de personas y números de orden. Pueden participar en filtros, ordenamientos, estadísticas, permisos y condiciones de flujos de trabajo.

Si necesitas guardar decimales, importes, pesos o proporciones, es más adecuado elegir [Número](./number.md) o [Porcentaje](./percent.md).

## Casos de uso

Los enteros son adecuados para estos casos de uso:

- Cantidad de productos, existencias y cantidades de compra
- Número de participantes, plazas disponibles y estadísticas de veces
- Días de duración, días de retraso y días del período de pago
- Códigos enteros de sistemas externos

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Entero» para crear un campo entero.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para los enteros corresponde a `integer` y determina cómo se introducen y muestran en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Cantidad», «Número de personas» o «Días de retraso». Se recomienda utilizar un nombre que el personal pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo entero es `integer`; para enteros de gran rango se puede elegir `bigInt`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Permiten limitar el valor mínimo, el valor máximo o indicar si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar su significado, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes posteriores de ajuste de la configuración.

:::

## Características del campo

El comportamiento predeterminado de los campos enteros es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `integer`. |
| Field type predeterminado | `integer`. |
| Field type opcionales | `integer` y `bigInt`. |
| Componente de página | En el modo de edición se utiliza un campo de entrada numérica. |
| Filtros | Admite filtros numéricos como igual, distinto, mayor que, menor que, rango, vacío y no vacío. |
| Ordenamiento | Permite ordenar en los bloques de tabla. |
| Validación | Admite validaciones numéricas como valor mínimo, valor máximo y campo obligatorio. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, hay que confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo entero. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo entero creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos enteros son adecuados para utilizarse en tablas, formularios, estadísticas y flujos de trabajo.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir cantidades, veces, días y otros valores sin decimales. |
| Bloque de tabla | Mostrar, ordenar y filtrar enteros. |
| Bloque de gráficos | Generar estadísticas por campos como cantidades y veces. |
| Flujos de trabajo y permisos | Participar como campos de condición en las evaluaciones, por ejemplo, para comprobar si la cantidad es mayor que 0. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Número](./number.md) — Guardar valores como decimales, importes y pesos
- [Porcentaje](./percent.md) — Guardar proporciones o tasas de finalización
