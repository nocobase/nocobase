---
title: "Base de datos externa"
description: "Base de datos externa de NocoBase: conecta bases de datos MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris existentes, lee las estructuras de las tablas, configura la asignación de campos y los campos de relación."
keywords: "base de datos externa,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,sincronización de tablas,asignación de campos,NocoBase"
---

# Base de datos externa

## Introducción

Las bases de datos externas permiten integrar en NocoBase bases de datos empresariales existentes, leer sus tablas, campos y vistas, y utilizar estas tablas en bloques de página, permisos, flujos de trabajo y API.

A diferencia de la [base de datos principal](../main/index.md), la estructura de las tablas de una base de datos externa se mantiene en el sistema original o mediante el cliente de la base de datos. NocoBase se encarga de leer la estructura de las tablas y las vistas, pero no modifica la estructura real de las tablas de la base de datos externa.

Las versiones de base de datos y las ediciones comerciales compatibles son las siguientes:

| Base de datos | Versiones compatibles | Edición Community | Edición Standard | Edición Professional | Edición Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | Según la documentación del complemento correspondiente | ❌ | ❌ | ❌ | ✅ |
| Doris | Según la documentación del complemento correspondiente | ❌ | ❌ | ❌ | ✅ |

:::tip Aviso

KingbaseES solo admite el modo compatible con PostgreSQL; OceanBase, ClickHouse y Doris solo admiten el modo compatible con MySQL.

:::

Casos de uso de las bases de datos externas:

- Conectar las bases de datos de sistemas empresariales existentes, como ERP, MES o WMS antiguos, y aprovechar las capacidades de NocoBase para crear rápidamente interfaces de gestión, controles de permisos, flujos de trabajo e informes sin modificar la estructura de las tablas de la base de datos original.
- Añadir capacidades de aplicaciones ligeras a sistemas existentes, como aprobaciones, corrección de datos, gestión de excepciones y paneles operativos, sin necesidad de sustituir el sistema original.
- Realizar consultas de solo lectura, análisis estadísticos o visualizaciones de BI sobre bases de datos existentes, reduciendo la dependencia de las páginas del sistema empresarial original.
- Migrar sistemas históricos por etapas: conectar primero la base de datos antigua en NocoBase para seguir utilizándola y, posteriormente, mantener los nuevos datos empresariales en la base de datos principal.
- La estructura de la base de datos continúa siendo mantenida por el DBA, los scripts de migración o el sistema empresarial original; NocoBase solo se encarga de leer la estructura, configurar la interfaz y utilizar los datos.

:::warning Atención

La base de datos externa no es la base de datos del sistema NocoBase. NocoBase no se encarga de las copias de seguridad, restauraciones, migraciones ni de la estructura de las tablas de la base de datos externa; estas tareas deben seguir gestionándose en la base de datos externa.

:::

## Instalación del complemento

Las bases de datos externas son proporcionadas por los complementos de fuente de datos correspondientes. Después de instalar y activar el complemento, se puede seleccionar el tipo de base de datos correspondiente en el menú «Add new» de «Gestión de fuentes de datos».

| Base de datos | Complemento correspondiente | Método de instalación |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Se requiere una licencia comercial; instale y active el complemento para utilizarlo. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Si el tipo de base de datos de destino no aparece en el menú «Add new», normalmente es necesario comprobar primero lo siguiente:

- Si el complemento correspondiente está instalado
- Si el complemento está activado
- Si la licencia comercial actual incluye este complemento
- Si el usuario actual tiene permisos para gestionar fuentes de datos


## Instrucciones de uso

### Añadir una base de datos externa

Después de activar el complemento, se puede seleccionar y añadir la base de datos desde el menú desplegable «Add new» de la gestión de fuentes de datos.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Introduzca la información de la base de datos que desea conectar.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### S sincronización de tablas

Una vez establecida la conexión con la base de datos externa, se leerán directamente todas las tablas de la fuente de datos. Las bases de datos externas no permiten añadir tablas ni modificar directamente la estructura de las tablas. Si necesita realizar modificaciones, hágalo mediante un cliente de base de datos y, a continuación, haga clic en el botón «Actualizar» de la interfaz para sincronizarlas.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurar campos

La base de datos externa lee automáticamente los campos de las tablas existentes y los muestra. Puede consultar y configurar rápidamente el título, el tipo de datos (Field type) y el tipo de interfaz de usuario (Field interface) de los campos. También puede hacer clic en el botón «Editar» para modificar más opciones.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Dado que las bases de datos externas no permiten modificar la estructura de las tablas, al añadir campos solo están disponibles los campos de relación. Los campos de relación no son campos reales, sino que se utilizan para establecer conexiones entre tablas.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Para obtener más información, consulte el capítulo [Campos de la tabla de datos / Descripción general](../data-modeling/collection-fields/index.md).

### Asignación de tipos de campo

NocoBase asigna automáticamente los tipos de campo de la base de datos externa a los tipos de datos correspondientes (Field type) y a los tipos de interfaz de usuario (Field Interface).

- Tipo de datos (Field type): define el tipo, el formato y la estructura de los datos que puede almacenar un campo;
- Tipo de interfaz de usuario (Field interface): hace referencia al tipo de control utilizado en la interfaz de usuario para mostrar e introducir valores de campo.

| PostgreSQL | MySQL/MariaDB | Tipo de datos de NocoBase | Tipo de interfaz de NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipos de campo no compatibles

Los tipos de campo no compatibles se muestran por separado. Estos campos solo se pueden utilizar después de desarrollar la adaptación correspondiente.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Identificador único del registro

Las tablas de datos utilizadas para mostrar bloques deben tener una «clave única del registro» (Record unique key). La clave única del registro se utiliza para localizar un registro en los bloques de página; normalmente se selecciona la clave primaria o un campo único.

En el caso de vistas, tablas sin clave primaria o tablas con claves primarias compuestas, es necesario configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan crearse correctamente ni mostrar o editar registros. Para obtener más información, consulte [Tabla normal / Editar configuración](../data-source-main/general-collection.md#编辑配置).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)