---
title: "Selección múltiple desplegable"
description: "El campo de selección múltiple desplegable se utiliza para seleccionar varios valores entre opciones predefinidas y es adecuado para campos como etiquetas, capacidades y preferencias."
keywords: "selección múltiple desplegable,multiple select,etiquetas,campo de opciones,NocoBase"
---

# Selección múltiple desplegable

## Introducción

En NocoBase, la **selección múltiple desplegable (Multiple select)** se utiliza para seleccionar varios valores entre un conjunto de opciones.

La selección múltiple desplegable es adecuada para campos como etiquetas, capacidades, preferencias y ámbitos de aplicación. Almacena varios valores de opciones, que normalmente se muestran como etiquetas en la página.

Si solo se puede seleccionar un valor, elige [selección única desplegable](./select.md) o [grupo de botones de opción](./radio-group.md).

## Casos de uso

La selección múltiple desplegable es adecuada para estos escenarios empresariales:

- Etiquetas de clientes y preferencias de usuarios
- Casos de uso de productos y capacidades de dispositivos
- Puntos de riesgo de proyectos y categorías de problemas
- Campos en los que se pueden seleccionar varios valores fijos

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Selección múltiple desplegable» para crear un campo de selección múltiple desplegable.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La selección múltiple desplegable corresponde a `multipleSelect`, que determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Etiquetas de clientes», «Casos de uso» o «Categorías de problemas». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de la creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. La selección múltiple desplegable normalmente se almacena como un array o JSON, según la configuración del campo y las capacidades de la fuente de datos. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente se configuran la obligatoriedad y el rango de opciones. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API después de su creación. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de selección múltiple desplegable es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `multipleSelect`. |
| Field type predeterminado | `array`. |
| Field type disponibles | `array` y `json`, según el mapeo real del campo. |
| Componente de página | En el modo de edición se utiliza un selector desplegable de selección múltiple. |
| Filtrado | Permite filtrar por la inclusión de una opción determinada. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite restricciones de obligatoriedad y de rango de opciones. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición normalmente consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de hacerlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de selección múltiple desplegable. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de selección múltiple desplegable creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de selección múltiple desplegable es adecuado para representar varias etiquetas o varias opciones fijas.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar varios valores entre las opciones. |
| Bloque de tabla | Mostrar las opciones como varias etiquetas. |
| Bloque de filtrado | Filtrar por la inclusión de determinadas etiquetas. |
| Flujos de trabajo y permisos | Participar en condiciones como «incluye» o «no incluye». |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Selección única desplegable](./select.md) — Seleccionar un valor entre las opciones
- [Grupo de casillas de verificación](./checkbox-group.md) — Seleccionar varios valores mediante casillas de verificación