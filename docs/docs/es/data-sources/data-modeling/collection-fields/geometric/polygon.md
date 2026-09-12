---
title: "Polígono"
description: "El campo de polígono se utiliza para guardar datos espaciales de áreas, límites, zonas de servicio y otras superficies."
keywords: "Polígono,Polygon,área,figura geométrica,NocoBase"
---

# Polígono

## Introducción

En NocoBase, **Polígono (Polygon)** se utiliza para guardar áreas espaciales de superficie.

El campo de polígono es adecuado para datos empresariales como divisiones administrativas, zonas de entrega, áreas de ventas y zonas restringidas. Junto con un bloque de mapa, permite mostrar el alcance de un área.

Si el área es un círculo simple, selecciona [Círculo](./circle.md). Si solo necesitas guardar una ubicación, selecciona [Punto](./point.md).

## Casos de uso

Los polígonos son adecuados para estos escenarios empresariales:

- Zonas de ventas y zonas de entrega
- Zonas de servicio y áreas de gestión
- Zonas restringidas y zonas de riesgo
- Límites de áreas empresariales en el mapa

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Polígono» para crear un campo de polígono.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El polígono corresponde a `polygon` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Zona de ventas», «Área de entrega» o «Zona de riesgo». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Por lo general, no se modifica después de la creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de polígono es `polygon`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente basta con configurar el campo como obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores por cambios.

:::

## Características del campo

El comportamiento predeterminado del campo de polígono es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `polygon`. |
| Field type predeterminado | `polygon`. |
| Field type opcional | `polygon`. |
| Componente de página | En el modo de edición se utiliza un componente de mapa para dibujar. |
| Filtrado | La capacidad de filtrado espacial depende del complemento de mapas y de las capacidades de la fuente de datos. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. |

## Edición de la configuración

Después de crearlo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de polígono. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de polígono. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de polígono creado en la base de datos principal, normalmente también se eliminarán la columna correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto dependerá de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones, exportaciones y datos existentes. Antes de eliminarlo, confirma si el campo todavía está siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de polígono es adecuado para escenarios de gestión de áreas y visualización en mapas.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Dibujar los límites del área. |
| Bloque de detalles | Mostrar el alcance del área. |
| Bloque de mapa | Mostrar áreas de superficie en el mapa. |
| Gráficos y estadísticas | Utilizarlo como dimensión de área para analizar datos empresariales. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y gestiona campos en una tabla normal
- [Punto](./point.md) — Guarda una ubicación individual
- [Círculo](./circle.md) — Guarda un área circular