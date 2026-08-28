---
title: "UUID"
description: "El campo UUID se utiliza para generar identificadores únicos universales, adecuados para la sincronización con sistemas externos y los escenarios de identificación pública."
keywords: "UUID,identificador único,clave primaria,NocoBase"
---

# UUID

## Introducción

En NocoBase, **UUID (UUID)** se utiliza para generar identificadores únicos UUID.

UUID es adecuado para escenarios como la sincronización entre sistemas, la identificación en API públicas y la importación y exportación de datos. En comparación con los ID autoincrementales, expone menos fácilmente el volumen de datos.

Si solo necesitas la clave primaria predeterminada dentro de NocoBase, normalmente Snowflake ID es suficiente. Si necesitas identificadores cortos, elige [Nano ID](./nano-id.md) o [secuencia](../../../field-sequence/index.md).

## Escenarios aplicables

UUID es adecuado para los siguientes escenarios empresariales:

- ID de sincronización con sistemas externos
- Identificador de API pública
- Identificador de registros migrados entre bases de datos
- ID de registros cuyo patrón incremental no se desea exponer

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «UUID» para crear un campo UUID.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. UUID corresponde a `uuid` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «UUID», «Identificador externo» o «ID público». Se recomienda usar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, los campos UUID son `uuid`. |
| Default value | Valor predeterminado. Al crear un registro, se puede completar automáticamente si el usuario no introduce ningún valor. |
| Validation rules | Normalmente se genera automáticamente y no es necesario validarlo manualmente. |
| Description | Descripción del campo. Es adecuado incluir el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y las API después de su creación. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores debido a modificaciones.

:::

## Características del campo

El comportamiento predeterminado del campo UUID es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `uuid`. |
| Field type predeterminado | `uuid`. |
| Field type opcional | `uuid`. |
| Componente de página | Normalmente se genera automáticamente y no requiere introducción manual. |
| Filtrado | Admite búsquedas exactas por UUID. |
| Ordenación | Admite ordenación, aunque normalmente no se utiliza UUID para ordenar datos empresariales. |
| Validación | Normalmente se genera automáticamente y se mantiene la unicidad. |

## Editar configuración

Después de crearlo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo UUID. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar Field type o Field interface no equivale a modificar simplemente un nombre visible. Afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo UUID. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo UUID creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo UUID es adecuado para escenarios de integración y de identificación pública.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Escenario | Uso |
| --- | --- |
| Crear tabla | Utilizarlo como clave primaria o identificador único. |
| API | Utilizarlo como identificador público de registros. |
| Sincronización de datos | Sincronizar registros entre sistemas. |
| Importación y exportación | Mantener la unicidad de los registros. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Snowflake ID](./snowflake-id.md) — Utilizar el ID Snowflake predeterminado
- [Nano ID](./nano-id.md) — Utilizar un ID aleatorio corto