---
title: "Grupo de casillas de verificación"
description: "El campo de grupo de casillas de verificación se utiliza para mostrar varias opciones en la página y permitir seleccionar varios valores."
keywords: "grupo de casillas de verificación,checkbox group,selección múltiple,campo de opciones,NocoBase"
---

# Grupo de casillas de verificación

## Introducción

En NocoBase, el **grupo de casillas de verificación (Checkbox group)** se utiliza para seleccionar varios valores de un conjunto de opciones y mostrar estas opciones directamente en el formulario.

El grupo de casillas de verificación es adecuado para situaciones con pocas opciones que requieren selección múltiple. Su funcionamiento es similar al de la selección múltiple desplegable, pero se diferencia principalmente en la forma de interacción en la página.

Si hay muchas opciones, la [selección múltiple desplegable](./multiple-select.md) ahorra más espacio. Si solo se puede seleccionar una opción, elige el [grupo de botones de opción](./radio-group.md).

## Casos de uso

El grupo de casillas de verificación es adecuado para estos casos de negocio:

- Alcance del servicio y canales aplicables
- Opciones de permisos de funciones
- Etiquetas de necesidades del cliente
- Pocas opciones fijas de selección múltiple

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Grupo de casillas de verificación» para crear un campo de grupo de casillas de verificación.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El grupo de casillas de verificación corresponde a `checkboxGroup` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Alcance del servicio», «Canales aplicables» o «Etiquetas de necesidades». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El grupo de casillas de verificación normalmente se guarda como un array o JSON, según la configuración del campo y las capacidades de la fuente de datos. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente se configuran como obligatorias y para definir el rango de opciones permitido. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y las API. Confirma el nombre antes de crear el campo para evitar posteriores ajustes de configuración.

:::

## Características del campo

El comportamiento predeterminado del campo de grupo de casillas de verificación es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `checkboxGroup`. |
| Field type predeterminado | `array`. |
| Field type disponibles | `array` y `json`, según el mapeo real del campo. |
| Componente de página | En el modo de edición se utiliza un grupo de casillas de verificación. |
| Filtrado | Permite filtrar por la inclusión de una opción determinada. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite la restricción de campos obligatorios y del rango de opciones. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar un mapeo del campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de crear el campo. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo. Antes de hacerlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta al método de almacenamiento del campo, al componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de grupo de casillas de verificación. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de grupo de casillas de verificación creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

El grupo de casillas de verificación es adecuado para mostrar en un formulario pocas opciones de selección múltiple.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Muestra directamente todas las opciones y permite seleccionar varias. |
| Bloque de detalles | Muestra varias opciones como etiquetas o texto. |
| Bloque de filtrado | Filtra por la inclusión de determinadas opciones. |
| Flujos de trabajo y permisos | Participa en condiciones como incluir o no incluir. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crea y gestiona campos en tablas normales
- [Selección múltiple desplegable](./multiple-select.md) — Utilízala cuando haya muchas opciones
- [Grupo de botones de opción](./radio-group.md) — Selecciona un solo valor.