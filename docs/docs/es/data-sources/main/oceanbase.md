---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Fuente de datos principal - OceanBase"
description: "Conoce las versiones compatibles, el método de instalación del plugin, las instrucciones de uso y el mapeo de campos cuando OceanBase se utiliza como base de datos principal de NocoBase."
keywords: "fuente de datos principal,OceanBase,base de datos principal,mapeo de campos,NocoBase"
---

# OceanBase

## Introducción

OceanBase puede utilizarse como base de datos principal de NocoBase para almacenar los datos de las tablas del sistema de NocoBase y los datos empresariales de la fuente de datos principal. La base de datos principal se configura al implementar NocoBase y no se puede eliminar una vez que la aplicación está en funcionamiento.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | >= 4.3. |
| Versión comercial | Compatible con la edición Enterprise. |
| Tipo de base de datos | Modo compatible con MySQL. |

:::warning Nota

Cuando OceanBase se utiliza como base de datos principal, solo se admite el modo compatible con MySQL.

:::

## Instalación del plugin

OceanBase es proporcionado por `@nocobase/plugin-data-source-oceanbase` y requiere una licencia comercial.

## Instrucciones de uso

1. Al implementar NocoBase, selecciona o introduce los parámetros de conexión correspondientes a OceanBase en la configuración de conexión de la base de datos.
2. Después de iniciar NocoBase, entra en la fuente de datos «Main» desde «Gestión de fuentes de datos» para administrar las tablas y los campos de la base de datos principal.
3. Si necesitas conectar tablas que ya existen en la base de datos, puedes utilizar «Sincronizar desde la base de datos» en la página de administración de la base de datos principal.
4. Al configurar los campos de una tabla, puedes consultar los directorios [Tabla de datos](../data-modeling/collection.md) y [Campo](../data-modeling/collection-fields/index.md) para seleccionar el tipo de campo y el componente de campo.

## Mapeo de tipos de campo

En la base de datos principal, al crear campos mediante una página de NocoBase, NocoBase crea los campos correspondientes de OceanBase según la configuración del campo. Al conectar tablas existentes mediante «Sincronizar desde la base de datos», NocoBase identifica los tipos de campo de OceanBase según la lógica de compatibilidad con MySQL y los asigna automáticamente al Field type y al Field interface adecuados. Puedes ajustar la forma de presentación en la interfaz desde la configuración del campo.

Los mapeos habituales son los siguientes:

| Tipo de campo de OceanBase | Field type de NocoBase | Field interface disponibles |
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

:::warning Nota

Los tipos de campo de OceanBase no compatibles se mostrarán por separado en la configuración de campos. Estos campos deberán adaptarse mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

Para consultar más opciones de configuración generales, visita [Introducción a la fuente de datos principal](./index.md).
