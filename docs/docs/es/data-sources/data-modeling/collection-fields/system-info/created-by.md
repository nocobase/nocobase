---
title: "Creador"
description: "El campo Creador se utiliza para registrar automáticamente al usuario que crea un registro."
keywords: "Creador,createdBy,campo del sistema,usuario,NocoBase"
---

# Creador

## Introducción

En NocoBase, **Creador (Created by)** se utiliza para registrar automáticamente al usuario que crea un registro.

El creador normalmente se genera mediante un campo predefinido. Es adecuado para el control de permisos, el seguimiento de responsabilidades, el filtrado y las auditorías.

Si necesitas expresar el responsable del negocio, el encargado de gestionar un trámite o el aprobador, se recomienda crear por separado un campo de relación con usuarios en lugar de reutilizar el campo Creador.

## Casos de uso

El campo Creador es adecuado para estos escenarios de negocio:

- Solo ver los datos que he creado
- Filtrar registros por creador
- Auditar la responsabilidad de creación de registros
- Determinar el creador del registro en un flujo de trabajo

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Creador» para crear un campo Creador.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para Creador corresponde a `createdBy` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Creador». Se recomienda utilizar un nombre que los usuarios de negocio puedan comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Creador normalmente es un campo de relación `belongsTo` que apunta a la tabla de usuarios. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no lo introduce, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Se mantiene automáticamente por el sistema y normalmente no requiere validación manual. |
| Description | Descripción del campo. Es adecuado incluir el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores debido a cambios.

:::

## Características del campo

El comportamiento predeterminado del campo Creador es el siguiente:

| Característica | Descripción |
| --- | --- |
| Default Field interface | `createdBy`. |
| Default Field type | `belongsTo`. |
| Field type disponible | `belongsTo`. |
| Componente de página | El sistema lo completa automáticamente; normalmente se muestra en la página mediante un componente de selección o visualización de usuarios. |
| Filtrado | Permite filtrar por usuario. |
| Ordenación | Normalmente no se ordena por creador. |
| Validación | El sistema lo completa automáticamente. |

## Editar la configuración

Después de crearlo, haz clic en «Edit», a la derecha del campo, para editar la configuración del campo Creador. La edición del campo se utiliza principalmente para ajustar la forma en que este se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar un campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | ¿Se puede editar? | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Admite edición condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Admite edición condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete», a la derecha del campo, para eliminar el campo Creador. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Creador creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, y datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

El campo Creador es adecuado para utilizarlo en permisos, filtros, auditorías y flujos de trabajo.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Muestra el creador. |
| Bloque de filtrado | Filtra registros por creador. |
| Permisos | Configura reglas como «solo ver los datos que he creado». |
| Flujo de trabajo | Obtiene el creador y envía notificaciones o establece condiciones. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, las categorías y la lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Último actualizador](./updated-by.md) — Registra automáticamente al último usuario que actualizó el registro
- [Campo de relación](../associations/index.md) — Crea relaciones con usuarios, como el responsable del negocio
