---
title: "Número"
description: "El campo numérico se utiliza para guardar valores numéricos que pueden incluir decimales, como importes, pesos, puntuaciones y superficies."
keywords: "número,number,double,decimal,NocoBase"
---

# Número

## Introducción

En NocoBase, **Número (Number)** se utiliza para guardar valores numéricos que pueden incluir decimales.

El campo numérico es adecuado para datos empresariales como importes, pesos, superficies, puntuaciones y precios unitarios. Puede participar en filtros, ordenaciones, estadísticas, fórmulas y condiciones de flujos de trabajo.

Si el valor debe ser un entero, elegir [Entero](./integer.md) es más directo. Si se desea mostrar como una proporción o porcentaje, elegir [Porcentaje](./percent.md).

## Casos de uso

El campo numérico es adecuado para estos casos de uso:

- Importes de pedidos, importes de contratos y precios unitarios
- Peso, superficie, volumen y distancia
- Puntuaciones, coeficientes y valores antes del descuento
- Valores decimales que deben participar en estadísticas o cálculos de fórmulas

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Número» para crear un campo numérico.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para los números corresponde a `number` y determina cómo se introducen y muestran en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Importe del pedido», «Puntuación» o «Peso». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo numérico es `double`. Para casos que requieren decimales exactos, como los importes, se puede elegir `decimal`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Permiten limitar el valor mínimo, el valor máximo, la precisión o si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores por posibles modificaciones.

:::

## Características del campo

El comportamiento predeterminado del campo numérico es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `number`. |
| Field type predeterminado | `double`. |
| Field type opcional | `float`, `double` y `decimal`. |
| Componente de página | En el modo de edición se utiliza un cuadro de entrada numérica. |
| Filtrado | Admite filtros numéricos como igual a, distinto de, mayor que, menor que, dentro de un intervalo, vacío y no vacío. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Validación | Admite validaciones como el rango numérico y la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición suele consistir en realizar una asignación de campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | ¿Se puede editar? | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Completa el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo numérico. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo numérico creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en dicha columna. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos numéricos son adecuados para la introducción de datos, las estadísticas, los gráficos y las condiciones de los flujos de trabajo.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir valores como importes, puntuaciones y pesos. |
| Bloque de tabla | Mostrar, ordenar y filtrar valores numéricos. |
| Bloque de gráficos | Agrupar, sumar o calcular el promedio según campos numéricos. |
| Campo de fórmula | Utilizarlo como campo de entrada para los cálculos de fórmulas. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Entero](./integer.md) — Guardar valores sin decimales
- [Porcentaje](./percent.md) — Guardar proporciones o tasas de finalización
- [Fórmula](../../../field-formula/index.md) — Calcular resultados basados en campos numéricos
