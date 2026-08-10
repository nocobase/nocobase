---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Fuentes de datos externas - KingbaseES"
description: "Aprende a integrar KingbaseES como base de datos externa en NocoBase, incluidos las versiones compatibles, el modo de compatibilidad con PostgreSQL, la configuración de conexión, los esquemas, los permisos y la asignación de campos."
keywords: "fuente de datos externa,KingbaseES,人大金仓,base de datos externa,modo de compatibilidad con PostgreSQL,asignación de campos,NocoBase"
---

# KingbaseES

## Introducción

KingbaseES se puede integrar en NocoBase como base de datos externa. Después de la integración, NocoBase leerá las tablas, los campos y las vistas de datos de KingbaseES, y los utilizará como tablas de datos de la fuente de datos externa.

A diferencia de la [base de datos principal](../main/index.md), la estructura real de las tablas externas de KingbaseES sigue siendo mantenida por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | KingbaseES >= V9. |
| Versiones comerciales | Compatible con las ediciones Professional y Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-kingbase`. |
| Modo de base de datos | Solo se admite el modo de compatibilidad con PostgreSQL. |

Escenarios adecuados para utilizar KingbaseES como fuente de datos externa:

- Integrar una base de datos empresarial de KingbaseES existente en entornos gubernamentales, empresariales, de intranet o de localización tecnológica
- Crear una interfaz de administración con NocoBase sin migrar los datos históricos
- Aplicar controles de permisos, procesamiento de flujos, correcciones de datos o visualización de informes a tablas existentes
- Continuar manteniendo la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Atención

Cuando KingbaseES se utiliza como base de datos externa, solo se admite el modo de compatibilidad con PostgreSQL. Si la base de datos no está en modo de compatibilidad con PostgreSQL, NocoBase no podrá leer la estructura de las tablas ni los tipos de campos mediante el plugin actual.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre su activación, consulta la [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona KingbaseES y, a continuación, introduce la información de conexión.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado como referencia en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda utilizar un nombre comprensible para los usuarios empresariales, como «KingbaseES gubernamental» o «Base de datos de informes». |
| Host / Port | Dirección del host y puerto de KingbaseES. El puerto depende de la configuración real de la base de datos. |
| Database | Nombre de la base de datos de KingbaseES a la que se desea conectar. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a KingbaseES. NocoBase solo puede leer los objetos a los que tiene acceso esta cuenta; no otorgará permisos ni leerá objetos privados de otras cuentas. |
| Schema | Esquema que se desea leer. Si la base de datos contiene varios esquemas, se recomienda introducir únicamente el esquema que necesite integrarse para el negocio actual. |
| Table prefix | Prefijo de los nombres de las tablas. Después de configurarlo, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la integración. Cuando «Add all collections» está activado, NocoBase integrará todas las tablas y vistas dentro del alcance actual; cuando está desactivado, solo integrará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si se habilita esta fuente de datos. Si se desactiva, se conservará la configuración de la fuente de datos, pero los bloques de página, los permisos, los flujos de trabajo y las API ya no podrán leer sus datos. |

:::tip Consejo

Si hay muchos objetos en KingbaseES, reduce primero el alcance mediante `Schema`, `Table prefix` y «Collections». Integra únicamente las tablas y vistas que utilice la aplicación actual; así se simplificarán posteriormente la configuración de permisos, la creación de páginas y el mantenimiento de la sincronización.

:::

## Seleccionar tablas de datos

Después de introducir la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas de datos disponibles en KingbaseES. Los resultados de la lectura se verán afectados por la cuenta de conexión, `Schema`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará activado, lo que indica que se integrarán todas las tablas y vistas dentro del alcance actual. Si solo deseas integrar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas de datos necesarias.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Atención

Una sola fuente de datos externa puede integrar como máximo 500 tablas o vistas de datos cada vez. Si hay muchos objetos en KingbaseES, se recomienda reducir primero el alcance mediante `Schema`, `Table prefix` o «Collections».

:::

## Synchronizar y configurar campos

La estructura de las tablas externas de KingbaseES se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campos ni eliminará campos reales en KingbaseES.

Cuando cambie la estructura de las tablas en KingbaseES, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información guardada en NocoBase sobre las tablas de datos, los campos, las claves principales, las claves únicas y la asignación de tipos de campos, pero no eliminará las tablas reales ni los datos de KingbaseES.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase y no se añadirán automáticamente campos de clave externa reales a las tablas de KingbaseES.

## Asignación de tipos de campos

NocoBase identificará los tipos de campos de KingbaseES según la lógica de compatibilidad con PostgreSQL y los asignará automáticamente al Field type y al Field interface adecuados. Puedes ajustar la forma de visualización en la configuración del campo.

Asignaciones habituales:

| Tipo de campo de KingbaseES | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Atención

Los tipos de campos de KingbaseES no compatibles se mostrarán por separado en la configuración de campos. Para utilizar este tipo de campos como campos normales en NocoBase, será necesario desarrollar una adaptación.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de página tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si integras una vista, una tabla sin clave principal o una tabla con clave principal compuesta, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan ver, editar o eliminar correctamente los registros.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y los métodos de gestión
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campos y su asignación