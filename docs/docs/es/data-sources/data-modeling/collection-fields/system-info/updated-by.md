---
title: "Actualizado por"
description: "El campo Actualizado por se utiliza para registrar automáticamente al usuario que realizó la última actualización."
keywords: "Actualizado por,updatedBy,campo del sistema,usuario,NocoBase"
---

# Actualizado por

## Introducción

En NocoBase, **Actualizado por (Updated by)** se utiliza para registrar automáticamente al usuario que realizó la última actualización.

El campo Actualizado por normalmente se genera mediante un campo predefinido. Es adecuado para auditorías, seguimiento de responsabilidades, filtros y condiciones de flujos de trabajo.

Si necesitas expresar quién es el responsable del negocio, quién procesa algo o quién aprueba algo, se recomienda crear por separado un campo de relación con usuarios.

## Casos de uso

El campo Actualizado por es adecuado para los siguientes casos de uso:

- Consultar quién realizó el último mantenimiento
- Filtrar registros por usuario que realizó la actualización
- Auditar quién modificó los datos
- Notificar al último usuario que realizó una actualización en un flujo de trabajo

## Crear y configurar

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Actualizado por» para crear un campo Actualizado por.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Actualizado por corresponde a `updatedBy`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, como «Actualizado por» o «Última modificación por». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas como la API, los campos de relación, los permisos y los flujos de trabajo. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Actualizado por normalmente es un campo de relación `belongsTo` que apunta a la tabla de usuarios. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Se mantiene automáticamente por el sistema y normalmente no requiere validación manual. |
| Description | Descripción del campo. Es adecuado indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona encargada de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API. Confirma el nombre antes de crearlo para evitar costes posteriores de reconfiguración.

:::

## Características del campo

El comportamiento predeterminado del campo Actualizado por es el siguiente:

| Característica | Descripción |
| --- | --- |
| Default Field interface | `updatedBy`. |
| Default Field type | `belongsTo`. |
| Field type opcional | `belongsTo`. |
| Componente de página | El sistema lo completa automáticamente; normalmente se muestra mediante un componente de usuario. |
| Filtrado | Permite filtrar por usuario. |
| Ordenación | Normalmente no se ordena por el usuario que realizó la actualización. |
| Validación | El sistema lo completa automáticamente. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | El nombre identificador del campo normalmente no se puede modificar en el formulario de edición una vez creado. |
| Field interface | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Compatible según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona encargada de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo Actualizado por. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo Actualizado por creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración del negocio.

:::

## Uso en la configuración de páginas

El campo Actualizado por es adecuado para auditorías, filtros y flujos de trabajo.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Muestra quién realizó la última actualización. |
| Bloque de filtrado | Filtra registros por el usuario que realizó la actualización. |
| Bloque de detalles | Permite consultar quién realizó el último mantenimiento. |
| Flujo de trabajo | Se utiliza como destinatario de notificaciones o campo de condición. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crea y administra campos en tablas normales
- [Creador](./created-by.md) — Registra automáticamente al usuario que creó el registro
- [Campos de relación](../associations/index.md) — Crea relaciones con usuarios, como el responsable del negocio
