---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Fuente de datos externa - PostgreSQL"
description: "Aprende a conectar PostgreSQL a NocoBase como base de datos externa, incluidos las versiones compatibles, la instalación del plugin, la configuración de la conexión, el esquema, SSL, los permisos y la asignación de campos."
keywords: "fuente de datos externa,PostgreSQL,base de datos externa,Schema,SSL,asignación de campos,NocoBase"
---

# PostgreSQL

## Introducción

PostgreSQL puede conectarse a NocoBase como base de datos externa. Una vez conectado, NocoBase leerá las tablas, los campos y las vistas de PostgreSQL, y los utilizará como tablas de datos en la fuente de datos externa.

A diferencia de la [base de datos principal](../main/index.md), la estructura real de las tablas de PostgreSQL externa seguirá siendo mantenida por el sistema empresarial original, los clientes de bases de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los flujos de trabajo y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | PostgreSQL >= 9.5. |
| Versiones comerciales | Compatible con las ediciones estándar, profesional y empresarial. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-postgres`. |

Escenarios adecuados para usar PostgreSQL externo:

- Conectar las bases de datos PostgreSQL de sistemas empresariales existentes, como ERP, MES, WMS o CRM
- Crear interfaces de gestión con NocoBase sin migrar los datos históricos
- Configurar permisos, procesar flujos, corregir datos o mostrar informes de tablas existentes
- Mantener la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Nota

PostgreSQL externo no es la base de datos del sistema de NocoBase. NocoBase no se hará cargo de sus copias de seguridad, restauraciones, migraciones ni cambios en la estructura de las tablas.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre su activación, consulta la [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona PostgreSQL y completa la información de conexión.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Configuraciones de conexión habituales:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado como referencia en los bloques de página, los permisos, los flujos de trabajo y las API. No se puede modificar después de su creación. |
| Data source display name | Nombre con el que se muestra la fuente de datos en la interfaz. Se recomienda usar un nombre comprensible para los usuarios de negocio, como «PostgreSQL del ERP» o «Base de datos de informes». |
| Host / Port | Dirección del host y puerto de PostgreSQL. El puerto predeterminado suele ser `5432`. |
| Database | Nombre de la base de datos PostgreSQL a la que se conectará. |
| Username / Password | Cuenta y contraseña utilizadas para conectarse a PostgreSQL. NocoBase solo puede leer los objetos a los que esta cuenta tiene permiso de acceso; no otorgará permisos ni leerá objetos privados de otras cuentas. |
| Schema | Esquema de PostgreSQL que se leerá, por ejemplo, `public`. Si la base de datos contiene varios esquemas, se recomienda especificar únicamente el esquema necesario para el negocio actual. |
| Table prefix | Prefijo de los nombres de las tablas. Una vez configurado, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando se activa «Add all collections», NocoBase conectará todas las tablas y vistas del alcance actual; cuando se desactiva, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si esta fuente de datos está habilitada. Al deshabilitarla, se conservará su configuración, pero los bloques de página, los permisos, los flujos de trabajo y las API ya no podrán leer sus datos. |
| SSL options | Configuración de la conexión SSL de PostgreSQL. Permite establecer el modo SSL, indicar si se rechazan los certificados no autorizados y especificar las rutas de los certificados de CA, el certificado de cliente y la clave de cliente. |

:::tip Consejo

Si PostgreSQL contiene muchos objetos, reduce primero el alcance mediante `Schema`, `Table prefix` y «Collections». Conecta únicamente las tablas y vistas que utilice la aplicación actual para simplificar la configuración posterior de permisos, la creación de páginas y el mantenimiento de la sincronización.

:::

## Seleccionar tablas de datos

Después de completar la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas disponibles en PostgreSQL. Los resultados dependerán de la cuenta de conexión, `Schema`, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» estará activado, lo que indica que se conectarán todas las tablas y vistas del alcance actual. Si solo quieres conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas necesarias.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Nota

Una sola fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si PostgreSQL contiene muchos objetos, se recomienda reducir primero el alcance mediante `Schema`, `Table prefix` o «Collections».

:::

## S sincronización y configuración de campos

La estructura de las tablas de PostgreSQL externo se mantiene en el lado de la base de datos. NocoBase no creará campos, modificará tipos de campos ni eliminará campos reales en PostgreSQL externo.

Cuando cambie la estructura de las tablas en PostgreSQL, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará en NocoBase las tablas de datos, los campos, las claves principales, las claves únicas y la información de asignación de tipos de campos guardados, pero no eliminará las tablas reales ni los datos de PostgreSQL.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de la relación también se guardarán en NocoBase; no se añadirá automáticamente ningún campo de clave foránea real en las tablas de PostgreSQL.

## Asignación de tipos de campos

NocoBase asignará automáticamente los tipos de campos de PostgreSQL al Field type y Field interface adecuados. Puedes ajustar la forma de visualización en la configuración del campo.

Asignaciones habituales:

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

Los tipos de campos de PostgreSQL no compatibles se mostrarán por separado en la configuración de campos. Para utilizar estos campos como campos normales en NocoBase, será necesario desarrollar una adaptación.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de página tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con clave principal compuesta, deberás configurar manualmente «Record unique key» en la configuración de la tabla de datos. Sin un identificador único disponible, es posible que los bloques de página no puedan ver, editar o eliminar correctamente los registros.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y su gestión
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campos y la asignación de campos