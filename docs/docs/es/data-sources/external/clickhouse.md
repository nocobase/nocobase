---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Fuente de datos externa - ClickHouse"
description: "Aprende a conectar ClickHouse a NocoBase como base de datos externa, incluidos el puerto compatible con MySQL, SSL, el alcance de las tablas, los escenarios de análisis de solo lectura y el mapeo de campos."
keywords: "fuente de datos externa,ClickHouse,base de datos externa,puerto compatible con MySQL,informes,mapeo de campos,NocoBase"
---

# ClickHouse

## Introducción

ClickHouse se puede conectar a NocoBase como base de datos externa. Una vez conectado, NocoBase leerá las tablas, los campos y las vistas de ClickHouse, y los utilizará como tablas de datos en la fuente de datos externa.

ClickHouse es más adecuado para consultas analíticas, análisis de registros, estadísticas de métricas y presentación de informes. A diferencia de las bases de datos transaccionales, no es adecuado como fuente de datos para añadir, editar o eliminar con frecuencia registros de negocio en NocoBase.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | ClickHouse >= 20.2. |
| Versión comercial | Compatible con la edición Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-clickhouse`. |
| Método de conexión | Se conecta mediante el puerto compatible con MySQL de ClickHouse. |
| Recomendación de uso | Se utiliza principalmente para consultar, filtrar, realizar estadísticas y mostrar informes. |

Escenarios adecuados para utilizar ClickHouse como fuente de datos externa:

- Conectar datos analíticos, como registros, eventos de seguimiento, métricas y control de riesgos
- Crear paneles operativos, informes estadísticos o páginas de consulta en NocoBase
- Proporcionar al personal de negocio una entrada de consulta de solo lectura para reducir el acceso directo a los clientes de bases de datos
- Controlar los permisos y realizar visualizaciones de datos existentes de ClickHouse

:::warning Atención

Se recomienda utilizar ClickHouse en NocoBase como fuente de datos de análisis de solo lectura. No lo utilices como fuente de datos para escribir tablas de negocio habituales ni configures en las páginas operaciones de creación, edición o eliminación.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre la activación, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona ClickHouse y completa la información de conexión.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificador de la fuente de datos, utilizado como referencia en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda utilizar un nombre comprensible para el personal de negocio, como «Base de datos de registros de ClickHouse» o «Base de datos de métricas». |
| Host / Port | Dirección del host de ClickHouse y puerto compatible con MySQL. No introduzcas el puerto HTTP ni el puerto TCP nativo. |
| Database | Nombre de la base de datos de ClickHouse a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a ClickHouse. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no otorgará permisos ni leerá objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Use SSL | Indica si se habilita SSL. Normalmente es necesario habilitarlo al conectarse a ClickHouse Cloud o a un entorno con conexión segura. |
| Enabled the data source | Indica si se habilita esta fuente de datos. Al desactivarla, la configuración de la fuente de datos se conservará, pero los bloques de página, permisos, flujos de trabajo y API ya no podrán leer sus datos. |

:::tip Consejo

El plugin de ClickHouse se conecta mediante el protocolo compatible con MySQL. Antes de configurarlo, confirma que el servicio de ClickHouse tenga habilitado el puerto compatible con MySQL y que la red, el firewall y los permisos de la cuenta permitan el acceso de NocoBase.

:::

## Alcance de la conexión

La página de ClickHouse no proporciona una tabla de selección de «Collections». El alcance de la conexión está controlado principalmente por `Database`, los permisos de la cuenta de conexión y `Table prefix`.

Si hay muchas tablas en ClickHouse, se recomienda preparar una base de datos, una cuenta o un prefijo de nombres de tablas específicos para NocoBase, y exponer únicamente las tablas que la aplicación actual necesita consultar y analizar.

:::warning Atención

Una sola fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si hay muchos objetos en ClickHouse, se recomienda restringir primero el alcance mediante la base de datos, los permisos de la cuenta o `Table prefix`.

:::

## S sincronización y configuración de campos

La estructura de las tablas de ClickHouse externo se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campo ni eliminará campos reales en ClickHouse externo.

Cuando cambie la estructura de las tablas en ClickHouse, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información de las tablas de datos, los campos, las claves principales, las claves únicas y el mapeo de tipos de campo almacenada en NocoBase, pero no eliminará las tablas reales ni los datos de ClickHouse.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase; no se añadirán automáticamente campos de clave externa reales en las tablas de ClickHouse.

## Mapeo de tipos de campo

NocoBase convierte los tipos de campo de ClickHouse a un estilo compatible con MySQL y, a continuación, los asigna al Field type y al Field interface adecuados. Puedes ajustar la forma de presentación en la configuración del campo.

Mapeos habituales:

| Tipo de campo de ClickHouse | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Mapear según el tipo de campo interno | Depende del tipo de campo interno. |
| `LowCardinality(...)` | Mapear según el tipo de campo interno | Depende del tipo de campo interno. |

:::warning Atención

Algunos tipos analíticos o anidados de ClickHouse pueden no asignarse directamente a campos de negocio normales. Si encuentras un tipo de campo no compatible, puedes crear primero en ClickHouse una vista o tabla de consulta adecuada para la presentación y, después, conectarla a NocoBase.

:::

## Clave principal e identificador único del registro

La clave de ordenación y la clave de partición de ClickHouse no tienen por qué coincidir con el identificador único de negocio. Para las tablas de datos utilizadas en bloques de página, se recomienda preparar un campo que permita localizar un registro de forma única.

Si conectas una tabla o vista sin un campo único, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan mostrar correctamente los detalles de los registros y tampoco será adecuado configurar operaciones de edición o eliminación.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta la entrada de las fuentes de datos y cómo gestionarlas
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campo y el mapeo de campos