---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Fuente de datos externa - Doris"
description: "Aprende a integrar Doris como base de datos externa en NocoBase, incluidos el puerto compatible con MySQL, FE query_port, el alcance de las tablas, los escenarios de análisis de solo lectura y la asignación de campos."
keywords: "fuente de datos externa,Doris,base de datos externa,puerto compatible con MySQL,FE query_port,informes,asignación de campos,NocoBase"
---

# Doris

## Introducción

Doris se puede integrar en NocoBase como base de datos externa. Una vez integrada, NocoBase leerá las tablas, los campos y las vistas de datos de Doris, y los utilizará como tablas de datos de la fuente de datos externa.

Doris es más adecuado para consultas analíticas, detalles de tablas anchas, estadísticas de indicadores y visualización de informes. A diferencia de las bases de datos transaccionales, no es adecuado como fuente de datos para añadir, editar o eliminar con frecuencia registros empresariales en NocoBase.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | Doris >= 2.1.0. |
| Versión comercial | Compatible con la edición Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-doris`. |
| Método de conexión | Utiliza el puerto compatible con MySQL de Doris, es decir, FE query_port. |
| Recomendación de uso | Principalmente para consultar, filtrar, realizar estadísticas y mostrar informes. |

Escenarios adecuados para utilizar Doris como fuente externa:

- Integrar tablas de detalles, tablas agregadas, tablas anchas o tablas de indicadores del almacén de datos
- Crear paneles operativos, informes estadísticos o páginas de consulta en NocoBase
- Proporcionar al personal empresarial un punto de acceso de consulta de solo lectura para reducir el acceso directo a través de clientes de bases de datos
- Aplicar controles de permisos y visualización a datos existentes de Doris

:::warning Nota

Se recomienda utilizar Doris en NocoBase como fuente de datos analíticos de solo lectura. No lo utilices como fuente de datos para escribir en tablas empresariales convencionales, ni se recomienda configurar operaciones de creación, edición o eliminación en las páginas.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre cómo activarlo, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Agregar una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona Doris y completa la información de conexión.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificador de la fuente de datos, utilizado para hacer referencia a ella en bloques de página, permisos, flujos de trabajo y API. No se puede modificar después de la creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda utilizar un nombre que el personal empresarial pueda entender, como «Almacén de datos Doris» o «Base de indicadores». |
| Host / Port | Dirección FE de Doris y puerto compatible con MySQL, es decir, `query_port`. No introduzcas el puerto HTTP. |
| Database | Nombre de la base de datos de Doris a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a Doris. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no concederá permisos ni leerá objetos privados de otras cuentas. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas de datos que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Enabled the data source | Indica si se habilita esta fuente de datos. Al deshabilitarla, se conservará la configuración de la fuente, pero los bloques de página, permisos, flujos de trabajo y API ya no podrán leer sus datos. |

:::tip Sugerencia

El plugin de Doris se conecta mediante el protocolo compatible con MySQL. Antes de configurarlo, confirma que `query_port` del FE de Doris sea accesible desde NocoBase y que la cuenta tenga permisos para leer los metadatos de la base de datos, las tablas y las columnas de destino.

:::

## Alcance de la integración

La página de Doris no proporciona una tabla de selección de «Collections». El alcance de la integración está controlado principalmente por `Database`, los permisos de la cuenta de conexión y `Table prefix`.

Si hay muchas tablas en Doris, se recomienda preparar primero una base de datos, una cuenta o un prefijo de nombres de tabla específico para NocoBase, y exponer únicamente las tablas que la aplicación actual necesita consultar y analizar.

:::warning Nota

Una sola fuente de datos externa puede integrar como máximo 500 tablas o vistas de datos a la vez. Si hay muchos objetos en Doris, se recomienda reducir primero el alcance mediante la base de datos, los permisos de la cuenta o `Table prefix`.

:::

## Synchronización y configuración de campos

La estructura de las tablas externas de Doris se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campo ni eliminará campos reales en Doris.

Cuando cambie la estructura de las tablas en Doris, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información de las tablas de datos, los campos, las claves principales, las claves únicas y la asignación de tipos de campo guardada en NocoBase, pero no eliminará las tablas ni los datos reales de Doris.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de relación también se guardarán en NocoBase y no se añadirá automáticamente ningún campo de clave foránea real a las tablas de Doris.

## Asignación de tipos de campo

NocoBase asignará los tipos de campo de Doris al Field type y Field interface adecuados según la lógica compatible con MySQL y los tipos específicos de Doris. Puedes ajustar la forma de visualización de la interfaz en la configuración del campo.

Asignaciones habituales:

| Tipo de campo de Doris | NocoBase Field type | Field interface opcional |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` es un tipo dinámico proporcionado por Apache Doris a partir de la versión 2.1.0. Si utilizas una versión de Doris anterior a la 2.1.0, no podrás integrar este tipo de campos.

:::warning Nota

Los tipos de estado de agregación, los tipos semiestructurados y los tipos complejos de Doris son más adecuados para la visualización o la depuración, y no necesariamente para utilizarlos como campos de entrada en formularios. Cuando encuentres tipos complejos, se recomienda preparar en Doris vistas o tablas de detalles más adecuadas para la consulta empresarial y, después, integrarlas en NocoBase.

:::

## Clave principal e identificador único de los registros

El modelo de datos y el modelo de claves de Doris no necesariamente equivalen al identificador único empresarial. Para las tablas de datos que se muestran en bloques de página, sigue siendo recomendable preparar un campo que permita localizar de forma única cada registro.

Si integras una tabla o vista sin un campo único, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan consultar correctamente los detalles de los registros, y tampoco será adecuado configurar operaciones de edición o eliminación.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y los métodos para gestionarlas
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campo y la asignación de campos