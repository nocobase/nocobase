---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Fuentes de datos externas - OceanBase"
description: "Aprende a conectar OceanBase a NocoBase como base de datos externa, incluidos las versiones compatibles, el modo de compatibilidad con MySQL, la configuración de la conexión, el alcance de las tablas, los permisos y la asignación de campos."
keywords: "fuentes de datos externas,OceanBase,base de datos externa,modo de compatibilidad con MySQL,asignación de campos,NocoBase"
---

# OceanBase

## Introducción

OceanBase puede conectarse a NocoBase como base de datos externa. Después de la conexión, NocoBase leerá las tablas, los campos y las vistas de OceanBase, y los utilizará como tablas de datos de la fuente de datos externa.

A diferencia de la [base de datos principal](../main/index.md), la estructura real de las tablas de OceanBase externa sigue siendo mantenida por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | OceanBase >= 4.3. |
| Versión comercial | Compatible con la edición Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-oceanbase`. |
| Modo de base de datos | Solo se admite el modo de compatibilidad con MySQL. |

Casos adecuados para utilizar OceanBase externa:

- Conectar una base de datos empresarial existente en un tenant de OceanBase con compatibilidad con MySQL
- Crear una interfaz de administración con NocoBase sin migrar los datos históricos
- Controlar los permisos, procesar flujos, corregir datos o mostrar informes de tablas existentes
- Continuar manteniendo la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Atención

Cuando OceanBase se utiliza como base de datos externa, solo se admite el modo de compatibilidad con MySQL. Si se utiliza el modo de compatibilidad con Oracle, NocoBase no podrá leer la estructura de las tablas ni los tipos de campos mediante el plugin actual.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre la activación, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona OceanBase y, a continuación, introduce la información de conexión.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Configuraciones de conexión habituales:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado para hacer referencia a ella en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre de la fuente de datos que se muestra en la interfaz. Se recomienda utilizar un nombre que el personal empresarial pueda entender, como «Base de datos empresarial de OceanBase» o «Base de datos de informes». |
| Host / Port | Dirección y puerto de conexión de OceanBase en modo de compatibilidad con MySQL. El puerto depende de la configuración real del tenant o del proxy. |
| Database | Nombre de la base de datos de OceanBase a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a OceanBase. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no concede permisos ni lee objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando «Add all collections» está activado, NocoBase conectará todas las tablas y vistas del alcance actual; cuando está desactivado, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si esta fuente de datos está habilitada. Cuando está deshabilitada, se conserva la configuración de la fuente de datos, pero los bloques de página, los permisos, los flujos de trabajo y las API ya no pueden leer sus datos. |

:::tip Consejo

Si hay muchos objetos en OceanBase, reduce primero el alcance mediante `Database`, `Table prefix` y «Collections». Conecta solo las tablas y vistas que utilizará la aplicación actual; así, la configuración posterior de permisos, la creación de páginas y el mantenimiento de la sincronización serán más sencillos.

:::

## Seleccionar tablas de datos

Después de introducir la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas de datos y vistas disponibles en OceanBase. Los resultados de la lectura se verán afectados por la cuenta de conexión, `Database`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará habilitado, lo que indica que se conectarán todas las tablas y vistas del alcance actual. Si solo quieres conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas de datos o vistas necesarias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atención

Una sola fuente de datos externa puede conectar como máximo 500 tablas de datos o vistas a la vez. Si hay muchos objetos en OceanBase, se recomienda reducir primero el alcance mediante `Database`, `Table prefix` o «Collections».

:::

## Sincronizar y configurar campos

La estructura de las tablas de OceanBase externa se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campos ni eliminará campos reales en OceanBase externa.

Cuando cambie la estructura de las tablas en OceanBase, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información de las tablas de datos, los campos, las claves principales, las claves únicas y las asignaciones de tipos de campos guardada en NocoBase, pero no eliminará las tablas reales ni los datos de OceanBase.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase; no se añadirá automáticamente ningún campo de clave externa real a las tablas de OceanBase.

## Asignación de tipos de campos

NocoBase identificará los tipos de campos de OceanBase según la lógica de compatibilidad con MySQL y los asignará automáticamente al Field type y al Field interface adecuados. Puedes ajustar la forma de visualización en la configuración del campo.

Asignaciones habituales:

| Tipo de campo de OceanBase | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atención

Los tipos de campos de OceanBase no compatibles se mostrarán por separado en la configuración de campos. Estos campos deberán adaptarse mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

## Clave principal e identificador único de los registros

Para las tablas de datos utilizadas para mostrar y editar bloques de página, se recomienda disponer de una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con una clave principal compuesta, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan ver, editar o eliminar correctamente los registros.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y cómo gestionarlas
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campos y la asignación de campos