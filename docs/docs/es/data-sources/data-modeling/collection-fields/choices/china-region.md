---
title: "Divisiones administrativas de China"
description: "El campo de divisiones administrativas de China se utiliza para seleccionar información sobre provincias, ciudades, distritos y condados, entre otras divisiones administrativas."
keywords: "divisiones administrativas de China,china region,dirección,campo de opciones,NocoBase"
---

# Divisiones administrativas de China (obsoleto)

## Introducción

:::warning Nota

El campo de divisiones administrativas de China ha quedado obsoleto. Se recomienda utilizar un campo de relación para asociar una tabla jerárquica.

:::

En NocoBase, **Divisiones administrativas de China (China region)** se utiliza para seleccionar provincias, ciudades, distritos y condados de China, entre otras divisiones administrativas.

El campo de divisiones administrativas de China es adecuado para escenarios que requieren una selección estructurada de regiones, como direcciones de clientes, direcciones de tiendas y áreas de servicio. Facilita más el filtrado y las estadísticas que introducir manualmente las direcciones.

Si necesitas guardar una dirección completa y detallada, puedes utilizarlo junto con [Texto de una línea](../basic/input.md) o [Texto multilínea](../basic/textarea.md) para guardar la calle y el número.

## Escenarios aplicables

Las divisiones administrativas de China son adecuadas para estos escenarios empresariales:

- Provincia, ciudad y distrito o condado del cliente
- Área de servicio de la tienda
- Región de implementación del proyecto
- División administrativa de la dirección de entrega

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Divisiones administrativas de China» para crear un campo de divisiones administrativas de China.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para las divisiones administrativas de China corresponde a `chinaRegion` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Región», «Área de servicio» o «Zona de entrega». Se recomienda utilizar un nombre que el personal empresarial pueda comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos de divisiones administrativas normalmente se guardan como valores estructurados; el Field type concreto depende de la configuración del campo. |
| Default value | Valor predeterminado. Al crear un registro, se puede introducir automáticamente si el usuario no lo completa. |
| Validation rules | Reglas de validación. Normalmente se configuran como obligatorias y para definir los niveles de selección. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Nota

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y la API después de su creación. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de divisiones administrativas de China es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `chinaRegion`. |
| Field type predeterminado | `json`. |
| Field type disponible | `json` y `string`, según la configuración real del campo. |
| Componente de página | En el modo de edición se utiliza el componente de selección de divisiones administrativas. |
| Filtrado | Permite filtrar por valores de región; las funciones concretas dependen de la configuración del campo. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crearlo, haz clic en «Edit», a la derecha del campo, para editar la configuración del campo de divisiones administrativas de China. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos al Field type y al Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Nota

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete», a la derecha del campo, para eliminar el campo de divisiones administrativas de China. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de divisiones administrativas de China creado en la base de datos principal, normalmente también se eliminan la columna correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, la API, las importaciones y exportaciones, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de divisiones administrativas de China es adecuado para utilizarse en escenarios de direcciones, regiones y estadísticas.

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar provincia, ciudad, distrito o condado. |
| Bloque de detalles | Mostrar la división administrativa. |
| Bloque de filtrado | Filtrar registros por región. |
| Bloque de gráficos | Obtener estadísticas de los datos empresariales por región. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crear y gestionar campos en tablas normales
- [Texto de una línea](../basic/input.md) — Guardar direcciones detalladas
- [Texto multilínea](../basic/textarea.md) — Guardar descripciones de direcciones más extensas