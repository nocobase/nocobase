---
title: "Color"
description: "El campo de color se utiliza para guardar valores de color, y es adecuado para estados, categorías, etiquetas y configuraciones de visualización."
keywords: "color,color,campo,NocoBase"
---

# Color

## Introducción

En NocoBase, **Color (Color)** se utiliza para guardar valores de color.

El campo de color es adecuado para guardar colores de categorías, etiquetas, estados, gráficos o configuraciones de visualización. Normalmente almacena valores de color hexadecimales u otros formatos compatibles con el componente.

Si el color solo forma parte de un campo de opciones, puedes configurarlo directamente en el campo de opciones; no es necesario crear un campo de color independiente.

## Casos de uso

El color es adecuado para los siguientes escenarios empresariales:

- Colores de nivel de cliente y de estado
- Colores de etiquetas y categorías
- Colores de series de gráficos
- Configuración de visualización de páginas o tarjetas

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Color» para crear un campo de color.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Color corresponde a `color`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Color del estado», «Color de la etiqueta» o «Color del gráfico». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de la creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de color es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es adecuado indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de color es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `color`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string`. |
| Componente de página | En el modo de edición se utiliza un selector de color. |
| Filtrado | Se puede filtrar por valor de color, aunque normalmente no es una condición de consulta principal. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar la forma en que este se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre visible del campo en la interfaz sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Compatibilidad condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatibilidad condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminarlo. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de color creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones, exportaciones y datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de color es adecuado para utilizarse en escenarios de visualización y configuración de páginas.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar un valor de color. |
| Bloque de detalles | Mostrar el color. |
| Lista o tarjeta | Utilizarlo como indicador visual de estado, etiqueta o categoría. |
| Gráfico | Utilizarlo como fuente de configuración de colores. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y gestionar campos en una tabla normal
- [Icono](./icon.md) — Guardar identificadores de iconos
- [Selección única desplegable](../choices/select.md) — Configurar el color directamente en las opciones