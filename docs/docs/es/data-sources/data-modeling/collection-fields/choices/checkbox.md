---
title: "Casilla de verificación"
description: "El campo de casilla de verificación se utiliza para guardar valores booleanos como sí o no, activado o desactivado."
keywords: "casilla de verificación,checkbox,valor booleano,boolean,NocoBase"
---

# Casilla de verificación

## Introducción

En NocoBase, la **casilla de verificación (Checkbox)** se utiliza para guardar valores booleanos de dos opciones.

El campo de casilla de verificación es adecuado para estados de activación, indicar si algo es predeterminado, si está completado o si requiere aprobación, entre otros juicios sencillos. Su semántica es más clara que guardar «sí/no» como texto.

Si el estado tiene más de dos valores, como borrador, en curso y completado, es más adecuado elegir [selección única desplegable](./select.md).

## Casos de uso

La casilla de verificación es adecuada para estos escenarios empresariales:

- Si está activado o si es predeterminado
- Si está completado o si se ha leído
- Si requiere aprobación o si se ha facturado
- Si es público o si está archivado

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Casilla de verificación» para crear un campo de casilla de verificación.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. La casilla de verificación corresponde a `checkbox` y determina cómo se introduce y se muestra el campo en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «¿Está activado?», «¿Está completado?» o «¿Se ha facturado?». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de la creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de casilla de verificación es `boolean`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Normalmente se configuran como obligatorias o con un valor predeterminado. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API después de su creación. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores debido a modificaciones.

:::

## Características del campo

El comportamiento predeterminado de los campos de casilla de verificación es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `checkbox`. |
| Field type predeterminado | `boolean`. |
| Field type disponible | `boolean`. |
| Componente de página | En el modo de edición se utiliza una casilla de verificación. |
| Filtrado | Permite filtrar por sí, no o vacío. |
| Ordenación | Permite ordenar por valor booleano. |
| Validación | Admite configuraciones básicas como campo obligatorio y valor predeterminado. |

## Editar configuración

Después de la creación, haz clic en «Edit», a la derecha del campo, para editar la configuración del campo de casilla de verificación. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Esto afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se pueden utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete», a la derecha del campo, para eliminar el campo de casilla de verificación. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de casilla de verificación creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de casilla de verificación es adecuado para utilizarlo en formularios, tablas, filtros y condiciones de flujos de trabajo.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir sí o no. |
| Bloque de tabla | Mostrar el estado de la casilla de verificación y permitir el filtrado. |
| Bloque de filtro | Filtrar según condiciones como si está activado o si está completado. |
| Flujos de trabajo y permisos | Participar en evaluaciones como condición booleana. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y gestiona campos en una tabla normal
- [Selección única desplegable](./select.md) — Guarda uno de varios estados
- [Grupo de botones de opción](./radio-group.md) — Muestra las opciones mediante botones de opción