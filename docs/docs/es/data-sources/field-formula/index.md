---
title: "Fórmula"
description: "El campo de fórmula se utiliza para calcular resultados a partir de otros campos, como importes, puntuaciones, textos de estado, etc."
keywords: "fórmula,formula,campo calculado,NocoBase"
---

# Fórmula

## Introducción

En NocoBase, **Fórmula (Formula)** se utiliza para calcular el valor de un campo a partir de una expresión.

Los campos de fórmula son adecuados para escenarios como cálculos de importes, cálculos de puntuaciones, concatenación de textos y cálculos condicionales. Su valor normalmente se genera mediante una expresión, por lo que no son adecuados para introducir datos manualmente.

Si el resultado debe introducirse manualmente, selecciona el campo básico correspondiente. Si la lógica de cálculo es muy compleja, considera utilizar un flujo de trabajo o una vista de base de datos.

## Casos de uso

Las fórmulas son adecuadas para estos escenarios empresariales:

- Subtotal del pedido e importe con impuestos incluidos
- Puntuación, puntuación ponderada y puntuación de rendimiento
- Nombre mostrado después de concatenar textos
- Resultados empresariales calculados según condiciones

## Crear y configurar

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Fórmula» para crear un campo de fórmula.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Fórmula corresponde a `formula` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, como «Subtotal del pedido», «Puntuación global» o «Nombre mostrado». Se recomienda utilizar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos de fórmula utilizan `formula`; el tipo de resultado depende de la configuración de la fórmula. |
| Default value | Valor predeterminado. Al añadir un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Lo más importante es comprobar que la expresión de fórmula esté completa y que los campos referenciados existan. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración adicionales por cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado de los campos de fórmula es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `formula`. |
| Field type predeterminado | `formula`. |
| Field type opcional | `formula`. |
| Componente de página | En el modo de edición normalmente se configura la expresión de fórmula; en el modo de lectura se muestra el resultado calculado. |
| Filtrado | La posibilidad de filtrar depende del resultado de la fórmula y del modo de ejecución. |
| Ordenación | La posibilidad de ordenar depende del resultado de la fórmula y del modo de ejecución. |
| Validación | Depende de la expresión de fórmula y del tipo de resultado. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición una vez creado. |
| Field interface | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes puedan utilizarse con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta al modo de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar un campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de fórmula. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de fórmula creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones, exportaciones y datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos de fórmula son adecuados para mostrar resultados calculados en tablas, detalles, estadísticas y flujos de trabajo.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Escenario | Uso |
| --- | --- |
| Configuración del campo | Escribir expresiones de fórmula y seleccionar los campos referenciados. |
| Bloque de tabla | Mostrar el resultado calculado. |
| Bloque de detalles | Mostrar el resultado calculado de un solo registro. |
| Flujo de trabajo | Leer el resultado de la fórmula para participar en las decisiones posteriores. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Número](../data-modeling/collection-fields/basic/number.md) — Guardar valores numéricos que participan en los cálculos
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Guardar resultados estructurados
