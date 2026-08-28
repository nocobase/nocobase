---
title: "Base de datos externa"
description: "Base de datos externa de NocoBase: conecta bases de datos MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris existentes, lee las estructuras de las tablas de datos y configura asignaciones de campos y campos de relación."
keywords: "base de datos externa,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,sincronización de tablas de datos,asignación de campos,NocoBase"
---

# Base de datos externa

## Introducción

La base de datos externa permite conectar bases de datos empresariales existentes a NocoBase, leer sus tablas de datos, campos y vistas, y utilizar estas tablas en bloques de página, permisos, flujos de trabajo y API.

A diferencia de la [base de datos principal](../data-source-main/index.md), la estructura de las tablas de la base de datos externa es mantenida por el sistema original o el cliente de la base de datos. NocoBase se encarga de leer la estructura de las tablas y las vistas, pero no modifica la estructura real de las tablas de la base de datos externa.

Las versiones de bases de datos y las ediciones comerciales compatibles con las bases de datos externas son las siguientes:

| Base de datos | Versiones compatibles | Edición comunitaria | Edición estándar | Edición profesional | Edición empresarial |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | >= 20.2 | ❌ | ❌ | ❌ | ✅ |
| Doris | >= 2.1.0 | ❌ | ❌ | ❌ | ✅ |

:::tip Nota

KingbaseES solo admite el modo compatible con PostgreSQL; OceanBase, ClickHouse y Doris solo admiten el modo compatible con MySQL.

:::

Escenarios aplicables de las bases de datos externas:

- Conectar las bases de datos de sistemas empresariales existentes, como ERP, MES o WMS antiguos, y aprovechar las capacidades de NocoBase para crear rápidamente interfaces de gestión, controles de permisos, flujos de trabajo e informes sin modificar la estructura de las tablas de la base de datos original.
- Añadir capacidades de aplicaciones ligeras a sistemas existentes, como aprobaciones, corrección de datos, gestión de excepciones y paneles operativos, sin necesidad de sustituir el sistema original.
- Realizar consultas de solo lectura, análisis estadísticos o presentaciones de BI sobre bases de datos existentes para reducir la dependencia de las páginas del sistema empresarial original.
- Migrar sistemas históricos por fases: conectar primero la base de datos antigua a NocoBase para seguir utilizándola y, posteriormente, mantener los datos de los nuevos negocios en la base de datos principal.
- La estructura de la base de datos sigue siendo mantenida por el DBA, los scripts de migración o el sistema empresarial original; NocoBase solo se encarga de leer la estructura, configurar la interfaz y utilizar los datos.

:::warning Atención

La base de datos externa no es la base de datos del sistema de NocoBase. NocoBase no se encarga de las copias de seguridad, restauraciones, migraciones ni de la estructura de las tablas de la base de datos externa. Estas tareas deben seguir realizándose en la base de datos externa.

:::

## Instalación del plugin

Las bases de datos externas son proporcionadas por los plugins de las fuentes de datos correspondientes. Después de instalar y activar el plugin, puedes seleccionar el tipo de base de datos correspondiente en el menú «Add new» de «Gestión de fuentes de datos».

| Base de datos | Plugin correspondiente | Método de instalación |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Se requiere una licencia comercial. Instala y activa el plugin para utilizarlo. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Si el tipo de base de datos de destino no aparece en el menú «Add new», normalmente debes comprobar primero:

- Si el plugin correspondiente ya está instalado
- Si el plugin ya está activado
- Si la licencia comercial actual incluye este plugin
- Si el usuario actual tiene permisos para gestionar las fuentes de datos


## Instrucciones de uso

### Añadir una base de datos externa

Después de activar el plugin, puedes seleccionarlo y añadirlo desde el menú desplegable «Add new» de la gestión de fuentes de datos.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Introduce la información de la base de datos que deseas conectar.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sincronización de tablas de datos

Después de establecer la conexión con la base de datos externa, se leerán directamente todas las tablas de datos de la fuente de datos. Las bases de datos externas no permiten añadir tablas de datos ni modificar directamente la estructura de las tablas. Si necesitas realizar modificaciones, hazlo mediante un cliente de base de datos y, posteriormente, haz clic en el botón «Actualizar» de la interfaz para sincronizarlas.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurar campos

La base de datos externa leerá automáticamente los campos de las tablas de datos existentes y los mostrará. Puedes consultar y configurar rápidamente el título, el tipo de datos (Field type) y el tipo de interfaz de usuario (Field interface) de los campos. También puedes hacer clic en el botón «Editar» para modificar más opciones.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Como las bases de datos externas no permiten modificar la estructura de las tablas, al añadir campos solo están disponibles los campos de relación. Los campos de relación no son campos reales, sino que se utilizan para establecer conexiones entre tablas.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Para obtener más información, consulta el capítulo [Campos de tablas de datos / Descripción general](../data-modeling/collection-fields/index.md).

### Asignación de tipos de campos

NocoBase asigna automáticamente los tipos de campos de las bases de datos externas a los tipos de datos correspondientes (Field type) y a los tipos de interfaz de usuario (Field Interface).

- Tipo de datos (Field type): se utiliza para definir los tipos, formatos y estructuras de datos que puede almacenar un campo;
- Tipo de interfaz de usuario (Field interface): se refiere al tipo de control utilizado para mostrar e introducir valores de campo en la interfaz de usuario.

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

### Tipos de campos no compatibles

Los tipos de campos no compatibles se mostrarán por separado. Estos campos solo podrán utilizarse después de adaptar el desarrollo.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Identificador único del registro

Las tablas de datos utilizadas para mostrar bloques deben tener una «clave única del registro» (Record unique key). La clave única del registro se utiliza para localizar un registro en los bloques de página; normalmente se selecciona la clave primaria o un campo único.

En el caso de vistas, tablas sin clave primaria o tablas con claves primarias compuestas, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan crearse correctamente o que no puedan visualizarse ni editarse los registros. Para obtener más información, consulta [Base de datos principal / Editar tabla de datos](../main/index.md).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)