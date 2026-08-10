---
pkg: "@nocobase/plugin-data-source-manager"
title: "Fuente de datos principal - PostgreSQL"
description: "Conoce las versiones compatibles, la instalación del complemento, las instrucciones de uso y la asignación de campos cuando PostgreSQL se utiliza como base de datos principal de NocoBase."
keywords: "fuente de datos principal,PostgreSQL,base de datos principal,asignación de campos,NocoBase"
---

# PostgreSQL

## Introducción

PostgreSQL se puede utilizar como base de datos principal de NocoBase para almacenar los datos de las tablas del sistema de NocoBase y los datos empresariales de la fuente de datos principal. La base de datos principal se configura al implementar NocoBase y no se puede eliminar una vez que la aplicación está en ejecución.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | >= 10. |
| Ediciones comerciales | Compatible con las ediciones Community, Standard, Professional y Enterprise. |
| Tipo de base de datos | PostgreSQL. |

PostgreSQL admite tablas heredadas, por lo que es adecuado para escenarios que requieren la herencia de modelos de datos.

## Instalación del complemento

La compatibilidad con PostgreSQL está integrada y no requiere la instalación de un complemento por separado.

## Instrucciones de uso

1. Al implementar NocoBase, selecciona o introduce los parámetros de conexión correspondientes a PostgreSQL en la configuración de conexión de la base de datos.
2. Después de iniciar NocoBase, accede a la fuente de datos «Main» desde «Gestión de fuentes de datos» para administrar las tablas y los campos de la base de datos principal.
3. Si necesitas conectar tablas que ya existen en la base de datos, puedes utilizar «Sincronizar desde la base de datos» en la página de gestión de la base de datos principal.
4. Al configurar los campos de una tabla, puedes consultar los directorios [tabla de datos](../data-modeling/collection.md) y [campo](../data-modeling/collection-fields/index.md) para seleccionar los tipos de campo y los componentes de campo.

## Asignación de tipos de campo

En la base de datos principal, al crear campos mediante la página de NocoBase, NocoBase crea los campos correspondientes de PostgreSQL según la configuración del campo. Al conectar tablas existentes mediante «Sincronizar desde la base de datos», NocoBase asigna automáticamente los tipos de campo de PostgreSQL al Field type y al Field interface adecuados. Puedes ajustar la forma de presentación en la configuración del campo.

Las asignaciones más comunes son las siguientes:

| Tipo de campo de PostgreSQL | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Nota

Los tipos de campo de PostgreSQL no compatibles se muestran por separado en la configuración de campos. Estos campos requieren una adaptación mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

Para consultar más opciones de configuración generales, visita [Introducción a la fuente de datos principal](./index.md).
