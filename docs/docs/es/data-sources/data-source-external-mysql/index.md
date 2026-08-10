---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Fuente de datos externa - MySQL"
description: "Descubre cómo conectar MySQL a NocoBase como base de datos externa, incluidos las versiones compatibles, la instalación del plugin, la configuración de la conexión, el alcance de las tablas, los permisos y el mapeo de campos."
keywords: "fuente de datos externa,MySQL,base de datos externa,mapeo de campos,NocoBase"
---

# MySQL

## Introducción

MySQL puede conectarse a NocoBase como base de datos externa. Una vez conectado, NocoBase leerá las tablas, los campos y las vistas de MySQL, y los utilizará como tablas de datos en la fuente de datos externa.

A diferencia de la [base de datos principal](../data-source-main/index.md), la estructura real de las tablas del MySQL externo sigue siendo mantenida por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | MySQL >= 5.7. |
| Ediciones comerciales | Compatible con las ediciones Estándar, Profesional y Empresarial. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-mysql`. |
| Protocolo compatible | Utiliza el protocolo MySQL para la conexión. |

Escenarios adecuados para usar MySQL externo:

- Conectar las bases de datos MySQL de sistemas empresariales existentes, como ERP, MES, WMS o CRM
- Crear interfaces de gestión con NocoBase sin migrar los datos históricos
- Aplicar controles de permisos, procesar flujos, corregir datos o mostrar informes basados en tablas existentes
- Mantener la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Atención

MySQL externo no es la base de datos del sistema de NocoBase. NocoBase no se hará cargo de sus copias de seguridad, restauraciones, migraciones ni cambios en la estructura de las tablas.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre su activación, consulta la [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Adición de una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona MySQL y completa la información de conexión.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificador de la fuente de datos, utilizado para hacer referencia a ella en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda usar un nombre que los usuarios empresariales puedan entender, como «ERP MySQL» o «Base de datos de pedidos». |
| Host / Port | Dirección del host y puerto de MySQL. El puerto predeterminado suele ser `3306`. |
| Database | Nombre de la base de datos MySQL a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a MySQL. NocoBase solo puede leer los objetos a los que tiene acceso esta cuenta; no concederá permisos ni leerá objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando «Add all collections» está activado, NocoBase conectará todas las tablas y vistas del alcance actual; cuando está desactivado, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si la fuente de datos está activada. Si se desactiva, se conservará su configuración, pero los bloques de página, permisos, flujos de trabajo y API ya no podrán leer sus datos. |

:::tip Consejo

Si MySQL contiene muchos objetos, reduce primero el alcance mediante `Database`, `Table prefix` y «Collections». Conecta únicamente las tablas y vistas que la aplicación actual vaya a utilizar; así, la configuración posterior de permisos, la creación de páginas y el mantenimiento de la sincronización serán más sencillos.

:::

## Selección de tablas de datos

Después de completar la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas disponibles en MySQL. Los resultados dependerán de la cuenta de conexión, `Database`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará activado, lo que indica que se conectarán todas las tablas y vistas del alcance actual. Si solo quieres conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas de datos necesarias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atención

Una sola fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si MySQL contiene muchos objetos, se recomienda reducir primero el alcance mediante `Database`, `Table prefix` o «Collections».

:::

## Sincronización y configuración de campos

La estructura de las tablas de MySQL externo se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará sus tipos ni eliminará campos reales en MySQL externo.

Cuando cambie la estructura de las tablas en MySQL, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información de las tablas de datos, los campos, las claves principales, las claves únicas y el mapeo de tipos de campos guardada en NocoBase, pero no eliminará las tablas ni los datos reales de MySQL.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase, sin añadir automáticamente campos de clave externa reales a las tablas de MySQL.

## Mapeo de tipos de campos

NocoBase asignará automáticamente los tipos de campos de MySQL al Field type y al Field interface adecuados. Puedes ajustar la forma en que se muestran en la interfaz desde la configuración del campo.

Mapeos habituales:

| Tipo de campo de MySQL | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atención

Los tipos de campos de MySQL no compatibles se mostrarán por separado en la configuración de campos. Estos campos deberán adaptarse mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de página tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con clave principal compuesta, deberás configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan ver, editar o eliminar correctamente los registros.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y cómo gestionarlas
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta los tipos de campos y la información sobre el mapeo de campos