---
pkg: "@nocobase/plugin-data-source-manager"
title: "Fuente de datos principal - MariaDB"
description: "Conoce las versiones compatibles, la instalación del plugin, las instrucciones de uso y el mapeo de campos de MariaDB como base de datos principal de NocoBase."
keywords: "fuente de datos principal,MariaDB,base de datos principal,mapeo de campos,NocoBase"
---

# MariaDB

## Introducción

MariaDB se puede utilizar como base de datos principal de NocoBase para almacenar los datos de las tablas del sistema de NocoBase y los datos empresariales de la fuente de datos principal. La base de datos principal se configura al desplegar NocoBase y no se puede eliminar una vez que la aplicación está en funcionamiento.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | >= 10.9. |
| Ediciones comerciales | Compatible con las ediciones Community, Standard, Professional y Enterprise. |
| Tipo de base de datos | MariaDB. |

MariaDB es similar a MySQL y resulta adecuada como base de datos principal para sistemas empresariales convencionales.

## Instalación del plugin

MariaDB es una funcionalidad integrada y no requiere la instalación de un plugin independiente.

## Instrucciones de uso

1. Al desplegar NocoBase, selecciona o introduce los parámetros de conexión correspondientes a MariaDB en la configuración de conexión de la base de datos.
2. Después de iniciar NocoBase, accede a la fuente de datos «Main» desde «Gestión de fuentes de datos» para administrar las tablas y los campos de la base de datos principal.
3. Si necesitas conectar tablas que ya existen en la base de datos, puedes utilizar «Sincronizar desde la base de datos» en la página de gestión de la base de datos principal.
4. Al configurar los campos de una tabla, puedes consultar los directorios de [tablas](../data-modeling/collection.md) y [campos](../data-modeling/collection-fields/index.md) para seleccionar los tipos de campo y los componentes de campo.

## Mapeo de tipos de campo

Al crear campos mediante las páginas de NocoBase en la base de datos principal, NocoBase crea los campos correspondientes de MariaDB según la configuración de los campos. Al conectar tablas existentes mediante «Sincronizar desde la base de datos», NocoBase asigna automáticamente los tipos de campo de MariaDB al Field type y al Field interface adecuados. El mapeo de campos habituales de MariaDB es básicamente igual que el de MySQL; puedes ajustar la forma de visualización en la configuración de los campos.

Los mapeos habituales son los siguientes:

| Tipo de campo de MariaDB | NocoBase Field type | Field interface disponibles |
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

:::warning Nota

Los tipos de campo de MariaDB no compatibles se mostrarán por separado en la configuración de campos. Estos campos deben adaptarse mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

Para consultar más configuraciones generales, visita [Introducción a la fuente de datos principal](./index.md).
