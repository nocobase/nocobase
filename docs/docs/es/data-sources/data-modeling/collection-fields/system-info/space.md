---
title: "Espacio"
description: "El campo de espacio se utiliza para identificar el espacio al que pertenece un registro después de habilitar la funcionalidad multiespacio."
keywords: "espacio,space,multiespacio,campo del sistema,NocoBase"
---

# Espacio

## Introducción

En NocoBase, **espacio (Space)** se utiliza para registrar el espacio al que pertenecen los datos.

El campo de espacio suele aparecer después de habilitar el complemento multiespacio y se utiliza para aislar los datos por espacio. No es adecuado utilizarlo como un campo de negocio común y modificarlo libremente.

Si solo se necesita una dimensión de negocio como departamento, región o proyecto, se recomienda crear un campo de relación común o un campo de opciones.

## Casos de uso

El espacio es adecuado para los siguientes casos de uso:

- Aislamiento de datos entre espacios
- Filtrado de datos por espacio
- Control de permisos a nivel de espacio
- Asignación de datos de negocio de tipo multiinquilino

## Configuración de creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Espacio» para crear un campo de espacio.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para el espacio corresponde a `space` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Espacio». Se recomienda utilizar un nombre que los usuarios de negocio puedan comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de la creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El campo de espacio suele ser un campo de relación que apunta a la tabla de espacios. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Normalmente, el sistema o el contexto del espacio se encargan de mantenerlas. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crear el campo para evitar costes posteriores de ajuste de la configuración.

:::

## Características del campo

El comportamiento predeterminado del campo de espacio es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `space`. |
| Field type predeterminado | `belongsTo`. |
| Field type disponible | `belongsTo`. |
| Componente de página | Se mantiene mediante el sistema o la funcionalidad multiespacio. Normalmente, en la página es de solo lectura o se utiliza según el contexto del espacio. |
| Filtrado | Admite el filtrado por espacio; los detalles dependen de la configuración multiespacio. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Se mantiene mediante la funcionalidad multiespacio. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de espacio. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de crear el campo. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de ajustarlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los registros nuevos. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma en que se utilizan las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de espacio. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de espacio creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración de negocio.

:::

## Uso en la configuración de páginas

El campo de espacio es adecuado para escenarios de aislamiento de datos entre espacios y de gestión de permisos.

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Muestra el espacio al que pertenece el registro. |
| Bloque de filtrado | Filtra los registros por espacio. |
| Permisos | Aísla el acceso a los datos por espacio. |
| Flujo de trabajo | Lee el espacio al que pertenece el registro como contexto. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../../../data-source-main/general-collection.md) — Crea y administra campos en tablas normales
- [Multiespacio](../../../../multi-app/multi-space/index.md) — Conoce la funcionalidad multiespacio
- [Campos de relación](../associations/index.md) — Crea campos de relación comunes
