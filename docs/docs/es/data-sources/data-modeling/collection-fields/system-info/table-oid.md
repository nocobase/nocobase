---
title: "Identificador de tabla de datos"
description: "El campo de identificador de tabla de datos se utiliza para identificar la tabla de datos a la que pertenece un registro. Es común en escenarios como las tablas heredadas, donde es necesario distinguir la tabla de origen."
keywords: "identificador de tabla de datos,table oid,tableoid,campo del sistema,NocoBase"
---

# Identificador de tabla de datos

## Introducción

En NocoBase, el **identificador de tabla de datos (Table OID)** se utiliza para identificar la tabla de datos a la que pertenece un registro.

El identificador de tabla de datos es común en tablas heredadas o en escenarios donde es necesario distinguir la Collection de origen de un registro. Se trata principalmente de un campo utilizado por las capacidades del sistema y los metadatos.

Por lo general, las tablas de negocio comunes no necesitan crear manualmente un campo de identificador de tabla de datos.

## Casos de uso

El identificador de tabla de datos es adecuado para los siguientes escenarios empresariales:

- Identificación del origen de los registros de tablas heredadas
- Agregación y visualización entre tablas secundarias
- Configuración de metadatos
- Capacidades del sistema que necesitan distinguir el origen de una Collection

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Identificador de tabla de datos» para crear un campo de identificador de tabla de datos.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El identificador de tabla de datos corresponde a `tableoid`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Identificador de tabla de datos» o «Tabla de origen». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El identificador de tabla de datos suele ser un campo `virtual`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no lo introduce, se puede completar automáticamente con este valor. |
| Validation rules | Normalmente lo mantiene el sistema. |
| Description | Descripción del campo. Es adecuado incluir el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y las API. Confirma el nombre antes de crearlo para evitar el coste de ajustar la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado de los campos de identificador de tabla de datos es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `tableoid`. |
| Field type predeterminado | `virtual`. |
| Field type opcional | `virtual`. |
| Componente de página | Normalmente se muestra en la página mediante un selector de tabla de datos o como contenido de solo lectura. |
| Filtrado | Se puede utilizar para filtrar por tabla de datos de origen, según la configuración de la página. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | La mantienen el sistema o las capacidades de metadatos. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de hacerlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de identificador de tabla de datos. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de identificador de tabla de datos creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente en la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde la base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración de negocio.

:::

## Uso en la configuración de páginas

Los campos de identificador de tabla de datos son adecuados para utilizarse en tablas heredadas y escenarios de metadatos.

| Escenario | Uso |
| --- | --- |
| Bloque de tabla | Muestra la tabla de datos de origen del registro. |
| Bloque de filtrado | Filtra por tabla de datos de origen. |
| Permisos y flujos de trabajo | Se utiliza como condición para determinar la tabla de origen. |
| Capacidades de metadatos | Identifica la Collection a la que pertenece el registro. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tablas comunes](../../../data-source-main/general-collection.md) — Crea y administra campos en tablas comunes
- [Tablas heredadas](../../../data-source-main/inheritance-collection.md) — Conoce cómo se utilizan las tablas heredadas
- [Selector de tabla de datos](../advanced/collection-select.md) — Selecciona una tabla de datos