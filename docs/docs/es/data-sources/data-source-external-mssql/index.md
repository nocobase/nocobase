---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Fuentes de datos externas - MSSQL"
description: "Aprende a conectar MSSQL/SQL Server a NocoBase como base de datos externa, incluidos las versiones compatibles, la instalación del plugin, la configuración de la conexión, las conexiones cifradas, los permisos y el mapeo de campos."
keywords: "fuente de datos externa,MSSQL,SQL Server,base de datos externa,mapeo de campos,NocoBase"
---

# MSSQL

## Introducción

MSSQL (SQL Server) puede conectarse a NocoBase como base de datos externa. Después de la conexión, NocoBase leerá las tablas, los campos y las vistas de SQL Server, y los utilizará como tablas de datos de la fuente de datos externa.

A diferencia de la [base de datos principal](../data-source-main/index.md), la estructura real de las tablas del MSSQL externo seguirá siendo mantenida por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | SQL Server 2014-2019. |
| Ediciones comerciales | Compatible con las ediciones Standard, Professional y Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-mssql`. |
| Características de conexión | Permite configurar «Encrypt connection» y «Trust server certificate». |

Casos adecuados para utilizar MSSQL externo:

- Conectar las bases de datos de SQL Server de sistemas empresariales existentes, como ERP, MES, WMS y CRM
- Crear una interfaz de administración con NocoBase sin migrar los datos históricos
- Configurar permisos, procesar flujos, corregir datos o mostrar informes de tablas existentes
- Continuar manteniendo la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Atención

El MSSQL externo no es la base de datos del sistema de NocoBase. NocoBase no asumirá la gestión de sus copias de seguridad, restauraciones, migraciones ni cambios en la estructura de las tablas.

:::

## Instalar el plugin

Este plugin es comercial. Para obtener información detallada sobre cómo activarlo, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona MSSQL y completa la información de conexión.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Configuraciones de conexión habituales:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado como referencia en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda utilizar un nombre comprensible para los usuarios empresariales, como «SQL Server del ERP» o «Base de datos financiera». |
| Host / Port | Dirección del host y puerto de SQL Server. El puerto predeterminado suele ser `1433`. |
| Database | Nombre de la base de datos de SQL Server a la que se conectará. |
| Username / Password | Nombre de usuario y contraseña utilizados para conectarse a SQL Server. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no concederá permisos ni leerá objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Encrypt connection | Indica si se habilita la conexión cifrada. Actívalo cuando la base de datos requiera cifrado obligatorio o cuando el canal de red deba estar cifrado. |
| Trust server certificate | Indica si se debe confiar en el certificado del servidor. Puede ser necesario activarlo en entornos de prueba o con certificados autofirmados; en producción se recomienda utilizar un certificado de confianza. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando se activa «Add all collections», NocoBase conectará todas las tablas y vistas del alcance actual; cuando se desactiva, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si esta fuente de datos está habilitada. Si se desactiva, se conservará la configuración de la fuente de datos, pero los bloques de página, los permisos, los flujos de trabajo y las API ya no podrán leer sus datos. |

:::tip Consejo

Si hay muchos objetos en SQL Server, reduce primero el alcance mediante `Database`, `Table prefix` y «Collections». Conecta únicamente las tablas y vistas que utilice la aplicación actual para simplificar posteriormente la configuración de permisos, la creación de páginas y el mantenimiento de la sincronización.

:::

## Seleccionar tablas de datos

Después de completar la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas disponibles en SQL Server. Los resultados dependerán de la cuenta de conexión, `Database`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará habilitado, lo que indica que se conectarán todas las tablas y vistas del alcance actual. Si solo deseas conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas de datos necesarias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atención

Una sola fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si hay muchos objetos en SQL Server, se recomienda reducir primero el alcance mediante `Database`, `Table prefix` o «Collections».

:::

## Synchronización y configuración de campos

La estructura de las tablas del MSSQL externo se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campos ni eliminará campos reales en el SQL Server externo.

Cuando cambie la estructura de las tablas en SQL Server, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información de las tablas de datos, los campos, las claves principales, las claves únicas y el mapeo de tipos de campos almacenada en NocoBase, pero no eliminará las tablas ni los datos reales de SQL Server.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de la relación también se guardarán en NocoBase y no se añadirá automáticamente ningún campo de clave externa real a las tablas de SQL Server.

## Mapeo de tipos de campos

NocoBase mapeará automáticamente los tipos de campos de SQL Server al Field type y al Field interface adecuados. Puedes ajustar la forma de visualización de la interfaz en la configuración del campo.

Mapeos habituales:

| Tipo de campo de SQL Server | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number, Percent. |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`、`NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID, Input. |
| `JSON` | `json`、`array` | JSON. |

:::warning Atención

Los tipos de campos de SQL Server no compatibles se mostrarán por separado en la configuración de campos. Para utilizar este tipo de campos como campos normales en NocoBase, será necesario desarrollar una adaptación.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de página tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con clave principal compuesta, debes establecer manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan consultar, editar o eliminar registros correctamente.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y la gestión de bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso y los métodos de gestión de las fuentes de datos
- [Campos de tablas de datos](../data-modeling/collection-fields/index.md) — Consulta la información sobre los tipos de campos y su mapeo