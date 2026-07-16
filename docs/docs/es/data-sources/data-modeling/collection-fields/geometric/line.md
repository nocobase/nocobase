---
title: "Línea"
description: "El campo de línea se utiliza para guardar datos espaciales lineales, como rutas y trayectorias."
keywords: "línea,LineString,ruta,figura geométrica,NocoBase"
---

# Línea

## Introducción

En NocoBase, **línea (LineString)** se utiliza para guardar datos espaciales lineales.

El campo de línea es adecuado para datos empresariales como rutas, trayectorias, tuberías y recorridos de inspección. Al combinarlo con el bloque de mapa, permite mostrar rutas.

Si solo necesitas una ubicación, selecciona [punto](./point.md). Si necesitas un área, selecciona [polígono](./polygon.md).

## Casos de uso

La línea es adecuada para estos escenarios empresariales:

- Rutas de reparto y de inspección
- Trayectorias de vehículos y personas
- Tuberías, líneas y límites
- Resultados de planificación de rutas en el mapa

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Línea» para crear un campo de línea.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para las líneas corresponde a `lineString` y determina cómo se introducen y muestran en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Ruta de reparto», «Trayectoria de inspección» o «Tubería». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de línea es `lineString`. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es recomendable indicar su significado, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar ajustes de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de línea es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `lineString`. |
| Field type predeterminado | `lineString`. |
| Field type disponible | `lineString`. |
| Componente de página | En el modo de edición se utiliza un componente de dibujo de mapas. |
| Filtrado | La capacidad de filtrado espacial depende del complemento de mapas y de las capacidades de la fuente de datos. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Admite cambios según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Completa el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre visible. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminarlo. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de línea creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente en la base de datos y los datos que contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de línea es adecuado para escenarios de rutas en mapas y análisis espacial.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Dibujar o introducir rutas. |
| Bloque de detalles | Mostrar rutas. |
| Bloque de mapa | Mostrar rutas lineales en el mapa. |
| Flujo de trabajo | Participar en procesos como datos relacionados con rutas. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Punto](./point.md) — Guardar una ubicación individual
- [Polígono](./polygon.md) — Guardar un área