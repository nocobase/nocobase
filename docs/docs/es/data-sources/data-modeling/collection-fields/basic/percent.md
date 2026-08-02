---
title: "Porcentaje"
description: "El campo de porcentaje se utiliza para guardar datos proporcionales, como tasas de finalización, descuentos y conversión."
keywords: "porcentaje,percent,proporción,tasa de finalización,NocoBase"
---

# Porcentaje

## Introducción

En NocoBase, **Porcentaje (Percent)** se utiliza para guardar y mostrar datos proporcionales.

El campo de porcentaje es adecuado para datos empresariales como tasas de finalización, descuentos, conversiones y proporciones. En esencia, es un campo numérico, pero su presentación e introducción en la interfaz están más adaptadas al significado de porcentaje.

Si solo necesitas guardar importes, cantidades o puntuaciones ordinarias, es más adecuado elegir [Número](./number.md).

## Casos de uso

El porcentaje es adecuado para estos escenarios empresariales:

- Tasa de finalización de proyectos y progreso de tareas
- Descuentos, tasas impositivas y porcentajes de comisión
- Tasas de conversión, cumplimiento de objetivos y proporciones
- Ponderaciones de puntuación y proporciones de distribución

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Porcentaje» para crear un campo de porcentaje.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para los porcentajes corresponde a `percent` y determina cómo se introducen y muestran en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Tasa de finalización», «Descuento» o «Tasa de conversión». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos y los flujos de trabajo. Por lo general, no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos de porcentaje suelen utilizar `double`, aunque también se puede elegir `decimal` según los requisitos de precisión. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Permiten limitar el valor mínimo, el valor máximo o indicar si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar su significado, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores derivados de cambios.

:::

## Características del campo

El comportamiento predeterminado del campo de porcentaje es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `percent`. |
| Field type predeterminado | `double`. |
| Field type opcionales | `float`, `double` y `decimal`. |
| Componente de página | En el modo de edición se utiliza un componente de entrada de porcentaje. |
| Filtrado | Admite filtros numéricos, como mayor que, menor que, rangos, vacío y no vacío. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Validación | Admite validaciones como el rango numérico y la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición normalmente consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre visible. Afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de porcentaje. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de porcentaje creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de porcentaje es adecuado para expresar proporciones en formularios empresariales, paneles, gráficos e informes.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir tasas de finalización, descuentos, tasas impositivas y otras proporciones. |
| Bloque de tabla | Mostrar, ordenar y filtrar datos proporcionales. |
| Bloque de gráfico | Mostrar indicadores como proporciones y tasas de conversión. |
| Flujos de trabajo y permisos | Participar como campo condicional en evaluaciones, por ejemplo, para comprobar si la tasa de finalización ha alcanzado el 100 %. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla ordinaria](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla ordinaria
- [Número](./number.md) — Guarda valores numéricos ordinarios
- [Fórmula](../../../field-formula/index.md) — Calcula resultados proporcionales