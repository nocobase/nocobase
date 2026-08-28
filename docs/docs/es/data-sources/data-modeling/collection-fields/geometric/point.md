---
title: "Punto"
description: "El campo de punto se utiliza para guardar una ubicación geográfica o una coordenada espacial."
keywords: "Punto,Point,geometría,mapa,NocoBase"
---

# Punto

## Introducción

En NocoBase, **Punto (Point)** se utiliza para guardar las coordenadas de una ubicación individual.

El campo de punto es adecuado para datos espaciales como la ubicación de tiendas, clientes y dispositivos. En combinación con el bloque de mapa, permite mostrar los registros en un mapa.

Si necesitas guardar una ruta, elige [Línea](./line.md). Si necesitas guardar un área, elige [Polígono](./polygon.md) o [Círculo](./circle.md).

## Casos de uso

El punto es adecuado para estos escenarios empresariales:

- Ubicación de tiendas y almacenes
- Coordenadas de las direcciones de los clientes
- Ubicación de instalación de dispositivos
- Ubicación de registro de inspecciones

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Punto» para crear un campo de punto.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Punto corresponde a `point` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Ubicación de la tienda», «Coordenadas del dispositivo» o «Ubicación del cliente». Se recomienda usar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El tipo predeterminado del campo de punto es `point`. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar su significado, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Después de crear el nombre del campo, este será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de ajuste de la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de punto es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `point`. |
| Field type predeterminado | `point`. |
| Field type opcional | `point`. |
| Componente de página | En el modo de edición se utiliza un componente de selección de mapas o coordenadas. |
| Filtrado | La capacidad de filtrado espacial depende del complemento de mapas y de las capacidades de la fuente de datos. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Depende | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Esto afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de punto. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de punto creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de punto es adecuado para escenarios de mapas y gestión de ubicaciones.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Seleccionar o introducir una ubicación. |
| Bloque de detalles | Mostrar las coordenadas de una ubicación o un punto en el mapa. |
| Bloque de mapa | Mostrar puntos en el mapa. |
| Flujo de trabajo | Servir como entrada para condiciones empresariales relacionadas con ubicaciones. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crear y gestionar campos en tablas normales
- [Bloque de mapa](../../../../interface-builder/blocks/data-blocks/map.md) — Mostrar campos geométricos en el mapa
- [Línea](./line.md) — Guardar rutas
- [Polígono](./polygon.md) — Guardar áreas