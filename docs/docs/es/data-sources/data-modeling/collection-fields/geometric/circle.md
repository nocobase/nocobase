---
title: "Círculo"
description: "El campo de círculo se utiliza para guardar áreas representadas mediante un punto central y un radio."
keywords: "Círculo,Circle,figura geométrica,mapa,NocoBase"
---

# Círculo

## Introducción

En NocoBase, **Círculo (Circle)** se utiliza para guardar áreas circulares.

El campo de círculo es adecuado para datos empresariales como radios de servicio, áreas de cobertura de entrega y zonas de cobertura de tiendas.

Si el área no es circular, selecciona [Polígono](./polygon.md). Si solo necesitas guardar la ubicación central, selecciona [Punto](./point.md).

## Casos de uso

El círculo es adecuado para estos casos de uso:

- Radio de servicio de una tienda
- Área de cobertura de entregas
- Área de influencia de un dispositivo
- Área de búsqueda alrededor de un punto

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Círculo» para crear un campo de círculo.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para el círculo corresponde a `circle` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Radio de servicio», «Área de cobertura» o «Área de influencia». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Por lo general, no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El tipo predeterminado del campo de círculo es `circle`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, este puede completarse automáticamente. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración adicionales derivados de cambios posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de círculo es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `circle`. |
| Field type predeterminado | `circle`. |
| Field type opcional | `circle`. |
| Componente de página | En el modo de edición se utiliza un componente de dibujo de mapas. |
| Filtrado | La capacidad de filtrado espacial depende del complemento de mapas y de las capacidades de la fuente de datos. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar un campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición una vez creado. |
| Field interface | Compatibilidad condicionada | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatibilidad condicionada | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de círculo. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de círculo creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de círculo es adecuado para escenarios de radios de servicio y áreas de cobertura.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Dibujar un área circular. |
| Bloque de detalles | Mostrar un área circular. |
| Bloque de mapa | Mostrar el área de cobertura en el mapa. |
| Flujo de trabajo | Utilizarlo como dato relacionado con un área en un proceso. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, las categorías y la lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Punto](./point.md) — Guardar una ubicación central
- [Polígono](./polygon.md) — Guardar un área no circular