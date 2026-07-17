---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Fuente de datos externa - MariaDB"
description: "Aprende a conectar MariaDB a NocoBase como base de datos externa, incluidos las versiones compatibles, la instalación del plugin, la configuración de la conexión, el alcance de las tablas, los permisos y la asignación de campos."
keywords: "fuente de datos externa,MariaDB,base de datos externa,asignación de campos,NocoBase"
---

# MariaDB

## Introducción

MariaDB puede conectarse a NocoBase como base de datos externa. Una vez conectada, NocoBase leerá las tablas, los campos y las vistas de MariaDB, y los utilizará como tablas de datos en la fuente de datos externa.

A diferencia de la [base de datos principal](../data-source-main/index.md), la estructura real de las tablas externas de MariaDB sigue siendo gestionada por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de la interfaz, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | MariaDB >= 10.3. |
| Versiones comerciales | Compatible con las ediciones Standard, Professional y Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-mariadb`. |
| Protocolo compatible | Utiliza el protocolo MySQL para la conexión y, en general, aplica la lógica de compatibilidad de MySQL para la asignación de campos. |

La conexión de una base de datos externa MariaDB resulta adecuada en los siguientes casos:

- Conectar las bases de datos MariaDB de sistemas empresariales existentes, como ERP, MES, WMS o CRM
- Crear interfaces de gestión con NocoBase sin migrar los datos históricos
- Configurar permisos, gestionar procesos, corregir datos o mostrar informes de tablas existentes
- Mantener la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Precaución

MariaDB externa no es la base de datos del sistema de NocoBase. NocoBase no se hará cargo de sus copias de seguridad, restauraciones, migraciones ni cambios en la estructura de las tablas.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre su activación, consulta la [guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona MariaDB y, a continuación, completa la información de conexión.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado para referenciarla en bloques de la interfaz, permisos, flujos de trabajo y API. No se puede modificar después de crearla. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda utilizar un nombre que el personal de negocio pueda entender, como «MariaDB del ERP» o «Base de datos de pedidos». |
| Host / Port | Dirección del host y puerto de MariaDB. El puerto predeterminado suele ser `3306`. |
| Database | Nombre de la base de datos MariaDB a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a MariaDB. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no concederá permisos ni leerá objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Después de configurarlo, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando «Add all collections» está activado, NocoBase conectará todas las tablas y vistas del alcance actual; cuando está desactivado, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si la fuente de datos está habilitada. Cuando está deshabilitada, la configuración de la fuente de datos se conserva, pero los bloques de la interfaz, los permisos, los flujos de trabajo y las API ya no pueden leer sus datos. |

:::tip Consejo

Si hay muchos objetos en MariaDB, reduce primero el alcance mediante `Database`, `Table prefix` y «Collections». Conecta únicamente las tablas y vistas que utilice la aplicación actual para simplificar posteriormente la configuración de permisos, la creación de páginas y el mantenimiento de la sincronización.

:::

## Seleccionar tablas de datos

Después de completar la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas disponibles en MariaDB. Los resultados dependerán de la cuenta de conexión, `Database`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará activado, lo que indica que se conectarán todas las tablas y vistas del alcance actual. Si solo quieres conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas necesarias.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Precaución

Una sola fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si hay muchos objetos en MariaDB, se recomienda reducir primero el alcance mediante `Database`, `Table prefix` o «Collections».

:::

## Synchronización y configuración de campos

La estructura de las tablas externas de MariaDB se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campos ni eliminará campos reales en MariaDB externa.

Cuando cambie la estructura de las tablas en MariaDB, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información guardada en NocoBase sobre las tablas de datos, los campos, las claves principales, las claves únicas y la asignación de tipos de campos, pero no eliminará las tablas ni los datos reales de MariaDB.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase; no se añadirán automáticamente campos de clave externa reales a las tablas de MariaDB.

## Asignación de tipos de campos

NocoBase asignará automáticamente los tipos de campos de MariaDB al Field type y al Field interface adecuados. Las asignaciones habituales de campos de MariaDB son básicamente iguales que las de MySQL. Puedes ajustar la forma en que se muestran en la interfaz desde la configuración del campo.

Asignaciones habituales:

| Tipo de campo de MariaDB | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group. |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent. |
| `DECIMAL` | `decimal` | Number、Percent、Currency. |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `YEAR` | `string`、`integer` | Input、Integer、Date. |
| `JSON` | `json`、`array` | JSON. |

:::warning Precaución

Los tipos de campos de MariaDB no compatibles se mostrarán por separado en la configuración de campos. Para utilizar este tipo de campos como campos normales en NocoBase, primero es necesario desarrollar una adaptación.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de la interfaz tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con clave principal compuesta, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de la interfaz no puedan consultar, editar o eliminar registros correctamente.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso y los métodos de gestión de las fuentes de datos
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campos y la asignación de campos